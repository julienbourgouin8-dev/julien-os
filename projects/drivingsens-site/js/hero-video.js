(function () {
  var video = document.getElementById("heroVideo");
  if (!video) return;

  function play() {
    video.play().catch(function () {});
  }

  document.addEventListener("introreveal", play, { once: true });

  var chooser = document.getElementById("heroChooser");

  video.addEventListener("ended", function () {
    video.classList.add("is-dimmed");
    if (chooser) {
      chooser.classList.add("is-active");
      chooser.setAttribute("aria-hidden", "false");
    }
  });
})();
