(function () {
  var body = document.body;
  var pistes = [].slice.call(document.querySelectorAll(".piste"));
  var buttons = [].slice.call(document.querySelectorAll("[data-piste]"));
  var switcher = document.getElementById("switcher");
  var toggle = switcher.querySelector(".switcher__toggle");
  var num = document.getElementById("switcherNum");

  function show(id) {
    body.dataset.piste = id;
    pistes.forEach(function (section) {
      section.classList.toggle("is-active", section.dataset.pisteId === String(id));
    });
    buttons.forEach(function (btn) {
      if (btn.dataset.piste) btn.classList.toggle("is-active", btn.dataset.piste === String(id));
    });
    num.textContent = String(id).padStart(2, "0");
    switcher.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  buttons.forEach(function (btn) {
    if (!btn.dataset.piste) return;
    btn.addEventListener("click", function () { show(btn.dataset.piste); });
  });

  toggle.addEventListener("click", function () {
    var open = switcher.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("keydown", function (e) {
    var current = Number(body.dataset.piste);
    if (e.key === "ArrowRight") show(current === 5 ? 1 : current + 1);
    if (e.key === "ArrowLeft") show(current === 1 ? 5 : current - 1);
  });

  show(1);
})();
