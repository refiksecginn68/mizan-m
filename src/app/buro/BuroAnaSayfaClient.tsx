"use client";

import { useState } from "react";
import { Plus, CheckSquare, Square, Trash2 } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const DEMO_TODOS: Todo[] = [
  { id: "1", text: "2024/1234 dosyasını hazırla", done: false },
  { id: "2", text: "Yeni müvekkil sözleşmesi imzalat", done: true },
  { id: "3", text: "Temyiz dilekçesini tamamla", done: false },
];

export default function BuroAnaSayfaClient() {
  const [todos, setTodos] = useState<Todo[]>(DEMO_TODOS);
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    setTodos((t) => [...t, { id: Date.now().toString(), text: input.trim(), done: false }]);
    setInput("");
  }

  function toggle(id: string) {
    setTodos((t) => t.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
  }

  function remove(id: string) {
    setTodos((t) => t.filter((todo) => todo.id !== id));
  }

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
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Görev ekle..."
          className="flex-1 text-xs bg-transparent text-gray-700 placeholder:text-gray-300 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="w-6 h-6 rounded-lg bg-[#c9a84c] flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#e7b743] transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Liste */}
      <div className="p-2 space-y-0.5 max-h-48 overflow-y-auto">
        {todos.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Görev yok</p>
        )}
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 group transition-colors">
            <button onClick={() => toggle(todo.id)} className="flex-shrink-0 text-gray-400 hover:text-[#c9a84c] transition-colors">
              {todo.done
                ? <CheckSquare className="w-4 h-4 text-[#c9a84c]" />
                : <Square className="w-4 h-4" />
              }
            </button>
            <span className={`flex-1 text-xs ${todo.done ? "line-through text-gray-300" : "text-gray-700"}`}>
              {todo.text}
            </span>
            <button
              onClick={() => remove(todo.id)}
              className="hidden group-hover:flex text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
