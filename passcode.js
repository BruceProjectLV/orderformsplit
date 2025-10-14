// passcode.js – optional guard
const PASSCODE = "1234";                     // change your code here
const LS_UNLOCK_KEY = "passcodeTestUnlockedSession";

const overlayEl = document.getElementById("lock-screen");
const pinEl     = document.getElementById("pin");
const lockErr   = document.getElementById("lock-error");

// show/hide
function showLock() {
  document.body.classList.add("locked");
  overlayEl.hidden = false;
  overlayEl.style.display = "flex";
  setTimeout(() => pinEl?.focus(), 50);
}
function hideLock() {
  overlayEl.style.display = "none";
  overlayEl.hidden = true;
  document.body.classList.remove("locked");
  lockErr.textContent = "";
  try { pinEl.value = ""; } catch {}
}

// helpers
function digits() {
  return (pinEl?.value || "").replace(/\D/g, "").slice(0,4);
}
function tryUnlock() {
  const code = digits();
  if (code.length < 4) { lockErr.textContent = ""; return; }
  if (code === PASSCODE) {
    sessionStorage.setItem(LS_UNLOCK_KEY, "1");
    hideLock();
  } else {
    lockErr.textContent = "Incorrect code. Try again.";
    pinEl?.focus();
    try { pinEl?.select(); } catch {}
  }
}

// listeners
if (pinEl) {
  pinEl.addEventListener("input",  () => { pinEl.value = digits(); if (pinEl.value.length === 4) setTimeout(tryUnlock, 0); });
  pinEl.addEventListener("change", () => { pinEl.value = digits(); tryUnlock(); });
  pinEl.addEventListener("keyup",  () => { if (digits().length === 4) tryUnlock(); });
  pinEl.addEventListener("paste",  (e) => {
    const d = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g,"").slice(0,4);
    if (d) { e.preventDefault(); pinEl.value = d; tryUnlock(); }
  });
}

// show unless this tab/session already unlocked
if (overlayEl && sessionStorage.getItem(LS_UNLOCK_KEY) !== "1") showLock();
