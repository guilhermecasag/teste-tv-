"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { href: "/admin/clientes", label: "Clientes", icon: "🏢" },
  { href: "/admin/montadores", label: "Montadores", icon: "🧰" },
  { href: "/admin/usuarios", label: "Usuários", icon: "👤" },
];

export function AdminMoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-brand-primary-light hover:text-brand-primary"
      >
        ☰ Mais
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-brand-primary-light hover:text-brand-primary"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
