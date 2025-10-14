/* =========================
   ITEMS: edit this list
========================= */
const ITEMS = [
  "Red Onion","Yellow Onion","Jalapeno","Orange","Lemon","Lemon Juice","Soybean Oil",
  "Mushroom","Ginger","Cucumber","Spring Mix","Carrot","Avocado","Green Onion","Garlic",
  "To-Go Bag","Trash Bag","To-Go (Rice)","Chef Glove (M)","Chef Glove (L)","Poly Glove",
  "Celery","Zucchini","Broccoli","Egg (Box)","Drink (Photo)","Spray Oil","Chili Sambal",
  "Sriracha","Folk","Spoon","12 Warp","18 Warp","Straw","Dinner Napkin","Emp Napkin",
  "Degreaser","Dish Soap","Foil Wrap","Cream Cheese","Corn"
];
// Sort A→Z (case-insensitive)
const ITEMS_SORTED = [...ITEMS].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

/* =========================
   Storage keys + initial refs
========================= */
const STORAGE_SELECTED = "inventoryChecklistSelected";
const STORAGE_WHO      = "inventoryWho";
const STORAGE_NOTES    = "inventoryNotes";
const STORAGE_NEEDBY   = "inventoryNeedBy";

let selectedMap = {};
try { selectedMap = JSON.parse(localStorage.getItem(STORAGE_SELECTED)) || {}; } catch { selectedMap = {}; }

const whoEl    = document.getElementById("who");
const notesEl  = document.getElementById("notes");
const needByEl = document.getElementById("needBy");

const checklistEl   = document.getElementById("checklist");
const summaryBody   = document.getElementById("summary-body");
const totalCountEl  = document.getElementById("total-count");
const statusEl      = document.getElementById("status");
const sendAllBtn    = document.getElementById("send-all");
const clearAllBtn   = document.getElementById("clear-all");
const needByPreview = document.getElementById("needby-preview");

const postSendArea  = document.getElementById("post-send-actions");
const confirmNewBtn = document.getElementById("confirm-new");

const saveSelected = () =>
  localStorage.setItem(STORAGE_SELECTED, JSON.stringify(selectedMap));
const setStatus = (t, ok=true) => {
  statusEl.textContent = t;
  statusEl.style.color = ok ? "var(--success)" : "var(--danger)";
};

/* =========================
   Load & persist header fields
========================= */
whoEl.value    = localStorage.getItem(STORAGE_WHO)    || "";
notesEl.value  = localStorage.getItem(STORAGE_NOTES)  || "";
needByEl.value = localStorage.getItem(STORAGE_NEEDBY) || "";

whoEl.addEventListener("input",    () => localStorage.setItem(STORAGE_WHO,    whoEl.value));
notesEl.addEventListener("input",  () => localStorage.setItem(STORAGE_NOTES,  notesEl.value));
needByEl.addEventListener("input", () => {
  localStorage.setItem(STORAGE_NEEDBY, needByEl.value);
  refreshNeedByPreview();
});

function refreshNeedByPreview() {
  needByPreview.textContent = needByEl.value ? needByEl.value : "(not set)";
}

function clearHeaderFields() {
  whoEl.value = ""; notesEl.value = ""; needByEl.value = "";
  localStorage.removeItem(STORAGE_WHO);
  localStorage.removeItem(STORAGE_NOTES);
  localStorage.removeItem(STORAGE_NEEDBY);
  refreshNeedByPreview();
}

/* =========================
   Render checklist
========================= */
function renderChecklist() {
  checklistEl.innerHTML = "";
  ITEMS_SORTED.forEach((name, idx) => {
    const wrap = document.createElement("label");
    wrap.className = "check-item";
    wrap.setAttribute("for", "chk-"+idx);

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.id = "chk-"+idx;
    chk.dataset.name = name;

    const text = document.createElement("span");
    text.className = "check-label";
    text.textContent = name;

    if (selectedMap[name]) chk.checked = true;

    chk.addEventListener("change", () => {
      if (chk.checked) { selectedMap[name] = selectedMap[name] ? selectedMap[name] : 1; }
      else { delete selectedMap[name]; }
      saveSelected();
      renderSummary();
    });

    wrap.appendChild(chk);
    wrap.appendChild(text);
    checklistEl.appendChild(wrap);
  });
}

/* =========================
   Render summary table
========================= */
function renderSummary() {
  summaryBody.innerHTML = "";
  const entries = Object.entries(selectedMap);

  entries.forEach(([name, qty]) => {
    const tr = document.createElement("tr");

    // Item
    const tdName = document.createElement("td");
    tdName.textContent = name;
    tr.appendChild(tdName);

    // Qty controls: [-] [input] [+]
    const tdQty = document.createElement("td");
    const ctrl = document.createElement("div");
    ctrl.className = "qty-ctrl";

    const minus = document.createElement("button");
    minus.type = "button"; minus.className = "qty-btn"; minus.textContent = "−";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number"; qtyInput.min = "1"; qtyInput.step = "1";
    qtyInput.value = String(qty); qtyInput.className = "qty-input";
    qtyInput.setAttribute("inputmode", "numeric");
    qtyInput.setAttribute("pattern", "[0-9]*");
    qtyInput.setAttribute("enterkeyhint", "done");

    const plus = document.createElement("button");
    plus.type = "button"; plus.className = "qty-btn"; plus.textContent = "+";

    const setQty = (v) => {
      v = Math.max(1, Number(v) || 1);
      qtyInput.value = v;
      selectedMap[name] = v;
      saveSelected();
    };
    minus.addEventListener("click", () => setQty(Number(qtyInput.value) - 1));
    plus.addEventListener("click",  () => setQty(Number(qtyInput.value) + 1));
    const syncQty = () => setQty(qtyInput.value);
    qtyInput.addEventListener("input",  syncQty);
    qtyInput.addEventListener("change", syncQty);
    qtyInput.addEventListener("touchend", () => { qtyInput.focus(); }, { passive: true });

    ctrl.appendChild(minus); ctrl.appendChild(qtyInput); ctrl.appendChild(plus);
    tdQty.appendChild(ctrl); tr.appendChild(tdQty);

    // Remove
    const tdRemove = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "remove-btn"; btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      delete selectedMap[name]; saveSelected();
      renderChecklist(); renderSummary();
    });
    tdRemove.appendChild(btn); tr.appendChild(tdRemove);

    summaryBody.appendChild(tr);
  });

  totalCountEl.textContent = `${entries.length} item(s) selected`;
}

/* =========================
   Send All / Clear All
========================= */
sendAllBtn.addEventListener("click", async () => {
  const items = Object.entries(selectedMap).map(([item, quantity]) => ({
    item, quantity,
    who:    whoEl.value.trim(),
    notes:  notesEl.value.trim(),
    needBy: needByEl.value
  }));

  if (items.length === 0) { setStatus("No items selected.", false); return; }
  if (!window.SCRIPT_URL) { setStatus("Missing SCRIPT_URL in config.js", false); return; }

  const fd = new FormData();
  fd.append("inventory", JSON.stringify(items));

  sendAllBtn.disabled = true; clearAllBtn.disabled = true;
  const original = sendAllBtn.textContent; sendAllBtn.textContent = "Sending...";

  let ok = false;
  try {
    const res = await fetch(SCRIPT_URL, { method:"POST", body:fd });
    ok = res.ok;
    try { const j = await res.json(); ok = !!(j && j.ok); } catch(_) {}
  } catch (e) {
    try { await fetch(SCRIPT_URL, { method:"POST", body:fd, mode:"no-cors" }); ok = true; } catch(_) { ok = false; }
  }

  if (ok) {
    selectedMap = {};
    localStorage.setItem(STORAGE_SELECTED, JSON.stringify(selectedMap));
    renderChecklist();
    renderSummary();
    setStatus("Sent! Emailed + saved to Google Sheet ✅", true);
    postSendArea.style.display = "flex";
  } else {
    setStatus("Error sending. Check your Apps Script.", false);
  }

  sendAllBtn.disabled = false; clearAllBtn.disabled = false;
  sendAllBtn.textContent = original;
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all selections from this device?")) return;
  selectedMap = {};
  localStorage.setItem(STORAGE_SELECTED, JSON.stringify(selectedMap));
  renderChecklist();
  renderSummary();
  setStatus("All cleared.", true);
});

// After successful send, you can clear header fields manually
confirmNewBtn.addEventListener("click", () => {
  clearHeaderFields();
  postSendArea.style.display = "none";
  setStatus("Ready for a new order.", true);
});

/* =========================
   Initial render
========================= */
function initDefaultNeedBy() {
  // (Optional) auto-set needBy to +3 days. Keep commented unless you want it:
  // if (!needByEl.value) { const d = new Date(); d.setDate(d.getDate()+3);
  //   const iso = d.toISOString().slice(0,10); needByEl.value = iso;
  //   localStorage.setItem(STORAGE_NEEDBY, iso); refreshNeedByPreview(); }
}

renderChecklist();
renderSummary();
refreshNeedByPreview();
initDefaultNeedBy();
