// Лаб. 7 — медіа: YouTube-«фасад».
// (Відео-фон першого екрана прибрано: відео з розтягнутих фото виглядало розмитим і тремтіло.)
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

});
