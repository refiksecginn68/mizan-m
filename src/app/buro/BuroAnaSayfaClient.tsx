"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, CheckSquare, Square, Trash2, Clock, AlertTriangle } from "lucide-react";
import MicButton from "@/components/ui/MicButton";

type Oncelik = "dusuk" | "orta" | "yuksek";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  dueAt?: string; // ISO datetime string
  priority: Oncelik;
}

const ONCELIK_CFG: Record<Oncelik, { label: string; dot: string; text: string }> = {
  yuksek: { label: "Yüksek", dot: "bg-red-500", text: "text-red-600" },
  orta:   { label: "Orta",   dot: "bg-blue-400", text: "text-blue-600" },
  dusuk:  { label: "Düşük",  dot: "bg-gray-400", text: "text-gray-500" },
};
const ONCELIK_SIRA: Record<Oncelik, number> = { yuksek: 0, orta: 1, dusuk: 2 };
const ONCELIK_DONGU: Oncelik[] = ["orta", "yuksek", "dusuk"];

function normOncelik(v: unknown): Oncelik {
  return v === "yuksek" || v === "dusuk" || v === "orta" ? v : "orta";
}

// Göreceli zaman rozeti: "Bugün 14:30", "Yarın 09:00", "3 gün sonra".
function formatDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const saat = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const bugun = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hedef = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const gun = Math.round((hedef.getTime() - bugun.getTime()) / 86400000);
  if (gun === 0) return `Bugün ${saat}`;
  if (gun === 1) return `Yarın ${saat}`;
  if (gun === -1) return `Dün ${saat}`;
  if (gun < 0) return `${Math.abs(gun)} gün önce`;
  return `${gun} gün sonra`;
}
// Tam tarih (tooltip için).
function fullDue(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

export default function BuroAnaSayfaClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [oncelik, setOncelik] = useState<Oncelik>("orta");
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Sesli yazım: dinleme başladığındaki metin taban alınır, interim üstüne yazılır
  const micBase = useRef("");

  useEffect(() => {
    fetch("/api/buro/gorevler")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.todos)) {
          setTodos(d.todos.map((t: { id: string; text: string; done: boolean; due_at: string | null; priority?: string }) => ({
            id: t.id, text: t.text, done: t.done, dueAt: t.due_at || undefined, priority: normOncelik(t.priority),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sıralama: tamamlananlar en altta. Aktifler arasında geçmiş/gecikmiş EN ÜSTTE,
  // sonra tarih+saat artan (en yakın önce), aynı ana denk gelende aciliyet yüksek üstte.
  const simdi = Date.now();
  const gecikmisMi = (t: Todo) => !t.done && !!t.dueAt && new Date(t.dueAt!).getTime() < simdi;
  const sorted = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ag = gecikmisMi(a), bg = gecikmisMi(b);
    if (ag !== bg) return ag ? -1 : 1;
    if (a.dueAt && b.dueAt) {
      const d = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (d !== 0) return d;
      return ONCELIK_SIRA[a.priority] - ONCELIK_SIRA[b.priority];
    }
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return ONCELIK_SIRA[a.priority] - ONCELIK_SIRA[b.priority];
  });

  async function add() {
    const text = input.trim();
    if (!text) return;
    const dueIso = dueAt ? new Date(dueAt).toISOString() : undefined;
    const secilenOncelik = oncelik;
    setInput("");
    setDueAt("");
    setOncelik("orta");
    setShowDatePicker(false);
    const res = await fetch("/api/buro/gorevler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, due_at: dueIso, priority: secilenOncelik }),
    });
    const d = await res.json().catch(() => null);
    if (d?.todo) {
      setTodos((t) => [...t, { id: d.todo.id, text: d.todo.text, done: d.todo.done, dueAt: d.todo.due_at || undefined, priority: normOncelik(d.todo.priority) }]);
    }
  }

  function toggle(id: string) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    setTodos((t) => t.map((x) => x.id === id ? { ...x, done: !x.done } : x));
    fetch("/api/buro/gorevler", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !todo.done }),
    }).catch(() => {});
  }

  function remove(id: string) {
    setTodos((t) => t.filter((todo) => todo.id !== id));
    fetch(`/api/buro/gorevler?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  const minDatetime = new Date().toISOString().slice(0, 16);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <CheckSquare className="w-4 h-4 text-[#c9a84c]" />
        <h2 className="font-heading text-sm font-bold text-[#0f1729]">Yapılacaklar</h2>
        <span className="ml-auto text-[10px] bg-[#c9a84c]/10 text-[#c9a84c] font-semibold px-2 py-0.5 rounded-full">
          {todos.filter((t) => !t.done).length} bekliyor
        </span>
      </div>

      {/* Input */}
      <div className="border-b border-gray-50">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Görev ekle..."
            className="flex-1 text-xs bg-transparent text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
          <MicButton
            onStart={() => { micBase.current = input ? input.trimEnd() + " " : ""; }}
            onTranscript={(t) => { micBase.current += t; setInput(micBase.current); }}
            onInterim={(t) => setInput(micBase.current + t)}
            title="Görevi sesle yazın"
            className="w-6 h-6 flex-shrink-0" />
          <button
            type="button"
            onClick={() => setOncelik((o) => ONCELIK_DONGU[(ONCELIK_DONGU.indexOf(o) + 1) % ONCELIK_DONGU.length])}
            className="flex items-center gap-1 px-1.5 h-6 rounded-lg text-[10px] font-semibold transition-colors flex-shrink-0 hover:bg-gray-100"
            title={`Öncelik: ${ONCELIK_CFG[oncelik].label} (değiştirmek için tıkla)`}
          >
            <span className={`w-2 h-2 rounded-full ${ONCELIK_CFG[oncelik].dot}`} />
            <span className={ONCELIK_CFG[oncelik].text}>{ONCELIK_CFG[oncelik].label}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
              dueAt ? "bg-[#c9a84c]/20 text-[#c9a84c]" : "text-gray-300 hover:text-[#c9a84c]"
            }`}
            title="Tarih & saat ekle"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={add}
            disabled={!input.trim()}
            className="w-6 h-6 rounded-lg bg-[#c9a84c] flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#e7b743] transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {showDatePicker && (
          <div className="px-3 pb-2.5 flex items-center gap-2">
            <input
              type="datetime-local"
              min={minDatetime}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-[#c9a84c]/50 bg-gray-50"
            />
            {dueAt && (
              <button onClick={() => setDueAt("")} className="text-[10px] text-gray-400 hover:text-red-400">Temizle</button>
            )}
          </div>
        )}
      </div>

      {/* Liste */}
      <div className="p-2 space-y-0.5 max-h-44 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            {loading ? "Yükleniyor..." : "Bugün için planlanmış bir iş yok. İlk işi ekleyin."}
          </p>
        )}
        {sorted.map((todo) => {
          const gecikti = gecikmisMi(todo);
          return (
            <div
              key={todo.id}
              className={`flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 group transition-opacity duration-300 ${
                todo.done ? "opacity-40" : "opacity-100"
              }`}
            >
              <button onClick={() => toggle(todo.id)} className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-[#c9a84c] transition-colors" aria-label={todo.done ? "Tamamlanmadı işaretle" : "Tamamlandı işaretle"}>
                {todo.done
                  ? <CheckSquare className="w-4 h-4 text-[#c9a84c]" />
                  : <Square className="w-4 h-4" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <span className={`flex items-center gap-1.5 text-xs ${todo.done ? "line-through text-gray-300" : "text-gray-700"}`}>
                  {!todo.done && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ONCELIK_CFG[todo.priority].dot}`}
                      title={`Öncelik: ${ONCELIK_CFG[todo.priority].label}`} />
                  )}
                  <span className="truncate">{todo.text}</span>
                </span>
                {todo.dueAt && !todo.done && (
                  <span
                    title={fullDue(todo.dueAt)}
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${
                      gecikti ? "text-red-600" : "text-[#c9a84c]"
                    }`}
                  >
                    {gecikti ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                        <AlertTriangle className="w-2.5 h-2.5" /> Gecikti
                      </span>
                    ) : (
                      <>
                        <Clock className="w-2.5 h-2.5" />
                        {formatDue(todo.dueAt)}
                      </>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(todo.id)}
                className="hidden group-hover:flex text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                aria-label="Görevi sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
