// Mizanım UYAP + UETS Aktarım — popup
let davalar = [];
let tebligatlar = [];
let mode = "uyap"; // aktif sekmeye göre: uyap | uets

const $ = (id) => document.getElementById(id);

function setStatus(el, text, cls) {
  el.textContent = text;
  el.className = "status " + cls;
}

async function verify() {
  const res = await chrome.runtime.sendMessage({ type: "MIZANIM_VERIFY" });
  if (res && res.ok) {
    $("connStatus").textContent = "Bağlı: Av. " + (res.lawyerName || "");
    setStatus($("tokenStatus"), "Bağlantı doğrulandı ✓", "ok");
    return true;
  }
  $("connStatus").textContent = "Bağlı değil";
  if (res && res.error) setStatus($("tokenStatus"), res.error, "err");
  return false;
}

async function scan() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = (tab && tab.url) || "";

  // Sekmeye göre mod: UYAP dosyaları veya UETS tebligatları
  if (url.includes("uyap.gov.tr")) mode = "uyap";
  else if (url.includes("etebligat.gov.tr") || url.includes("uets.ptt.gov.tr")) mode = "uets";
  else {
    setStatus($("transferStatus"), "Bu sekme UYAP veya UETS sayfası değil. Portalı açıp tekrar deneyin.", "err");
    $("count").textContent = "0";
    return;
  }
  $("modeLabel").textContent = mode === "uyap" ? "UYAP Dosyaları" : "UETS e-Tebligatları";

  try {
    if (mode === "uyap") {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "MIZANIM_SCAN" });
      if (!res || !res.ok) throw new Error("okunamadı");
      davalar = res.davalar || [];
      $("count").textContent = String(davalar.length);
      const list = $("list");
      list.innerHTML = "";
      davalar.slice(0, 20).forEach((d) => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "<b>" + d.esasNo + "</b> " + (d.mahkemeAdi || "") + (d.davaTuru ? " · " + d.davaTuru : "");
        list.appendChild(div);
      });
      $("transfer").disabled = davalar.length === 0;
      if (davalar.length === 0) {
        setStatus($("transferStatus"), "Bu sayfada dosya bulunamadı. Dosya sorgulama listesini açıp tekrar tarayın.", "info");
      } else {
        $("transferStatus").className = "status";
      }
    } else {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "MIZANIM_SCAN_UETS" });
      if (!res || !res.ok) throw new Error("okunamadı");
      tebligatlar = res.tebligatlar || [];
      $("count").textContent = String(tebligatlar.length);
      const list = $("list");
      list.innerHTML = "";
      tebligatlar.slice(0, 20).forEach((t) => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "<b>" + (t.tebligTarihi || "?") + "</b> " + (t.gonderen || "") +
          "<br><span style='color:#888'>" + (t.konu || "").slice(0, 70) + "</span>";
        list.appendChild(div);
      });
      $("transfer").disabled = tebligatlar.length === 0;
      if (tebligatlar.length === 0) {
        setStatus($("transferStatus"), "Bu sayfada tebligat bulunamadı. Tebligat listesini açıp tekrar tarayın.", "info");
      } else {
        $("transferStatus").className = "status";
      }
    }
  } catch (e) {
    setStatus($("transferStatus"), "Sayfa okunamadı (içerik betiği yüklü değil). Sayfayı yenileyin.", "err");
  }
}

$("saveToken").addEventListener("click", async () => {
  const token = $("token").value.trim();
  if (!token) return setStatus($("tokenStatus"), "Kod boş olamaz", "err");
  await chrome.storage.local.set({ token });
  setStatus($("tokenStatus"), "Doğrulanıyor...", "info");
  await verify();
});

$("scan").addEventListener("click", scan);

$("transfer").addEventListener("click", async () => {
  $("transfer").disabled = true;
  setStatus($("transferStatus"), "Aktarılıyor...", "info");
  let res;
  if (mode === "uets") {
    if (tebligatlar.length === 0) return;
    res = await chrome.runtime.sendMessage({ type: "MIZANIM_TRANSFER_UETS", tebligatlar });
  } else {
    if (davalar.length === 0) return;
    res = await chrome.runtime.sendMessage({ type: "MIZANIM_TRANSFER", davalar });
  }
  if (res && res.ok) {
    setStatus($("transferStatus"), `✓ ${res.eklendi} yeni, ${res.guncellendi} güncellendi` + (res.hata ? `, ${res.hata} hata` : ""), "ok");
  } else {
    setStatus($("transferStatus"), (res && res.error) || "Aktarım başarısız", "err");
    $("transfer").disabled = false;
  }
});

// Açılışta: kayıtlı token varsa doğrula + otomatik tara
(async () => {
  const data = await chrome.storage.local.get(["token"]);
  if (data.token) {
    $("token").value = data.token;
    verify();
  }
  scan();
})();
