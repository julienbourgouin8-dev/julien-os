// Sur un vrai iPhone (non reproductible en émulateur/desktop), une <video>
// qui démarre en autoplay peut rester visuellement figée sur sa toute
// première frame alors qu'elle décode et avance bien en interne
// (currentTime progresse, readyState atteint 4) — le calque composé par
// WebKit n'est simplement jamais repeint tout seul après le démarrage. Un
// scroll/swipe suffit à forcer ce repaint comme effet de bord, ce qui donne
// l'impression que "la vidéo n'avance qu'en glissant l'écran" (déjà identifié
// pour le hero/drone via le retrait de will-change/transform sur mobile dans
// scrollvid.css — mais le figement peut se reproduire même sans ces
// propriétés). On force ce repaint nous-mêmes dès que chaque vidéo démarre
// réellement, sans attendre un geste de l'utilisateur.
if (window.matchMedia("(max-width: 768px)").matches) {
  // Écrase-puis-restaure un transform inline en dur cassait toute règle CSS
  // (ex: le zoom mobile de .stove__video dans stove.css, voir la note
  // "bordures" là-bas) : le transform inline gagne toujours sur une règle de
  // feuille de style, donc la restauration vers "" (chaîne vide) ne
  // redonnait jamais la main au scale CSS — visible pendant toute la durée
  // où le style inline restait posé. On compose avec le transform déjà
  // appliqué (lu via getComputedStyle) et on restaure exactement la valeur
  // inline d'origine (généralement vide, ce qui rend la main au CSS)
  // plutôt qu'une chaîne vide en dur.
  //
  // Un double rAF pour repeindre puis nettoyer a été rapporté bloqué —
  // jusqu'à over 1s de retard mesuré ici pile pendant le démarrage vidéo +
  // verrouillage de scroll (#poele), qui charge lourdement le thread
  // principal au même instant. Un filet de sécurité en setTimeout nettoie
  // quoi qu'il arrive si le rAF met trop de temps à se déclencher.
  function nudgeRepaint(video) {
    const originalInline = video.style.transform;
    const computed = getComputedStyle(video).transform;
    const base = computed && computed !== "none" ? computed : "";
    video.style.transform = (base + " translateZ(0)").trim();

    let cleared = false;
    function clear() {
      if (cleared) return;
      cleared = true;
      video.style.transform = originalInline;
    }
    requestAnimationFrame(() => requestAnimationFrame(clear));
    setTimeout(clear, 400);
  }

  document.querySelectorAll("video").forEach((video) => {
    video.addEventListener("playing", () => nudgeRepaint(video), { once: true });
  });
}
