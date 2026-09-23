"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notifications";
import { useRealtime } from "@/hooks/use-realtime";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
};

const TYPE_ICON: Record<string, string> = {
  NOVA_VIAGEM: "✈️",
  ALTERACAO: "🔄",
  VOO: "🛫",
  MONTAGEM: "🔧",
  PROBLEMA: "⚠️",
  PROGRESSO: "📈",
  MENSAGEM: "📢",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetchNotificationsAction();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(null, load);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (unreadCount > 0) {
      await markAllNotificationsReadAction();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-lg hover:bg-brand-primary-light"
        aria-label="Notificações"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-bloqueado px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-80 max-w-[90vw] rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase text-muted">Notificações</p>
          {notifications.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg px-2 py-2 text-sm ${!n.read ? "bg-brand-primary-light/40" : ""}`}
                  onClick={() => markNotificationReadAction(n.id)}
                >
                  <p className="font-medium text-foreground">
                    {TYPE_ICON[n.type] ?? "🔔"} {n.title}
                  </p>
                  <p className="text-xs text-muted">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
