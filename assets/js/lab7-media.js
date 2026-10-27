// Лаб. 7 — медіа: YouTube-«фасад» і відео-фон першого екрана.
// (Інформер із курсом НБУ й погодою прибрано з сайту — для громадської організації він був зайвим.)
// Підключено з defer: скрипт не блокує перше малювання сторінки.
document.addEventListener("DOMContentLoaded", function () {
  var $ = function (s) { return document.querySelector(s); };
  // Лаб. 12: YouTube-«фасад». Плеєр (≈960 КБ JS) вантажиться лише після натискання;
  // iframe отримує фокус, щоб користувач клавіатури одразу керував відео
  document.querySelectorAll("[data-yt-id]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var frame = document.createElement("iframe");
      frame.className = "tw-h-full tw-w-full";
      frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(link.dataset.ytId) + "?rel=0&autoplay=1";
      frame.title = link.dataset.ytTitle;
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.allowFullscreen = true;
      link.replaceWith(frame);
      frame.focus();
    });
  });

  // Відео-фон. Лаб. 12: замість autoplay — запуск після завантаження сторінки й появи Hero,
  // щоб відео не забирало канал у першого екрана (до того видно постер). Не запускаємо,
  // якщо користувач вимкнув анімації в системі або увімкнув режим економії трафіку
  var video = $("[data-hero-video]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (video && !reduceMotion && !saveData) {
    var startVideo = function () {
      video.preload = "auto";
      var played = video.play();
      if (played && played.catch) played.catch(function () { /* автозапуск заборонено — лишається постер */ });
    };
    // Чекаємо load і ще 1,5 с — поки завершиться поява Hero (анімація hero-reveal, 1,25 с):
    // Lighthouse показав, що відео, запущене одразу після load, потрапляло в «вікно» LCP
    var later = function () { setTimeout(startVideo, 1500); };
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later);
  }
});
