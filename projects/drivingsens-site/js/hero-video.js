(function () {
  var video = document.getElementById("heroVideo");
  var videoBg = document.getElementById("heroVideoBg");
  if (!video) return;

  function play() {
    video.play().catch(function () {});
    if (videoBg) videoBg.play().catch(function () {});
  }

  document.addEventListener("introreveal", play, { once: true });

  var chooser = document.getElementById("heroChooser");
  var endFrame = document.getElementById("heroEndFrame");

  video.addEventListener("ended", function () {
    video.classList.add("is-dimmed");
    if (videoBg) videoBg.pause();
    if (endFrame) {
      endFrame.classList.add("is-active");
    }
    if (chooser) {
      chooser.classList.add("is-active");
      chooser.setAttribute("aria-hidden", "false");
    }
  });
})();
