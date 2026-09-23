"use client";

import { useEffect, useState } from "react";
import { savePushSubscriptionAction, removePushSubscriptionAction } from "@/actions/notifications";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

type Status = "checking" | "unsupported" | "no-key" | "off" | "on" | "denied";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        setStatus("no-key");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    }
    check();
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }),
        8000
      );

      const json = sub.toJSON();
      await savePushSubscriptionAction({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });
      setStatus("on");
    } catch {
      setError(
        "Não foi possível ativar as notificações push agora. Verifique sua conexão e tente novamente."
      );
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") return null;
  if (status === "unsupported") {
    return <p className="text-xs text-muted">Notificações push não suportadas neste navegador.</p>;
  }
  if (status === "no-key") {
    return <p className="text-xs text-muted">Notificações push não configuradas.</p>;
  }
  if (status === "denied") {
    return (
      <p className="text-xs text-muted">
        Notificações bloqueadas nas permissões do navegador.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {status === "on" ? (
        <button type="button" onClick={disable} disabled={busy} className="btn-secondary self-start py-1.5 text-xs">
          {busy ? "..." : "🔕 Desativar notificações push"}
        </button>
      ) : (
        <button type="button" onClick={enable} disabled={busy} className="btn-primary self-start py-1.5 text-xs">
          {busy ? "..." : "🔔 Ativar notificações push"}
        </button>
      )}
      {error && <p className="text-xs text-status-bloqueado">{error}</p>}
    </div>
  );
}
