// Overlay de diagnostic temporaire pour traquer les bugs d'autoplay/
// déclenchement vidéo signalés sur mobile réel, mais pas reproductibles en
// émulation (voir CLAUDE.md — "confirmé via panneau de diagnostic sur un
// vrai iPhone, non reproductible en Chromium/Playwright"). Inactif par
// défaut (no-op) : ne s'active qu'avec ?debug=1 dans l'URL, une fois activé
// ça persiste ensuite via localStorage pour ne pas avoir à rajouter le
// paramètre à chaque reload. Purement un outil de mise au point, à retirer
// une fois le diagnostic terminé — pas destiné à rester en prod.
(function () {
  var params = new URLSearchParams(location.search);
  var enabled =
    params.has("debug") || localStorage.getItem("handwrite-debug") === "1";

  if (!enabled) {
    window.__dbg = function () {};
    return;
  }
  localStorage.setItem("handwrite-debug", "1");

  var panel = document.createElement("div");
  panel.id = "__debug-overlay";
  panel.style.cssText = [
    "position:fixed",
    "left:0",
    "right:0",
    "bottom:0",
    "max-height:42vh",
    "overflow-y:auto",
    "background:rgba(0,0,0,0.88)",
    "color:#5fff5f",
    "font:10px/1.4 monospace",
    "padding:6px 8px",
    "z-index:999999",
    "white-space:pre-wrap",
    "word-break:break-word",
  ].join(";");

  var lines = [];
  function render() {
    if (!panel.isConnected) return;
    panel.textContent = lines.join("\n");
    panel.scrollTop = panel.scrollHeight;
  }

  window.__dbg = function (msg) {
    var t = (performance.now() / 1000).toFixed(2);
    lines.push("[" + t + "s] " + msg);
    if (lines.length > 60) lines.shift();
    render();
  };

  window.addEventListener("error", function (e) {
    window.__dbg("JS ERROR: " + e.message);
  });

  document.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(panel);
    render();
  });
})();
