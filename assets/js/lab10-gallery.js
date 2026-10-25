/* =====================================================================
   Лаб. 10 — ініціалізація плагінів секції «Галерея».
   Бібліотеки підключені через CDN перед </body> (defer) у такому порядку:
   Swiper 11 → Fancybox 5 → Typed.js 2 → цей файл. Тому до DOMContentLoaded
   глобальні Swiper, Fancybox і Typed уже існують.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Тексти UA / EN (доповнюють словник сайту, як i18n-lab7.js) ---------- */
  var TEXT = {
    ua: {
      nav: "Галерея",
      eyebrow: "Галерея",
      title: "Наші справи у фото",
      subtitle: "Події 2026 року, у яких брала участь фундація. Натисніть на фото, щоб відкрити альбом на весь екран.",
      typedLead: "Фундація — це",
      typed: ["правова підтримка", "допомога захисникам", "нові партнерства", "пам'ять про героїв", "спорт, що об'єднує громаду"],
      prev: "Попереднє фото",
      next: "Наступне фото",
      pause: "Зупинити автопрокрутку",
      play: "Увімкнути автопрокрутку",
      open: "Відкрити фото на весь екран: ",
      bullet: "Перейти до фото {{index}}",
      slide: "Фото {{index}} з {{slidesLength}}",
      items: [
        "Крок до системної правової підтримки",
        "Три інвалідні візки для наших захисників",
        "Нові партнерства заради спільних справ",
        "«Пам'ять в обличчях»: історії киян-героїв",
        "Фестиваль «Липневі Перці»: спорт, спілкування, єдність",
        "Family Fishing Fest: день для ветеранів і їхніх родин",
      ],
    },
    en: {
      nav: "Gallery",
      eyebrow: "Gallery",
      title: "Our work in photos",
      subtitle: "Events of 2026 the foundation took part in. Click a photo to open the album full screen.",
      typedLead: "The foundation is",
      typed: ["legal support", "help for our defenders", "new partnerships", "remembering our heroes", "sport that unites the community"],
      prev: "Previous photo",
      next: "Next photo",
      pause: "Pause autoplay",
      play: "Resume autoplay",
      open: "Open photo full screen: ",
      bullet: "Go to photo {{index}}",
      slide: "Photo {{index}} of {{slidesLength}}",
      items: [
        "A step toward systemic legal support",
        "Three wheelchairs for our defenders",
        "New partnerships for shared causes",
        "\"Faces of Memory\": stories of Kyiv's heroes",
        "\"Lypnevi Perci\" Festival: sport, connection, unity",
        "Family Fishing Fest: a day for veterans and their families",
      ],
    },
  };

  // Підписи меню й заголовків — через спільний механізм data-i18n сайту
  var dict = window.FSF_I18N;
  if (dict) {
    ["ua", "en"].forEach(function (l) {
      dict[l].nav.gallery = TEXT[l].nav;
      dict[l].lab10 = {
        eyebrow: TEXT[l].eyebrow, title: TEXT[l].title, subtitle: TEXT[l].subtitle,
        typedLead: TEXT[l].typedLead, typedSr: TEXT[l].typed.join(", "),
        prev: TEXT[l].prev, next: TEXT[l].next,
      };
    });
  }

  // Підписи кнопок Fancybox. У UMD-збірці v5 вбудовано не всі тексти: без l10n кнопка «Закрити»
  // отримує підказку «CLOSE» (сирий ключ), тому передаємо обидві мови явно (uk-перекладу в пакеті немає)
  var FANCYBOX_L10N = {
    ua: {
      CLOSE: "Закрити", NEXT: "Наступне фото", PREV: "Попереднє фото", GOTO: "Перейти до фото %d",
      MODAL: "Це вікно можна закрити клавішею Esc",
      ERROR: "Щось пішло не так. Спробуйте пізніше", IMAGE_ERROR: "Зображення не знайдено",
      ELEMENT_NOT_FOUND: "Елемент не знайдено", AJAX_NOT_FOUND: "Помилка завантаження: не знайдено",
      AJAX_FORBIDDEN: "Помилка завантаження: доступ заборонено", IFRAME_ERROR: "Помилка завантаження сторінки",
      ZOOMIN: "Збільшити", ZOOMOUT: "Зменшити", TOGGLE_ZOOM: "Змінити масштаб", TOGGLEZOOM: "Змінити масштаб",
      TOGGLE1TO1: "Змінити масштаб", ITERATEZOOM: "Змінити масштаб",
      TOGGLE_THUMBS: "Мініатюри", TOGGLE_SLIDESHOW: "Слайдшоу", TOGGLE_FULLSCREEN: "На весь екран",
      TOGGLEFS: "На весь екран", DOWNLOAD: "Завантажити", RESET: "Скинути",
      PANUP: "Вгору", PANDOWN: "Вниз", PANLEFT: "Ліворуч", PANRIGHT: "Праворуч",
      ROTATECCW: "Повернути проти годинникової стрілки", ROTATECW: "Повернути за годинниковою стрілкою",
      FLIPX: "Віддзеркалити горизонтально", FLIPY: "Віддзеркалити вертикально",
      FITX: "Підігнати за шириною", FITY: "Підігнати за висотою",
    },
    en: {
      CLOSE: "Close", NEXT: "Next photo", PREV: "Previous photo", GOTO: "Go to photo %d",
      MODAL: "You can close this window with the Esc key",
      ERROR: "Something went wrong, please try again later", IMAGE_ERROR: "Image not found",
      ELEMENT_NOT_FOUND: "HTML element not found", AJAX_NOT_FOUND: "Error loading AJAX: not found",
      AJAX_FORBIDDEN: "Error loading AJAX: forbidden", IFRAME_ERROR: "Error loading page",
      ZOOMIN: "Zoom in", ZOOMOUT: "Zoom out", TOGGLE_ZOOM: "Toggle zoom level", TOGGLEZOOM: "Toggle zoom level",
      TOGGLE1TO1: "Toggle zoom level", ITERATEZOOM: "Toggle zoom level",
      TOGGLE_THUMBS: "Toggle thumbnails", TOGGLE_SLIDESHOW: "Toggle slideshow", TOGGLE_FULLSCREEN: "Toggle full-screen mode",
      TOGGLEFS: "Toggle fullscreen", DOWNLOAD: "Download", RESET: "Reset",
      PANUP: "Move up", PANDOWN: "Move down", PANLEFT: "Move left", PANRIGHT: "Move right",
      ROTATECCW: "Rotate counterclockwise", ROTATECW: "Rotate clockwise",
      FLIPX: "Flip horizontally", FLIPY: "Flip vertically", FITX: "Fit horizontally", FITY: "Fit vertically",
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    var section = document.getElementById("gallery");
    if (!section) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lang = function () { return document.documentElement.lang === "en" ? "en" : "ua"; };
    var links = Array.prototype.slice.call(section.querySelectorAll(".gallery-card__link"));
    var pauseBtn = document.getElementById("gallery-pause");
    var swiper = null;
    var typed = null;
    var userPaused = reduced; // при «зменшенні руху» автопрокрутка вимкнена від початку

    /* ---------- 1. Swiper: слайдер ---------- */
    if (window.Swiper) {
      swiper = new Swiper(".gallery-swiper", {
        loop: true,                       // після останнього фото — знову перше
        speed: 600,                       // тривалість анімації переходу, мс
        grabCursor: true,
        slidesPerView: 1,                 // смартфон (< 768 px): 1 фото
        spaceBetween: 16,
        autoplay: {
          delay: 3500,                    // пауза між переходами, мс
          disableOnInteraction: false,    // після свайпу автопрокрутка продовжується
          pauseOnMouseEnter: true,        // пауза, поки курсор над слайдером
        },
        keyboard: { enabled: true, onlyInViewport: true },
        navigation: { prevEl: "#gallery-prev", nextEl: "#gallery-next" },
        pagination: { el: ".gallery-swiper .swiper-pagination", clickable: true },
        a11y: {
          prevSlideMessage: TEXT[lang()].prev,
          nextSlideMessage: TEXT[lang()].next,
          paginationBulletMessage: TEXT[lang()].bullet,
          slideLabelMessage: TEXT[lang()].slide,
        },
        breakpoints: {
          768: { slidesPerView: 2, spaceBetween: 20 },   // планшет
          1024: { slidesPerView: 3, spaceBetween: 24 },  // десктоп
        },
      });
      if (userPaused) swiper.autoplay.stop();
    }

    // Кнопка «пауза» — WCAG 2.2.2: рух, що триває понад 5 с, користувач має змогу зупинити
    function syncPauseButton() {
      if (!pauseBtn) return;
      pauseBtn.setAttribute("aria-pressed", userPaused ? "true" : "false");
      pauseBtn.setAttribute("aria-label", userPaused ? TEXT[lang()].play : TEXT[lang()].pause);
    }
    if (pauseBtn && swiper) {
      pauseBtn.addEventListener("click", function () {
        userPaused = !userPaused;
        if (userPaused) swiper.autoplay.stop(); else swiper.autoplay.start();
        syncPauseButton();
      });
    }

    /* ---------- 2. Fancybox: альбом ---------- */
    // Swiper у режимі loop переставляє слайди в DOM, тож порядок посилань «плаває».
    // Тому альбом будуємо з атрибутів data-fancybox / data-caption у фіксованому порядку
    // (data-index) і відкриваємо Fancybox.show() з потрібного фото.
    function albumItems() {
      return links
        .slice()
        .sort(function (a, b) { return a.dataset.index - b.dataset.index; })
        .map(function (a) {
          return { src: a.getAttribute("href"), thumbSrc: a.querySelector("img").currentSrc || a.querySelector("img").src, caption: a.dataset.caption, type: "image" };
        });
    }

    var fancyOptions = {
      l10n: FANCYBOX_L10N[lang()],
      Carousel: { transition: reduced ? false : "fade" },  // згасання між фото
      Images: { zoom: true, Panzoom: { maxScale: 3 } },     // зум до 300 %
      Thumbs: { type: "classic" },                         // стрічка мініатюр
      Toolbar: {
        display: { left: ["infobar"], middle: ["zoomIn", "zoomOut", "toggle1to1"], right: ["slideshow", "thumbs", "close"] },
      },
      on: {
        // поки альбом відкритий, слайдер на сторінці не рухається
        init: function () { if (swiper && !userPaused) swiper.autoplay.stop(); },
        destroy: function () { if (swiper && !userPaused) swiper.autoplay.start(); },
      },
    };

    if (window.Fancybox) {
      section.addEventListener("click", function (event) {
        var link = event.target.closest(".gallery-card__link");
        if (!link) return;
        event.preventDefault();
        fancyOptions.l10n = FANCYBOX_L10N[lang()];
        Fancybox.show(albumItems(), Object.assign({}, fancyOptions, { startIndex: Number(link.dataset.index) }));
      });
    }

    /* ---------- 3. Typed.js: друкований рядок ---------- */
    function startTyped() {
      var target = document.getElementById("typed-text");
      if (!target || !window.Typed) return;
      if (typed) typed.destroy();
      if (reduced) { target.textContent = TEXT[lang()].typed[0]; return; } // без руху — статичний текст
      typed = new Typed("#typed-text", {
        strings: TEXT[lang()].typed,
        typeSpeed: 45,     // мс на символ при друкуванні
        backSpeed: 25,     // мс на символ при стиранні
        backDelay: 1800,   // пауза перед стиранням
        startDelay: 400,
        loop: true,
        smartBackspace: true,
      });
    }

    /* ---------- Мова: підписи карток, альбому й Typed.js ---------- */
    var dateFmt = { ua: "uk-UA", en: "en-GB" };
    function renderLang() {
      var l = lang();
      links.forEach(function (a) {
        var i = Number(a.dataset.index);
        var card = a.closest(".gallery-card");
        var title = TEXT[l].items[i];
        var time = card.querySelector("time");
        var d = new Date(time.getAttribute("datetime") + "T12:00:00");
        time.textContent = d.toLocaleDateString(dateFmt[l], { day: "numeric", month: "long", year: "numeric" });
        var label = time.textContent + " — " + title;
        card.querySelector(".gallery-card__title").textContent = title;
        a.dataset.caption = label;
        a.setAttribute("aria-label", TEXT[l].open + label);
      });
      if (swiper) {
        // підписи слайдів і крапок пагінації для скрінрідера — теж мовою сторінки
        var total = links.length;
        Object.assign(swiper.params.a11y, { prevSlideMessage: TEXT[l].prev, nextSlideMessage: TEXT[l].next, paginationBulletMessage: TEXT[l].bullet, slideLabelMessage: TEXT[l].slide });
        swiper.slides.forEach(function (s) {
          var n = Number(s.getAttribute("data-swiper-slide-index")) + 1;
          s.setAttribute("aria-label", TEXT[l].slide.replace("{{index}}", n).replace("{{slidesLength}}", total));
        });
        swiper.pagination.bullets.forEach(function (b, k) {
          b.setAttribute("aria-label", TEXT[l].bullet.replace("{{index}}", k + 1));
        });
      }
      syncPauseButton();
      startTyped();
    }
    renderLang();
    // app.js змінює <html lang> під час перемикання UA / EN — слухаємо цю зміну
    new MutationObserver(renderLang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  });
})();
