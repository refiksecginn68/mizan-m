"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Scale, AlertCircle, Info } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  durusma: Scale,
  sure: AlertCircle,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/buro/bildirimler");
      if (!res.ok) return;
      const d = await res.json();
      setNotifications(d.notifications ?? []);
      setUnread(d.unread ?? 0);
    } catch { /* yoksay */ }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    setUnread(0);
    setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
    fetch("/api/buro/bildirimler", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  return (
    <div ref={ref} className="fixed top-3 right-4 z-40">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#c9a84c] transition-colors"
        title="Bildirimler"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="font-heading text-sm font-bold text-[#0f1729]">Bildirimler</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-[#c9a84c] hover:underline font-semibold">
                Tümünü okundu işaretle
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Bildirim yok</p>
            )}
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] || Info;
              return (
                <div key={n.id} className={`flex items-start gap-2.5 px-4 py-3 border-b border-gray-50 ${n.is_read ? "opacity-60" : "bg-[#c9a84c]/5"}`}>
                  <Icon className="w-3.5 h-3.5 text-[#c9a84c] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.created_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
