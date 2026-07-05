// Mizanım UYAP Aktarım — popup
let davalar = [];

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
  if (!tab || !tab.url || !tab.url.includes("uyap.gov.tr")) {
    setStatus($("transferStatus"), "Bu sekme bir UYAP sayfası değil. UYAP Avukat Portal'ı açın.", "err");
    $("count").textContent = "0";
    return;
  }
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "MIZANIM_SCAN" });
    if (res && res.ok) {
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
      setStatus($("transferStatus"), "Sayfa okunamadı. Sayfayı yenileyip tekrar deneyin.", "err");
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
  if (davalar.length === 0) return;
  $("transfer").disabled = true;
  setStatus($("transferStatus"), "Aktarılıyor...", "info");
  const res = await chrome.runtime.sendMessage({ type: "MIZANIM_TRANSFER", davalar });
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
