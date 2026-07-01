"use client";

import { useState } from "react";
import { Plus, CheckSquare, Square, Trash2, Clock } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  dueAt?: string; // ISO datetime string
}

const DEMO_TODOS: Todo[] = [
  { id: "1", text: "2024/1234 dosyasını hazırla", done: false, dueAt: new Date(Date.now() + 86400000).toISOString() },
  { id: "2", text: "Yeni müvekkil sözleşmesi imzalat", done: true },
  { id: "3", text: "Temyiz dilekçesini tamamla", done: false, dueAt: new Date(Date.now() + 3600000 * 3).toISOString() },
];

function formatDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return "Gecikmiş";
  if (diff < 3600000) return `${Math.ceil(diff / 60000)} dk`;
  if (diff < 86400000) return `${Math.ceil(diff / 3600000)} sa`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function BuroAnaSayfaClient() {
  const [todos, setTodos] = useState<Todo[]>(DEMO_TODOS);
  const [input, setInput] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const sorted = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return 0;
  });

  function add() {
    if (!input.trim()) return;
    setTodos((t) => [...t, {
      id: Date.now().toString(),
      text: input.trim(),
      done: false,
      dueAt: dueAt || undefined,
    }]);
    setInput("");
    setDueAt("");
    setShowDatePicker(false);
  }

  function toggle(id: string) {
    setTodos((t) => t.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
  }

  function remove(id: string) {
    setTodos((t) => t.filter((todo) => todo.id !== id));
  }

  const minDatetime = new Date().toISOString().slice(0, 16);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50">
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
      <div className="p-2 space-y-0.5 max-h-52 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Görev yok</p>
        )}
        {sorted.map((todo) => (
          <div key={todo.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 group transition-colors">
            <button onClick={() => toggle(todo.id)} className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-[#c9a84c] transition-colors">
              {todo.done
                ? <CheckSquare className="w-4 h-4 text-[#c9a84c]" />
                : <Square className="w-4 h-4" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <span className={`block text-xs truncate ${todo.done ? "line-through text-gray-300" : "text-gray-700"}`}>
                {todo.text}
              </span>
              {todo.dueAt && !todo.done && (
                <span className={`text-[10px] font-medium ${
                  new Date(todo.dueAt) < new Date() ? "text-red-400" : "text-[#c9a84c]"
                }`}>
                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                  {formatDue(todo.dueAt)}
                </span>
              )}
            </div>
            <button
              onClick={() => remove(todo.id)}
              className="hidden group-hover:flex text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
