"use client";

// Dilekçe için zengin metin editörü (TipTap/ProseMirror).
// Biçimlendirme HTML olarak dışa verilir; Word/UDF/PDF export'ları bu HTML'i okur.

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Palette, Highlighter,
  Undo2, Redo2, Type, IndentIncrease, IndentDecrease,
} from "lucide-react";

// TipTap'te hazır girinti eklentisi yok — paragraf/başlığa margin-left attribute'u ekler
const Girinti = Extension.create({
  name: "girinti",
  addOptions() {
    return { types: ["paragraph", "heading"], adim: 40, maks: 240 };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => parseInt(el.style.marginLeft || "0", 10) || 0,
            renderHTML: (attrs) =>
              attrs.indent ? { style: `margin-left:${attrs.indent}px` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    const { adim, maks, types } = this.options as { adim: number; maks: number; types: string[] };
    const uygula =
      (yon: 1 | -1) =>
      () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ editor, commands }: any) => {
        const tur = types.find((t) => editor.isActive(t));
        if (!tur) return false;
        const mevcut = (editor.getAttributes(tur).indent as number) || 0;
        const yeni = Math.min(Math.max(mevcut + yon * adim, 0), maks);
        if (yeni === mevcut) return false;
        return commands.updateAttributes(tur, { indent: yeni });
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { girintiArtir: uygula(1), girintiAzalt: uygula(-1) } as any;
  },
});

const FONTLAR = [
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Calibri, sans-serif", label: "Calibri" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
];

const PUNTOLAR = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36];
const VARSAYILAN_PUNTO = 12;

const SATIR_ARALIKLARI = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "1.8", label: "1.8" },
  { value: "2", label: "2.0" },
];

const RENK_PALETI = [
  "#000000", "#374151", "#6b7280", "#9ca3af",
  "#7f1d1d", "#dc2626", "#ea580c", "#d97706",
  "#166534", "#16a34a", "#0d9488", "#0284c7",
  "#1e3a8a", "#2563eb", "#7c3aed", "#a21caf",
  "#c9a84c", "#92400e", "#e11d48", "#ffffff",
];

const VURGU_PALETI = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8",
  "#fed7aa", "#e9d5ff", "#fecaca", "transparent",
];

interface Props {
  html: string;
  onChange: (html: string, metin: string) => void;
  duzenlenebilir?: boolean;
}

function Dugme({
  aktif, onClick, title, children,
}: { aktif?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={!!aktif}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
        aktif ? "bg-[#7c3aed] text-white" : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function DilekceEditor({ html, onChange, duzenlenebilir = true }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: duzenlenebilir,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Girinti,
    ],
    content: html,
    editorProps: {
      attributes: {
        class:
          "prose-dilekce w-full min-h-[600px] focus:outline-none text-gray-800 " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
        style: "font-family:'Times New Roman',serif; font-size:12pt; line-height:1.8;",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML(), ed.getText({ blockSeparator: "\n" }));
    },
  });

  // Dış kaynaklı içerik (AI stream, şablon yükleme) editöre yansıtılır.
  // Kullanıcının kendi yazdığı değişiklik geri yazılmaz — imleç zıplamasın.
  useEffect(() => {
    if (!editor) return;
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, editor]);

  if (!editor) return null;

  // Her çağrıda YENİ zincir — TipTap zinciri .run() ile tüketilir, yeniden kullanılamaz
  const cmd = () => editor.chain().focus();
  // Punto pt biriminde tutulur: açılır listede "12pt" seçen kullanıcı Word/PDF/UDF'te de
  // 12pt almalı. (px kullanılsaydı export'ta 0.75 katsayısıyla küçülürdü.)
  const aktifPunto =
    (editor.getAttributes("textStyle").fontSize as string | undefined)?.replace(/p[tx]$/, "")
    ?? String(VARSAYILAN_PUNTO);
  const aktifFont =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? FONTLAR[0].value;

  function puntoDegistir(delta: number) {
    const yeni = Math.min(Math.max(Number(aktifPunto) + delta, 8), 72);
    editor!.chain().focus().setFontSize(`${yeni}pt`).run();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5 flex-shrink-0 flex-wrap">
        {/* Geri al / Yinele */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2">
          <Dugme onClick={() => cmd().undo().run()} title="Geri Al"><Undo2 className="w-3.5 h-3.5" /></Dugme>
          <Dugme onClick={() => cmd().redo().run()} title="Yinele"><Redo2 className="w-3.5 h-3.5" /></Dugme>
        </div>

        {/* Başlık seviyesi */}
        <div className="flex items-center border-r border-gray-200 pr-2">
          <select
            value={
              editor.isActive("heading", { level: 1 }) ? "1"
              : editor.isActive("heading", { level: 2 }) ? "2"
              : editor.isActive("heading", { level: 3 }) ? "3"
              : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") cmd().setParagraph().run();
              else cmd().toggleHeading({ level: Number(v) as 1 | 2 | 3 }).run();
            }}
            title="Başlık Seviyesi"
            className="text-xs text-gray-600 border-none focus:outline-none bg-transparent"
          >
            <option value="p">Normal</option>
            <option value="1">Başlık 1</option>
            <option value="2">Başlık 2</option>
            <option value="3">Başlık 3</option>
          </select>
        </div>

        {/* Font ailesi */}
        <div className="flex items-center border-r border-gray-200 pr-2">
          <select
            value={aktifFont}
            onChange={(e) => cmd().setFontFamily(e.target.value).run()}
            title="Yazı Tipi"
            className="text-xs text-gray-600 border-none focus:outline-none bg-transparent max-w-[120px]"
          >
            {FONTLAR.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {/* Punto */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <Type className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={aktifPunto}
            onChange={(e) => cmd().setFontSize(`${e.target.value}pt`).run()}
            title="Punto"
            className="text-xs text-gray-600 border-none focus:outline-none bg-transparent"
          >
            {PUNTOLAR.map((s) => <option key={s} value={s}>{s}pt</option>)}
          </select>
          <Dugme onClick={() => puntoDegistir(1)} title="Punto Büyüt"><span className="text-xs font-bold">A+</span></Dugme>
          <Dugme onClick={() => puntoDegistir(-1)} title="Punto Küçült"><span className="text-[10px] font-bold">A−</span></Dugme>
        </div>

        {/* Kalın / İtalik / Altı çizili / Üstü çizili */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2">
          <Dugme aktif={editor.isActive("bold")} onClick={() => cmd().toggleBold().run()} title="Kalın"><Bold className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive("italic")} onClick={() => cmd().toggleItalic().run()} title="İtalik"><Italic className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive("underline")} onClick={() => cmd().toggleUnderline().run()} title="Altı Çizili"><Underline className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive("strike")} onClick={() => cmd().toggleStrike().run()} title="Üstü Çizili"><Strikethrough className="w-3.5 h-3.5" /></Dugme>
        </div>

        {/* Renk + vurgu */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2">
          <details className="relative">
            <summary className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer list-none" title="Yazı Rengi">
              <Palette className="w-3.5 h-3.5" />
            </summary>
            <div className="absolute top-8 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1 w-40">
              {RENK_PALETI.map((renk) => (
                <button key={renk} type="button" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => cmd().setColor(renk).run()} title={renk}
                  className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: renk }} />
              ))}
            </div>
          </details>
          <details className="relative">
            <summary className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer list-none" title="Vurgu Rengi">
              <Highlighter className="w-3.5 h-3.5" />
            </summary>
            <div className="absolute top-8 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-4 gap-1 w-32">
              {VURGU_PALETI.map((renk) => (
                <button key={renk} type="button" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => cmd().setBackgroundColor(renk).run()} title={renk}
                  className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: renk === "transparent" ? "#fff" : renk }} />
              ))}
            </div>
          </details>
        </div>

        {/* Hizalama */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2">
          <Dugme aktif={editor.isActive({ textAlign: "left" })} onClick={() => cmd().setTextAlign("left").run()} title="Sola Hizala"><AlignLeft className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive({ textAlign: "center" })} onClick={() => cmd().setTextAlign("center").run()} title="Ortala"><AlignCenter className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive({ textAlign: "right" })} onClick={() => cmd().setTextAlign("right").run()} title="Sağa Hizala"><AlignRight className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive({ textAlign: "justify" })} onClick={() => cmd().setTextAlign("justify").run()} title="İki Yana Yasla"><AlignJustify className="w-3.5 h-3.5" /></Dugme>
        </div>

        {/* Listeler + girinti */}
        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2">
          <Dugme aktif={editor.isActive("bulletList")} onClick={() => cmd().toggleBulletList().run()} title="Madde İşaretli Liste"><List className="w-3.5 h-3.5" /></Dugme>
          <Dugme aktif={editor.isActive("orderedList")} onClick={() => cmd().toggleOrderedList().run()} title="Numaralı Liste"><ListOrdered className="w-3.5 h-3.5" /></Dugme>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Dugme onClick={() => (cmd() as any).girintiArtir().run()} title="Girintiyi Artır"><IndentIncrease className="w-3.5 h-3.5" /></Dugme>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Dugme onClick={() => (cmd() as any).girintiAzalt().run()} title="Girintiyi Azalt"><IndentDecrease className="w-3.5 h-3.5" /></Dugme>
        </div>

        {/* Satır aralığı */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 font-semibold">Aralık</span>
          <select
            onChange={(e) => cmd().setLineHeight(e.target.value).run()}
            title="Satır Aralığı"
            defaultValue="1.8"
            className="text-xs text-gray-600 border-none focus:outline-none bg-transparent"
          >
            {SATIR_ARALIKLARI.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#1a2744] to-[#7c3aed]" />
          <div className="p-10">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
