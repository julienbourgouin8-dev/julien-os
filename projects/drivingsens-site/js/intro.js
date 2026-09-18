(function () {
  var intro = document.getElementById("intro");
  if (!intro) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("is-locked");
  var unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    document.documentElement.classList.remove("is-locked");
    intro.classList.add("is-done");
    document.dispatchEvent(new CustomEvent("introreveal"));
    document.dispatchEvent(new CustomEvent("introfinished"));
  }
  // Safety net: whatever happens (slow device, a future bug), never leave
  // the page permanently locked behind the overlay.
  setTimeout(unlock, 4500);

  if (reduced) {
    intro.classList.remove("is-scattered");
    setTimeout(function () {
      intro.classList.add("is-departing");
      document.dispatchEvent(new CustomEvent("introreveal"));
      setTimeout(unlock, 300);
    }, 350);
    return;
  }

  var HOLD_BEFORE_ASSEMBLE = 250; // scattered pieces visible briefly first
  var ASSEMBLE_DURATION = 900; // longest piece transition + its delay
  var HOLD_ASSEMBLED = 550; // assembled logo sits still
  var DEPART_DURATION = 700;

  requestAnimationFrame(function () {
    setTimeout(function () {
      intro.classList.remove("is-scattered");
    }, HOLD_BEFORE_ASSEMBLE);
  });

  var departAt = HOLD_BEFORE_ASSEMBLE + ASSEMBLE_DURATION + HOLD_ASSEMBLED;
  setTimeout(function () {
    intro.classList.add("is-departing");
    document.dispatchEvent(new CustomEvent("introreveal"));
  }, departAt);

  setTimeout(unlock, departAt + DEPART_DURATION);
})();
