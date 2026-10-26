/* =====================================================================
   Лаб. 10 — ініціалізація плагінів секції «Галерея».
   Бібліотеки Swiper 11, Fancybox 5, Typed.js 2 (CDN jsDelivr + SRI) з лаб. 12
   підключає цей файл сам, коли галерея наближається до екрана (див. loadVendors).
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

  /* Лаб. 12: бібліотеки галереї вантажаться «ліниво». Раніше їхні CSS стояли в <head>
     і блокували перше малювання, а три скрипти з defer (≈100 КБ) затримували
     DOMContentLoaded, тобто й появу першого екрана. Тепер CSS і JS Swiper, Fancybox,
     Typed.js (ті самі версії й SRI-хеші) підключаються, коли секція наближається
     до екрана (за 800 px); до того картки тримають FOUC-правила lab10-gallery.css */
  var CDN = "https://cdn.jsdelivr.net/npm/";
  var VENDOR_CSS = [
    [CDN + "swiper@11.2.10/swiper-bundle.min.css", "sha384-gAPqlBuTCdtVcYt9ocMOYWrnBZ4XSL6q+4eXqwNycOr4iFczhNKtnYhF3NEXJM51"],
    [CDN + "@fancyapps/ui@5.0.36/dist/fancybox/fancybox.css", "sha384-qlUhevqmCF5AxtnfkF0zXJClBzA6GJuX/UrLejCfE61bBGt+zo/My0AJ+ojVmUSb"],
  ];
  var VENDOR_JS = [
    [CDN + "swiper@11.2.10/swiper-bundle.min.js", "sha384-2UI1PfnXFjVMQ7/ZDEF70CR943oH3v6uZrFQGGqJYlvhh4g6z6uVktxYbOlAczav"],
    [CDN + "@fancyapps/ui@5.0.36/dist/fancybox/fancybox.umd.js", "sha384-BodKYo5iRmFaqEaP1o8AAu9hCHqLvNhSWEg12QF1IjPnl1SgsrwQMSMKUB4POJ18"],
    [CDN + "typed.js@2.0.12/lib/typed.min.js", "sha384-NMn9+T8zIKnDUstqb5le7vdLNSyAgSU9DtEPT/b7ks9NJQpPk4Dc9b1tI8oyzimc"],
  ];
  // Власні стилі галереї (FOUC-правила для слайдера до ініціалізації) — одразу, без очікування
  var ownCss = document.createElement("link");
  ownCss.rel = "stylesheet";
  ownCss.href = "assets/css/lab10-gallery.css";
  document.head.appendChild(ownCss);

  function attach(tag, url, integrity) {
    return new Promise(function (resolve) {
      var node = document.createElement(tag);
      if (tag === "link") { node.rel = "stylesheet"; node.href = url; }
      else { node.src = url; node.async = false; } // async=false — виконуються в порядку додавання
      node.integrity = integrity;
      node.crossOrigin = "anonymous";
      node.onload = node.onerror = resolve; // і без бібліотеки (CDN недоступний) сторінка не ламається
      // CSS бібліотек — перед lab10-gallery.css, щоб наші правила (пагінація тощо) їх перевизначали
      if (tag === "link") document.head.insertBefore(node, ownCss);
      else document.body.appendChild(node);
    });
  }
  function loadVendors() {
    return Promise.all(
      VENDOR_CSS.map(function (v) { return attach("link", v[0], v[1]); })
        .concat(VENDOR_JS.map(function (v) { return attach("script", v[0], v[1]); }))
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var section = document.getElementById("gallery");
    if (!section) return;
    var started = false;
    function start() {
      if (started) return;
      started = true;
      loadVendors().then(initGallery);
    }
    if (!("IntersectionObserver" in window)) return start();
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
    }, { rootMargin: "800px 0px" });
    io.observe(section);
  });

  function initGallery() {
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
  }
})();
