"use client";

import { useState, useRef } from "react";
import {
  User, Camera, Save, Loader2, FileUp, FileText, CheckCircle,
  GraduationCap, Scale, Award, Heart, StickyNote, Sparkles,
} from "lucide-react";
import AktifOturumlar from "@/components/shared/AktifOturumlar";

// Uzmanlık/branş seçenekleri — çoklu seçim
const HUKUK_ALANLARI = [
  "İş ve Sosyal Güvenlik Hukuku", "Aile Hukuku", "Ceza Hukuku", "Ticaret Hukuku",
  "İcra ve İflas Hukuku", "Gayrimenkul ve Kira Hukuku", "Miras Hukuku",
  "İdare ve Vergi Hukuku", "Tüketici Hukuku", "Sigorta ve Tazminat Hukuku",
  "Fikri Mülkiyet Hukuku", "Bilişim ve KVKK", "Sağlık Hukuku", "Spor Hukuku",
  "Yabancılar ve Vatandaşlık Hukuku", "Arabuluculuk",
];

const BAROLAR = [
  "Adana", "Ankara", "Antalya", "Bursa", "Denizli", "Diyarbakır", "Eskişehir",
  "Gaziantep", "İstanbul", "İzmir", "Kayseri", "Kocaeli", "Konya", "Mersin",
  "Muğla", "Samsun", "Tekirdağ", "Trabzon", "Şanlıurfa",
];

interface ProfileDoc { name: string; path: string; url?: string | null }

interface Profile {
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bar_city: string | null;
  bar_number: string | null;
  university: string | null;
  specializations: string[] | null;
  achievements: string | null;
  hobbies: string | null;
  personal_notes: string | null;
  profile_documents: ProfileDoc[] | null;
}

export default function ProfilClient({ initialProfile }: { initialProfile: Profile }) {
  const [form, setForm] = useState({
    full_name: initialProfile.full_name ?? "",
    phone: initialProfile.phone ?? "",
    bar_city: initialProfile.bar_city ?? "",
    bar_number: initialProfile.bar_number ?? "",
    university: initialProfile.university ?? "",
    specializations: initialProfile.specializations ?? [],
    achievements: initialProfile.achievements ?? "",
    hobbies: initialProfile.hobbies ?? "",
    personal_notes: initialProfile.personal_notes ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);
  const [docs, setDocs] = useState<ProfileDoc[]>(initialProfile.profile_documents ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"" | "avatar" | "belge">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  function toggleAlan(alan: string) {
    setForm((p) => ({
      ...p,
      specializations: p.specializations.includes(alan)
        ? p.specializations.filter((a) => a !== alan)
        : [...p.specializations, alan],
    }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/buro/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      setMsg(res.ok && data.success
        ? { ok: true, text: "✓ Profil kaydedildi — MizanAI bundan sonra bu bilgileri kullanacak" }
        : { ok: false, text: data.error ?? "Kaydedilemedi" });
    } catch {
      setMsg({ ok: false, text: "Bağlantı hatası" });
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: "avatar" | "belge", file: File) {
    setUploading(kind);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/buro/profil", { method: "POST", body: fd });
      const data = await res.json() as { success?: boolean; avatar_url?: string; document?: ProfileDoc; error?: string };
      if (res.ok && data.success) {
        if (kind === "avatar" && data.avatar_url) setAvatarUrl(data.avatar_url);
        if (kind === "belge" && data.document) setDocs((p) => [...p, data.document!]);
        setMsg({ ok: true, text: kind === "avatar" ? "✓ Profil fotoğrafı güncellendi" : `✓ "${file.name}" yüklendi` });
      } else {
        setMsg({ ok: false, text: data.error ?? "Yüklenemedi" });
      }
    } catch {
      setMsg({ ok: false, text: "Bağlantı hatası" });
    } finally {
      setUploading("");
    }
  }

  return (
    <div className="space-y-5">
      {/* Foto + temel bilgiler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#c9a84c]/15 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#c9a84c]" />
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploading === "avatar"}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0f1729] text-white flex items-center justify-center hover:bg-[#1a2744] transition-colors"
              title="Fotoğraf yükle"
            >
              {uploading === "avatar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload("avatar", f); e.target.value = ""; }} />
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-[#0f1729]">Av. {form.full_name || "—"}</p>
            <p className="text-sm text-gray-400">{initialProfile.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad Soyad *</label>
            <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Telefon</label>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="05xx xxx xx xx"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Baro</label>
            <select value={form.bar_city} onChange={(e) => setForm((p) => ({ ...p, bar_city: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-[#c9a84c]">
              <option value="">Baro seçin...</option>
              {BAROLAR.map((b) => <option key={b} value={b}>{b} Barosu</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Baro Sicil No</label>
            <input value={form.bar_number} onChange={(e) => setForm((p) => ({ ...p, bar_number: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Mezun Olunan Üniversite</label>
            <input value={form.university} onChange={(e) => setForm((p) => ({ ...p, university: e.target.value }))}
              placeholder="Ör. İstanbul Üniversitesi Hukuk Fakültesi"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]" />
          </div>
        </div>
      </div>

      {/* Uzmanlık alanları */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-heading text-sm font-bold text-[#0f1729] mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c9a84c]" /> Uzmanlık / Branş Alanları
        </h3>
        <p className="text-xs text-gray-400 mb-4">MizanAI yanıtlarını bu alanlara göre uyarlar — birden fazla seçebilirsiniz</p>
        <div className="flex flex-wrap gap-2">
          {HUKUK_ALANLARI.map((alan) => (
            <button key={alan} type="button" onClick={() => toggleAlan(alan)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                form.specializations.includes(alan)
                  ? "bg-[#0f1729] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {alan}
            </button>
          ))}
        </div>
      </div>

      {/* Deneyim / hobiler / notlar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Başarılar & Deneyim</label>
          <textarea value={form.achievements} onChange={(e) => setForm((p) => ({ ...p, achievements: e.target.value }))}
            rows={3} placeholder="Ör. 15 yıllık iş hukuku deneyimi, X barosu disiplin kurulu üyeliği..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Hobiler</label>
          <textarea value={form.hobbies} onChange={(e) => setForm((p) => ({ ...p, hobbies: e.target.value }))}
            rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" /> Kişisel Notlar</label>
          <textarea value={form.personal_notes} onChange={(e) => setForm((p) => ({ ...p, personal_notes: e.target.value }))}
            rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c] resize-none" />
        </div>
      </div>

      {/* Ekstra belgeler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-bold text-[#0f1729] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#c9a84c]" /> Belgeler (diploma, sertifika vb.)
          </h3>
          <button onClick={() => docRef.current?.click()} disabled={uploading === "belge"}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
            {uploading === "belge" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
            Belge Yükle
          </button>
          <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload("belge", f); e.target.value = ""; }} />
        </div>
        {docs.length === 0 ? (
          <p className="text-xs text-gray-400">Henüz belge yüklenmedi</p>
        ) : (
          <ul className="space-y-2">
            {docs.map((d, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {d.url ? <a href={d.url} target="_blank" rel="noreferrer" className="hover:text-[#c9a84c] hover:underline truncate">{d.name}</a> : <span className="truncate">{d.name}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#0f1729] text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-[#1a2744] transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Profili Kaydet
      </button>

      {/* Güvenlik: aktif oturumlar */}
      <AktifOturumlar />
    </div>
  );
}
