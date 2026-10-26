// Лаб. 7 — інформер «Корисне сьогодні»: офіційний курс НБУ і погода в Києві.
// Підключено з defer: скрипт не блокує перше малювання сторінки.
document.addEventListener("DOMContentLoaded", function () {
  var $ = function (s) { return document.querySelector(s); };
  if (!$("[data-informer]")) return;

  // fetch з таймаутом: якщо API не відповів за 7 с — показуємо зрозуміле повідомлення
  function getJSON(url, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, ms || 7000);
    return fetch(url, { signal: ctrl.signal })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .finally(function () { clearTimeout(t); });
  }

  var note = $("[data-rates-note]");
  getJSON("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json")
    .then(function (list) {
      ["USD", "EUR"].forEach(function (cc) {
        var item = list.find(function (x) { return x.cc === cc; });
        var el = $('[data-rate="' + cc + '"]');
        if (item && el) el.textContent = item.rate.toFixed(2) + " ₴";
      });
      note.textContent = "Офіційний курс на " + ((list[0] && list[0].exchangedate) || "сьогодні");
    })
    .catch(function () {
      note.textContent = "Курс тимчасово недоступний — перевірте на bank.gov.ua";
    });

  var WMO = {
    0: "ясно", 1: "переважно ясно", 2: "мінлива хмарність", 3: "хмарно",
    45: "туман", 48: "туман", 51: "мряка", 53: "мряка", 55: "мряка",
    61: "невеликий дощ", 63: "дощ", 65: "сильний дощ", 71: "невеликий сніг", 73: "сніг", 75: "сильний сніг",
    80: "злива", 81: "злива", 82: "сильна злива", 95: "гроза", 96: "гроза з градом", 99: "гроза з градом",
  };
  getJSON("https://api.open-meteo.com/v1/forecast?latitude=50.45&longitude=30.52&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FKyiv")
    .then(function (d) {
      var c = d.current;
      $("[data-weather-temp]").textContent = Math.round(c.temperature_2m) + "°C";
      $("[data-weather-desc]").textContent = (WMO[c.weather_code] || "погода") + ", вітер " + Math.round(c.wind_speed_10m) + " км/год";
    })
    .catch(function () {
      $("[data-weather-desc]").textContent = "Погода тимчасово недоступна";
    });

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
