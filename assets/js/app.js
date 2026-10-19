/* ==========================================================================
   Фундація майбутнього держави — інтерактивність
   Vanilla JS, без залежностей і без збірки.

   Основні сцени:
   - прелоадер: дерево з логотипу малюється лініями, потім синьо-жовта шторка;
   - hero «апертура»: вікно з фото розкривається на весь екран зі скролом;
   - «Напрями»: закріплена сцена, вкладки перемикаються скролом;
   - «Новини»: горизонтальна стрічка, що їде при вертикальному скролі;
   - перемикач світлої/темної теми з круговим розкриттям (View Transitions).
   ========================================================================== */
(function () {
  "use strict";

  var DICT = window.FSF_I18N;
  var DATA = window.FSF_DATA;
  var LANG_KEY = "fsf-lang";
  var THEME_KEY = "fsf-theme";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mqMobile = window.matchMedia("(max-width: 860px)");

  var state = {
    lang: "ua",
    join: { view: "wizard", step: 1, role: null, direction: null, detail: null },
    direction: -1,
    teamActive: 0,
  };

  function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
  }
  function easeInOut(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  /* ---------------- i18n helpers ---------------- */
  function t(path) {
    var parts = path.split(".");
    var node = DICT[state.lang];
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return "";
      node = node[parts[i]];
    }
    return node == null ? "" : node;
  }

  function detectInitialLang() {
    try {
      var stored = window.localStorage.getItem(LANG_KEY);
      if (stored === "ua" || stored === "en") return stored;
    } catch (e) {
      /* ignore */
    }
    var nav = (window.navigator.language || "").toLowerCase();
    return nav.indexOf("en") === 0 ? "en" : "ua";
  }

  function setLang(lang) {
    state.lang = lang;
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    document.documentElement.lang = lang === "ua" ? "uk" : "en";
    document.title = t("meta.title");
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t("meta.description"));
    renderAll();
    onScroll();
  }

  function applyStaticText() {
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
      node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria-label")));
    });
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      var on = btn.getAttribute("data-lang") === state.lang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function srcset(base) {
    return base + "@480w.jpg 480w, " + base + "@800w.jpg 800w, " + base + ".jpg 1200w";
  }

  /* ---------------- Дерево з логотипу (SVG лініями) ----------------
     Ліва половина синя, права — дзеркальна жовта. Кожен штрих має
     pathLength="1", тож анімація «малювання» однакова для всіх ліній. */
  var TREE_PATHS = [
    { d: "M100 134 V30", leaf: false },
    { d: "M100 112 Q80 104 58 84", leaf: false },
    { d: "M100 92 Q84 82 70 60", leaf: false },
    { d: "M100 70 Q90 60 86 42", leaf: false },
    { d: "M58 84 q-16 -4 -20 -18 q15 2 20 18z", leaf: true },
    { d: "M70 60 q-15 -6 -16 -21 q14 4 16 21z", leaf: true },
    { d: "M86 42 q-11 -9 -9 -22 q11 7 9 22z", leaf: true },
    { d: "M80 103 q-12 6 -25 1 q11 -10 25 -1z", leaf: true },
    { d: "M28 134 H100", leaf: false },
    { d: "M100 136 Q92 152 66 166", leaf: false },
    { d: "M100 136 Q97 156 88 180", leaf: false },
    { d: "M100 136 Q78 144 42 148", leaf: false },
  ];

  function treeSVG() {
    function half(cls, transform) {
      return (
        '<g class="' + cls + '"' + (transform ? ' transform="' + transform + '"' : "") +
        ' fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' +
        TREE_PATHS.map(function (p, i) {
          return '<path' + (p.leaf ? ' class="leaf"' : "") + ' style="--d:' + i + '" pathLength="1" d="' + p.d + '"/>';
        }).join("") +
        "</g>"
      );
    }
    return (
      '<svg class="tree-svg" viewBox="20 12 160 176" aria-hidden="true" focusable="false">' +
      half("t-blue") +
      half("t-yellow", "translate(200 0) scale(-1 1)") +
      "</svg>"
    );
  }

  function mountTrees() {
    document.querySelectorAll("[data-tree]").forEach(function (node) {
      node.innerHTML = treeSVG();
    });
  }

  /* ---------------- Прелоадер ---------------- */
  function runPreloader() {
    var pre = document.getElementById("preloader");
    var root = document.documentElement;
    if (!pre || reduced) {
      if (pre) pre.remove();
      root.classList.add("is-loaded");
      return;
    }
    var tree = pre.querySelector(".tree-svg");
    var count = document.getElementById("preloader-count");
    if (tree) tree.classList.add("is-drawing");
    document.body.style.overflow = "hidden";

    var start = null;
    var DURATION = 1500;
    function tick(ts) {
      if (start === null) start = ts;
      var k = clamp((ts - start) / DURATION, 0, 1);
      count.textContent = String(Math.round(easeInOut(k) * 100)).padStart(3, "0");
      if (k < 1) {
        requestAnimationFrame(tick);
      } else {
        finish();
      }
    }
    function finish() {
      pre.classList.add("is-closing");
      setTimeout(function () {
        pre.classList.add("is-done");
        root.classList.add("is-loaded");
        document.body.style.overflow = "";
        setTimeout(function () {
          pre.remove();
        }, 950);
      }, 680);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- Тема ---------------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* ignore */
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    });
  }

  function toggleTheme(e) {
    var next = currentTheme() === "dark" ? "light" : "dark";
    var x = e && e.clientX ? e.clientX : window.innerWidth - 60;
    var y = e && e.clientY ? e.clientY : 40;
    if (!document.startViewTransition || reduced) {
      applyTheme(next);
      return;
    }
    // Нова тема «розливається» колом від кнопки
    var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    var vt = document.startViewTransition(function () {
      applyTheme(next);
    });
    vt.ready.then(function () {
      document.documentElement.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
        { duration: 750, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }

  function bindTheme() {
    applyTheme(currentTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", toggleTheme);
    });
    // Якщо людина ще не обирала тему вручну — слідуємо за системою
    var mq = window.matchMedia("(prefers-color-scheme: light)");
    var onChange = function (ev) {
      var saved = null;
      try {
        saved = window.localStorage.getItem(THEME_KEY);
      } catch (e) {
        /* ignore */
      }
      if (!saved) document.documentElement.setAttribute("data-theme", ev.matches ? "light" : "dark");
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }

  /* ---------------- Hero: факти-віджети ---------------- */
  var heroCountersDone = false;
  function renderHeroFacts() {
    var wrap = document.getElementById("hero-stats");
    if (!wrap) return;
    wrap.innerHTML = "";
    t("hero.facts").forEach(function (m, i) {
      var value = m.counter
        ? '<span data-counter data-target="' + m.value + '" data-suffix="' + (m.suffix || "") + '">' + (heroCountersDone ? m.value + (m.suffix || "") : "0") + "</span>"
        : m.value;
      var w = el(
        "div",
        "widget",
        '<div class="widget__value">' + value + '</div><div class="widget__label">' + m.label + '</div><div class="widget__bar"><span></span></div>'
      );
      w.style.setProperty("--i", i);
      wrap.appendChild(w);
    });
  }

  function animateCounter(node) {
    var target = parseInt(node.getAttribute("data-target"), 10) || 0;
    var suffix = node.getAttribute("data-suffix") || "";
    if (reduced) {
      node.textContent = target + suffix;
      return;
    }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var k = Math.min((ts - start) / 1400, 1);
      node.textContent = Math.round((1 - Math.pow(1 - k, 3)) * target) + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- Hero: слайди ----------------
     Слайд стає активним лише тоді, коли його зображення вже завантажене. */
  function initHeroSlides() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("#hero-media .hero__slide"));
    var dotsWrap = document.getElementById("hero-dots");
    if (!slides.length) return;
    var idx = 0;
    var timer = null;

    function ready(slide) {
      var img = slide.querySelector("img");
      return img && img.getAttribute("src") && img.complete && img.naturalWidth > 0;
    }

    dotsWrap.innerHTML = "";
    slides.forEach(function (s, i) {
      var dot = el("button", i === 0 ? "is-active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", (state.lang === "ua" ? "Фото " : "Photo ") + (i + 1));
      dot.addEventListener("click", function () {
        if (!ready(s)) return;
        show(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    });

    function show(i) {
      slides[idx].classList.remove("is-active");
      dotsWrap.children[idx].classList.remove("is-active");
      idx = i;
      slides[idx].classList.add("is-active");
      dotsWrap.children[idx].classList.add("is-active");
    }
    function advance() {
      for (var step = 1; step < slides.length; step++) {
        var next = (idx + step) % slides.length;
        if (ready(slides[next])) {
          show(next);
          return;
        }
      }
    }
    function restart() {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(advance, 5200);
    }

    // Решта фото підвантажуються після повного завантаження сторінки
    function loadDeferred() {
      document.querySelectorAll("#hero-media img[data-src]").forEach(function (img) {
        img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        img.removeAttribute("data-srcset");
      });
    }
    if (document.readyState === "complete") setTimeout(loadDeferred, 300);
    else window.addEventListener("load", function () { setTimeout(loadDeferred, 300); });

    restart();
  }

  /* ---------------- About: маніфест, що «загоряється» слово за словом ---------------- */
  function renderManifest() {
    var node = document.getElementById("about-manifest");
    if (!node) return;
    var words = t("about.subtitle").split(/\s+/);
    node.setAttribute("aria-label", t("about.subtitle"));
    node.innerHTML = words
      .map(function (w) {
        return '<span class="w" aria-hidden="true">' + w + "</span>";
      })
      .join(" ");
    if (reduced) node.querySelectorAll(".w").forEach(function (w) { w.classList.add("is-lit"); });
  }

  function renderAbout() {
    renderManifest();
    var wrap = document.getElementById("about-values");
    if (wrap) {
      wrap.innerHTML = "";
      t("about.values").forEach(function (v, i) {
        var li = el("li", "reveal", "<h3>" + v.title + "</h3><p>" + v.text + "</p>");
        li.style.setProperty("--i", i);
        li.style.setProperty("--reveal-delay", i * 90);
        wrap.appendChild(li);
      });
      observeReveals(wrap);
    }
    var structWrap = document.getElementById("about-structure");
    if (structWrap) {
      structWrap.innerHTML = "";
      t("about.structure.items").forEach(function (s, i) {
        structWrap.appendChild(
          el("li", "", '<span class="structure__num">' + (i + 1) + "</span><div><h4>" + s.title + "</h4><p>" + s.text + "</p></div>")
        );
      });
    }
  }

  /* ---------------- Directions: закріплена сцена ---------------- */
  var SCRAMBLE_CHARS = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЮЯ#/<>*+";
  var scrambleRaf = null;

  function scrambleTo(node, text) {
    if (reduced) {
      node.textContent = text;
      return;
    }
    cancelAnimationFrame(scrambleRaf);
    var from = node.textContent;
    var len = Math.max(from.length, text.length);
    var frame = 0;
    var total = 22;
    function tick() {
      var out = "";
      for (var i = 0; i < len; i++) {
        var settleAt = Math.floor((i / len) * total * 0.7) + 6;
        if (frame >= settleAt) out += text[i] || "";
        else if (i < text.length || frame < total / 2) out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      node.textContent = out;
      frame++;
      if (frame <= total) scrambleRaf = requestAnimationFrame(tick);
      else node.textContent = text;
    }
    tick();
  }

  function renderDirectionTabs() {
    var tabs = document.getElementById("directions-tabs");
    if (!tabs) return;
    tabs.innerHTML = "";
    t("directions.items").forEach(function (d, i) {
      var b = el("button", "directions__tab", d.title);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", "false");
      b.setAttribute("aria-controls", "direction-card");
      b.addEventListener("click", function () {
        // Без анімацій сцена не закріплена — просто перемикаємо вкладку
        if (reduced) showDirection(i);
        else scrollToDirection(i);
      });
      tabs.appendChild(b);
    });
    var keep = state.direction;
    state.direction = -1;
    showDirection(Math.max(0, keep), true);
  }

  function scrollToDirection(i) {
    var section = document.getElementById("directions");
    var n = t("directions.items").length;
    var range = section.offsetHeight - window.innerHeight;
    var top = section.getBoundingClientRect().top + window.scrollY + range * ((i + 0.5) / n);
    window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
  }

  function showDirection(i, instant) {
    var items = t("directions.items");
    if (i === state.direction || !items[i]) return;
    var d = items[i];
    state.direction = i;

    var word = document.getElementById("direction-word");
    if (instant) word.textContent = d.word.toUpperCase();
    else scrambleTo(word, d.word.toUpperCase());

    var card = document.getElementById("direction-card");
    var photo = document.getElementById("direction-photo");
    var base = DATA.directionPhotos[d.slug];
    var img = el("img");
    img.alt = "";
    img.decoding = "async";
    img.sizes = "(max-width: 860px) 92vw, 46vw";
    img.srcset = srcset(base);
    img.src = base + "@800w.jpg";
    if (!instant && !reduced) img.className = "is-entering";
    photo.appendChild(img);
    // Прибираємо попередні фото, коли нове вже накрило їх
    var old = Array.prototype.slice.call(photo.children, 0, -1);
    setTimeout(function () {
      old.forEach(function (o) { o.remove(); });
    }, instant ? 0 : 950);

    function fill() {
      document.getElementById("direction-icon").innerHTML = '<img src="assets/img/icons/' + d.icon + '.svg" alt="" width="22" height="22" />';
      document.getElementById("direction-name").textContent = d.title;
      document.getElementById("direction-text").textContent = d.text;
      card.classList.remove("is-swapping");
    }
    if (instant || reduced) fill();
    else {
      card.classList.add("is-swapping");
      setTimeout(fill, 260);
    }

    var tabs = document.querySelectorAll(".directions__tab");
    tabs.forEach(function (tb, k) {
      tb.setAttribute("aria-selected", k === i ? "true" : "false");
    });
    var active = tabs[i];
    var bar = document.getElementById("directions-tabs");
    if (active && bar && bar.scrollWidth > bar.clientWidth) {
      bar.scrollTo({ left: active.offsetLeft - bar.clientWidth / 2 + active.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
    }
  }

  /* ---------------- Team ---------------- */
  function renderTeam() {
    var wrap = document.getElementById("team-grid");
    if (!wrap) return;
    wrap.innerHTML = "";
    DATA.team.forEach(function (m, i) {
      var name = state.lang === "en" && m.nameEn ? m.nameEn : m.name;
      var short = name.split(" ").slice(0, 2).join(" ");
      var li = el("li", "member" + (i === state.teamActive ? " is-active" : ""));
      li.setAttribute("data-cursor", "open");
      li.innerHTML =
        '<img src="' + m.img + '" alt="" loading="lazy" decoding="async" />' +
        '<span class="member__vertical" aria-hidden="true">' + short + "</span>" +
        '<div class="member__body">' +
        "<h3>" + name + "</h3>" +
        '<p class="member__role">' + m.role[state.lang] + "</p>" +
        '<p class="member__excerpt">' + m.bio[state.lang].split("\n")[0] + "</p>" +
        '<button type="button" class="btn-text member__open" data-team-open="' + i + '">' + t("team.readMore") + "</button>" +
        "</div>";
      wrap.appendChild(li);
    });
  }

  function setTeamActive(i) {
    if (i === state.teamActive) return;
    state.teamActive = i;
    document.querySelectorAll("#team-grid .member").forEach(function (m, k) {
      m.classList.toggle("is-active", k === i);
    });
  }

  var lastFocusedBeforeModal = null;
  function openTeamModal(index) {
    var member = DATA.team[index];
    if (!member) return;
    var backdrop = document.getElementById("team-modal");
    document.getElementById("team-modal-name").textContent = state.lang === "en" && member.nameEn ? member.nameEn : member.name;
    document.getElementById("team-modal-role").textContent = member.role[state.lang];
    document.getElementById("team-modal-bio").textContent = member.bio[state.lang];
    document.getElementById("team-modal-img").src = member.img;
    document.getElementById("team-modal-bio").scrollTop = 0;
    lastFocusedBeforeModal = document.activeElement;
    backdrop.classList.add("is-open");
    document.body.classList.add("modal-open");
    document.getElementById("team-modal-close").focus();
  }
  function closeTeamModal() {
    document.getElementById("team-modal").classList.remove("is-open");
    document.body.classList.remove("modal-open");
    if (lastFocusedBeforeModal && lastFocusedBeforeModal.focus) lastFocusedBeforeModal.focus();
  }

  function bindTeam() {
    var grid = document.getElementById("team-grid");
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-team-open]");
      if (btn) {
        openTeamModal(parseInt(btn.getAttribute("data-team-open"), 10));
        return;
      }
      var card = e.target.closest(".member");
      if (!card) return;
      var i = Array.prototype.indexOf.call(grid.children, card);
      if (card.classList.contains("is-active") || mqMobile.matches) openTeamModal(i);
      else setTeamActive(i);
    });
    grid.addEventListener("mouseover", function (e) {
      if (!finePointer) return;
      var card = e.target.closest(".member");
      if (card) setTeamActive(Array.prototype.indexOf.call(grid.children, card));
    });
    grid.addEventListener("focusin", function (e) {
      var card = e.target.closest(".member");
      if (card) setTeamActive(Array.prototype.indexOf.call(grid.children, card));
    });
    document.getElementById("team-modal-close").addEventListener("click", closeTeamModal);
    document.getElementById("team-modal").addEventListener("click", function (e) {
      if (e.target === e.currentTarget) closeTeamModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.getElementById("team-modal").classList.contains("is-open")) closeTeamModal();
    });
  }

  /* ---------------- News ---------------- */
  function renderMedia() {
    var wrap = document.getElementById("news-grid");
    if (!wrap) return;
    wrap.innerHTML = "";
    var fmt = new Intl.DateTimeFormat(state.lang === "ua" ? "uk-UA" : "en-US", { day: "numeric", month: "long", year: "numeric" });
    DATA.news.forEach(function (n) {
      var base = n.image.replace(/\.jpg$/, "");
      var date = fmt.format(new Date(n.date));
      var li = el("li", "news-card");
      li.tabIndex = 0;
      li.setAttribute("data-cursor", "open");
      li.innerHTML =
        '<img src="' + base + '@800w.jpg" srcset="' + base + "@480w.jpg 480w, " + base + "@800w.jpg 800w, " + n.image + ' 1300w" sizes="(max-width: 860px) 76vw, 440px" alt="" loading="lazy" decoding="async" />' +
        '<div class="news-card__meta"><time class="news-card__date" datetime="' + n.date + '">' + date + "</time><h3>" + n.title[state.lang] + "</h3></div>" +
        '<div class="news-card__panel"><time datetime="' + n.date + '">' + date + "</time><h3>" + n.title[state.lang] + "</h3><p>" + n.text[state.lang] + "</p></div>";
      wrap.appendChild(li);
    });
    measureNews();
  }

  function bindNews() {
    var wrap = document.getElementById("news-grid");
    // На сенсорних екранах панель з текстом відкривається дотиком
    wrap.addEventListener("click", function (e) {
      var card = e.target.closest(".news-card");
      if (!card || finePointer) return;
      var open = card.classList.contains("is-open");
      wrap.querySelectorAll(".news-card.is-open").forEach(function (c) { c.classList.remove("is-open"); });
      if (!open) card.classList.add("is-open");
    });
  }

  var newsShift = 0;
  function measureNews() {
    var section = document.getElementById("media");
    var track = document.getElementById("news-grid");
    if (!section || !track) return;
    if (mqMobile.matches || reduced) {
      section.style.height = "";
      newsShift = 0;
      track.style.setProperty("--nx", 0);
      return;
    }
    newsShift = Math.max(0, track.scrollWidth - window.innerWidth);
    // Висота секції = горизонтальний шлях + один екран, щоб стрічка «доїхала» до кінця
    section.style.height = Math.round(newsShift + window.innerHeight * 1.25) + "px";
  }

  /* ---------------- Footer ---------------- */
  function renderFooter() {
    var links = document.getElementById("footer-links");
    if (links) {
      links.innerHTML = "";
      t("footer.links").forEach(function (l) {
        links.appendChild(el("li", "", '<a href="' + l.href + '">' + l.label + "</a>"));
      });
    }
    var contacts = document.getElementById("footer-contacts");
    if (contacts) {
      contacts.innerHTML =
        '<li><a href="mailto:' + DATA.contact.email + '">' + DATA.contact.email + "</a></li>" +
        '<li><a href="tel:' + DATA.contact.phone.replace(/\s/g, "") + '">' + DATA.contact.phone + "</a></li>";
    }
    var track = document.getElementById("marquee-track");
    if (track) {
      var items = t("footer.marquee");
      var html = "";
      for (var r = 0; r < 2; r++) {
        items.forEach(function (txt) {
          html += '<span class="marquee__item">' + txt + '<span class="marquee__sep"></span></span>';
        });
      }
      track.innerHTML = html;
    }
  }

  function renderContactStatic() {
    var email = document.getElementById("contact-email");
    var phone = document.getElementById("contact-phone");
    if (email) {
      email.href = "mailto:" + DATA.contact.email;
      email.textContent = DATA.contact.email;
    }
    if (phone) {
      phone.href = "tel:" + DATA.contact.phone.replace(/\s/g, "");
      phone.textContent = DATA.contact.phone;
    }
    ["social-row", "footer-social"].forEach(function (id) {
      var wrap = document.getElementById(id);
      if (!wrap) return;
      wrap.innerHTML = "";
      DATA.social.forEach(function (s) {
        var a = el("a", "social-btn", socialSvg(s.id));
        a.href = s.href;
        a.target = "_blank";
        a.rel = "noreferrer noopener";
        a.setAttribute("aria-label", s.label);
        wrap.appendChild(a);
      });
    });

    var subjectSelect = document.getElementById("field-subject");
    if (subjectSelect) {
      var currentValue = subjectSelect.value;
      subjectSelect.innerHTML = "";
      t("contact.form.subjectOptions").forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        subjectSelect.appendChild(o);
      });
      if (currentValue && t("contact.form.subjectOptions").indexOf(currentValue) > -1) subjectSelect.value = currentValue;
    }
  }

  function socialSvg(id) {
    var common = 'width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"';
    var paths = {
      facebook:
        '<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/>',
      instagram:
        '<path d="M12 2.2c2.7 0 3 0 4 .1 1 0 1.7.2 2.1.4.5.2.9.5 1.3.9.4.4.7.8.9 1.3.2.4.4 1.1.4 2.1.1 1 .1 1.3.1 4s0 3-.1 4c0 1-.2 1.7-.4 2.1-.2.5-.5.9-.9 1.3-.4.4-.8.7-1.3.9-.4.2-1.1.4-2.1.4-1 .1-1.3.1-4 .1s-3 0-4-.1c-1 0-1.7-.2-2.1-.4-.5-.2-.9-.5-1.3-.9-.4-.4-.7-.8-.9-1.3-.2-.4-.4-1.1-.4-2.1-.1-1-.1-1.3-.1-4s0-3 .1-4c0-1 .2-1.7.4-2.1.2-.5.5-.9.9-1.3.4-.4.8-.7 1.3-.9.4-.2 1.1-.4 2.1-.4 1-.1 1.3-.1 4-.1M12 0C9.3 0 8.9 0 7.9.1c-1.1 0-1.8.2-2.4.4-.7.3-1.3.6-1.8 1.2-.6.5-.9 1.1-1.2 1.8-.2.6-.4 1.3-.4 2.4C2 6.9 2 7.3 2 10s0 3.1.1 4.1c0 1.1.2 1.8.4 2.4.3.7.6 1.3 1.2 1.8.5.6 1.1.9 1.8 1.2.6.2 1.3.4 2.4.4 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1 0 1.8-.2 2.4-.4.7-.3 1.3-.6 1.8-1.2.6-.5.9-1.1 1.2-1.8.2-.6.4-1.3.4-2.4.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c0-1.1-.2-1.8-.4-2.4-.3-.7-.6-1.3-1.2-1.8-.5-.6-1.1-.9-1.8-1.2-.6-.2-1.3-.4-2.4-.4C15.1 0 14.7 0 12 0Z"/><path d="M12 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM19.8 5.6a1.4 1.4 0 1 1-2.9 0 1.4 1.4 0 0 1 2.9 0Z"/>',
      linkedin:
        '<path d="M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.05c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.2 2.4 4.2 5.5v6.2ZM5.3 7.4A2 2 0 1 1 5.3 3.4a2 2 0 0 1 0 4ZM7 20.4H3.6V9H7v11.4Z"/>',
      youtube:
        '<path d="M22 12s0-3.2-.4-4.7a2.9 2.9 0 0 0-2-2C17.9 5 12 5 12 5s-5.9 0-7.6.3a2.9 2.9 0 0 0-2 2C2 8.8 2 12 2 12s0 3.2.4 4.7c.2.9 1 1.7 2 2C6.1 19 12 19 12 19s5.9 0 7.6-.3a2.9 2.9 0 0 0 2-2c.4-1.5.4-4.7.4-4.7ZM10 15.3V8.7L15.8 12 10 15.3Z"/>',
      telegram:
        '<path d="M21.9 4.9 18.6 20.3c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1L18 8.1c.4-.4-.1-.6-.6-.2L6.7 14.9l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 3.7c.9-.3 1.7.2 1.4 1.2Z"/>',
    };
    return "<svg " + common + ">" + (paths[id] || "") + "</svg>";
  }

  /* ---------------- Join constructor ---------------- */
  function joinReset() {
    state.join = { view: "wizard", step: 1, role: null, direction: null, detail: null };
    renderJoin();
  }

  function renderJoin() {
    var panel = document.getElementById("join-panel");
    var skipBtn = document.getElementById("join-skip");
    if (!panel) return;

    if (state.join.view === "cards") {
      skipBtn.hidden = true;
      panel.innerHTML = renderJoinCards();
      return;
    }
    skipBtn.hidden = false;

    var totalSteps = 3;
    var progress = Math.min(state.join.step, totalSteps + 1) / (totalSteps + 1);

    var html = '<div class="progress-track"><div class="progress-fill" style="width:' + progress * 100 + '%"></div></div>';
    html += renderJoinStep1();
    html += renderJoinStep2();
    html += renderJoinStep3();
    html += renderJoinResult();
    panel.innerHTML = html;

    ["1", "2", "3", "4"].forEach(function (s) {
      var stepEl = panel.querySelector('[data-step="' + s + '"]');
      if (stepEl) stepEl.classList.toggle("is-active", String(state.join.step) === s);
    });
  }

  function renderJoinStep1() {
    var s = t("join.step1");
    var optionsHtml = s.options
      .map(function (opt) {
        var checked = state.join.role === opt.id;
        return (
          '<label class="option-card' + (checked ? " is-checked" : "") + '">' +
          '<input type="radio" name="join-role" value="' + opt.id + '" ' + (checked ? "checked" : "") + " />" +
          '<span class="option-card__title">' + opt.title + "</span>" +
          '<span class="option-card__text">' + opt.text + "</span>" +
          '<span class="option-card__dot"></span></label>'
        );
      })
      .join("");
    return (
      '<div class="step" data-step="1">' +
      '<span class="step-label">' + s.label + "</span>" +
      '<h3 class="step-title">' + s.title + "</h3>" +
      '<div class="option-list" role="radiogroup" aria-label="' + s.title + '">' + optionsHtml + "</div></div>"
    );
  }

  function renderJoinStep2() {
    var s = t("join.step2");
    var optionsHtml = t("directions.items")
      .map(function (d) {
        var checked = state.join.direction === d.slug;
        return (
          '<label class="option-card' + (checked ? " is-checked" : "") + '">' +
          '<input type="radio" name="join-direction" value="' + d.slug + '" ' + (checked ? "checked" : "") + " />" +
          '<span class="option-card__title">' + d.title + "</span>" +
          '<span class="option-card__text">' + d.text + "</span>" +
          '<span class="option-card__dot"></span></label>'
        );
      })
      .join("");
    return (
      '<div class="step" data-step="2">' +
      '<span class="step-label">' + s.label + "</span>" +
      '<h3 class="step-title">' + s.title + "</h3>" +
      '<div class="option-list option-list--2col" role="radiogroup" aria-label="' + s.title + '">' + optionsHtml + "</div>" +
      '<button type="button" class="step-back" data-join-back="1">← ' + t("join.back") + "</button></div>"
    );
  }

  function renderJoinStep3() {
    var role = state.join.role || "volunteer";
    var s = t("join.step3")[role];
    var optionsHtml = s.options
      .map(function (opt) {
        var checked = state.join.detail === opt.id;
        return (
          '<label class="option-card' + (checked ? " is-checked" : "") + '">' +
          '<input type="radio" name="join-detail" value="' + opt.id + '" ' + (checked ? "checked" : "") + " />" +
          '<span class="option-card__title">' + opt.title + "</span>" +
          '<span class="option-card__text">' + opt.text + "</span>" +
          '<span class="option-card__dot"></span></label>'
        );
      })
      .join("");
    return (
      '<div class="step" data-step="3">' +
      '<span class="step-label">' + s.label + "</span>" +
      '<h3 class="step-title">' + s.title + "</h3>" +
      '<div class="option-list" role="radiogroup" aria-label="' + s.title + '">' + optionsHtml + "</div>" +
      '<button type="button" class="step-back" data-join-back="2">← ' + t("join.back") + "</button></div>"
    );
  }

  function renderJoinResult() {
    if (!state.join.role || !state.join.direction || !state.join.detail) {
      return '<div class="step" data-step="4"></div>';
    }
    var directionObj = t("directions.items").filter(function (d) {
      return d.slug === state.join.direction;
    })[0];
    var directionTitle = directionObj ? directionObj.title : "";

    var html = '<div class="step" data-step="4" role="status">';
    html += "<h3 class=\"step-title\">" + t("join.result.title") + "</h3>";
    html += '<div class="result-box">';
    html += "<p>" + t("join.result.directionLabel") + "<strong>" + directionTitle + "</strong></p>";
    html += "<p style=\"margin-top:8px\">" + t("join.result.note") + "</p>";
    if (state.join.role === "donor") {
      var n = DATA.donorImpact[state.join.detail] || 10;
      var impact = t("join.result.donorImpact").replace("{n}", n).replace("{direction}", directionTitle);
      html += '<p class="result-impact">' + impact + "</p>";
    }
    html += "</div>";

    var cardsDict = t("join.cards");
    var subjectMap = {};
    cardsDict.forEach(function (c) {
      subjectMap[c.id] = c.subject;
    });
    var subject = subjectMap[state.join.role] || subjectMap.volunteer;

    html += '<div class="result-actions">';
    html +=
      '<a href="#contact" class="btn btn-primary" data-join-goto-contact="' + subject.replace(/"/g, "&quot;") + '">' +
      t("join.result.cta") +
      "</a>";
    html += '<button type="button" class="btn btn-outline" data-join-restart>' + t("join.restart") + "</button>";
    html += "</div></div>";
    return html;
  }

  function renderJoinCards() {
    var cards = t("join.cards");
    var html = '<div class="cards-view">';
    html += '<div class="cards-view__head"><h3>' + t("join.cardsTitle") + "</h3>";
    html += '<button type="button" class="btn-text" data-join-back-cards>' + t("join.cardsBack") + "</button></div>";
    html += '<div class="option-list option-list--2col" style="margin-top:24px">';
    cards.forEach(function (c) {
      html +=
        '<div class="card scenario-card"><h4>' + c.title + "</h4><p>" + c.text + "</p>" +
        '<a href="#contact" class="btn btn-outline btn-block" data-join-goto-contact="' + c.subject.replace(/"/g, "&quot;") + '">' +
        c.cta +
        "</a></div>";
    });
    html += "</div></div>";
    return html;
  }

  function goToContactWithSubject(subject) {
    var select = document.getElementById("field-subject");
    if (select) {
      var options = Array.prototype.slice.call(select.options).map(function (o) {
        return o.value;
      });
      if (options.indexOf(subject) > -1) select.value = subject;
    }
    var target = document.getElementById("contact");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindJoinEvents() {
    var panel = document.getElementById("join-panel");
    var skipBtn = document.getElementById("join-skip");

    skipBtn.addEventListener("click", function () {
      state.join.view = "cards";
      renderJoin();
    });

    panel.addEventListener("change", function (e) {
      var target = e.target;
      if (target.name === "join-role") {
        state.join.role = target.value;
        state.join.detail = null;
        state.join.step = 2;
        renderJoin();
      } else if (target.name === "join-direction") {
        state.join.direction = target.value;
        state.join.step = 3;
        renderJoin();
      } else if (target.name === "join-detail") {
        state.join.detail = target.value;
        state.join.step = 4;
        renderJoin();
      }
    });

    panel.addEventListener("click", function (e) {
      var back = e.target.closest("[data-join-back]");
      if (back) {
        state.join.step = parseInt(back.getAttribute("data-join-back"), 10);
        renderJoin();
        return;
      }
      var backCards = e.target.closest("[data-join-back-cards]");
      if (backCards) {
        joinReset();
        return;
      }
      var restart = e.target.closest("[data-join-restart]");
      if (restart) {
        joinReset();
        return;
      }
      var gotoContact = e.target.closest("[data-join-goto-contact]");
      if (gotoContact) {
        goToContactWithSubject(gotoContact.getAttribute("data-join-goto-contact"));
      }
    });
  }

  /* ---------------- Forms ---------------- */
  // Vercel Function, яка пересилає заявки в Telegram (api/lead.js).
  // Абсолютна адреса, бо сайт також відкривається з GitHub Pages, де /api немає.
  var LEADS_ENDPOINT = "https://future-state-foundation-website.vercel.app/api/lead";

  function sendLead(payload) {
    payload.lang = state.lang;
    return fetch(LEADS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function validateContactForm(form) {
    var valid = true;
    var fields = {
      name: form.querySelector("#field-name"),
      email: form.querySelector("#field-email"),
      message: form.querySelector("#field-message"),
      consent: form.querySelector("#field-consent"),
    };

    function setError(fieldWrap, hasError, msg) {
      fieldWrap.classList.toggle("has-error", hasError);
      var errorNode = fieldWrap.querySelector(".field-error");
      if (errorNode && msg) errorNode.textContent = msg;
      if (hasError) valid = false;
    }

    setError(
      fields.name.closest(".field"),
      fields.name.value.trim().length < 2,
      t("contact.form.errRequired")
    );
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim());
    setError(fields.email.closest(".field"), !emailOk, t("contact.form.errEmail"));
    setError(
      fields.message.closest(".field"),
      fields.message.value.trim().length < 10,
      t("contact.form.errMessage")
    );
    setError(fields.consent.closest(".consent-row"), !fields.consent.checked, t("contact.form.errConsent"));

    return valid;
  }

  function bindContactForm() {
    var form = document.getElementById("contact-form");
    var status = document.getElementById("contact-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.className = "form-status";

      // Honeypot: bots tend to fill every field, humans never see it.
      var honeypot = form.querySelector("#field-website");
      if (honeypot && honeypot.value) {
        status.textContent = t("contact.form.success");
        status.classList.add("success");
        form.reset();
        return;
      }

      if (!validateContactForm(form)) {
        status.textContent = t("contact.form.error");
        status.classList.add("error");
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = t("contact.form.submitting");

      sendLead({
        type: "contact",
        name: form.querySelector("#field-name").value,
        email: form.querySelector("#field-email").value,
        phone: form.querySelector("#field-phone").value,
        subject: form.querySelector("#field-subject").value,
        message: form.querySelector("#field-message").value,
        website: honeypot ? honeypot.value : "",
      })
        .then(function () {
          status.textContent = t("contact.form.success");
          status.classList.add("success");
          form.reset();
        })
        .catch(function () {
          status.textContent = t("contact.form.sendError");
          status.classList.add("error");
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = t("contact.form.submit");
        });
    });

    form.querySelectorAll("input, textarea, select").forEach(function (fieldEl) {
      fieldEl.addEventListener("input", function () {
        var wrap = fieldEl.closest(".field") || fieldEl.closest(".consent-row");
        if (wrap) wrap.classList.remove("has-error");
      });
    });
  }

  function bindNewsletterForm() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    var status = document.getElementById("newsletter-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      status.className = "form-status";
      if (!ok) {
        status.textContent = t("footer.newsletterError");
        status.classList.add("error");
        return;
      }
      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      sendLead({ type: "newsletter", email: input.value })
        .then(function () {
          status.textContent = t("footer.newsletterSuccess");
          status.classList.add("success");
          form.reset();
        })
        .catch(function () {
          status.textContent = t("footer.newsletterSendError");
          status.classList.add("error");
        })
        .then(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealObserver = null;
  function observeReveals(container) {
    var items = container.querySelectorAll(".reveal:not(.is-visible)");
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("is-visible"); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
      );
    }
    items.forEach(function (i) { revealObserver.observe(i); });
  }

  /* ==========================================================================
     Головний цикл скролу — усі сцени рахуються в одному requestAnimationFrame
     ========================================================================== */
  var nodes = {};
  var lastY = 0;
  var ticking = false;

  function sectionProgress(section) {
    var rect = section.getBoundingClientRect();
    var range = section.offsetHeight - window.innerHeight;
    if (range <= 0) return rect.top <= 0 ? 1 : 0;
    return clamp(-rect.top / range, 0, 1);
  }

  function updateHero() {
    var hero = nodes.hero;
    if (!hero) return;
    var p = reduced ? 1 : sectionProgress(hero);
    var e = reduced ? 1 : easeInOut(clamp(p / 0.55, 0, 1));
    var c = reduced ? 1 : clamp((p - 0.42) / 0.4, 0, 1);
    hero.style.setProperty("--p", p.toFixed(4));
    hero.style.setProperty("--e", e.toFixed(4));
    hero.style.setProperty("--c", c.toFixed(4));
    hero.classList.toggle("is-open", c > 0.5);
    if (c > 0.45 && !heroCountersDone) {
      heroCountersDone = true;
      hero.querySelectorAll("[data-counter]").forEach(animateCounter);
    }
    // Шапка над великим фото — світла в обох темах
    var heroBottom = hero.getBoundingClientRect().bottom;
    nodes.header.classList.toggle("on-photo", e > 0.6 && heroBottom > 80);
  }

  function updateManifest() {
    var m = nodes.manifest;
    if (!m || reduced) return;
    var rect = m.getBoundingClientRect();
    var vh = window.innerHeight;
    // Слова «загоряються», поки абзац проходить від низу екрана до верхньої третини
    var k = clamp((vh * 0.88 - rect.top) / (rect.height + vh * 0.45), 0, 1);
    var words = m.children;
    var lit = Math.round(k * words.length);
    for (var i = 0; i < words.length; i++) {
      var on = i < lit;
      if (words[i].classList.contains("is-lit") !== on) words[i].classList.toggle("is-lit", on);
    }
  }

  function updateDirections() {
    var s = nodes.directions;
    if (!s || reduced) return;
    var p = sectionProgress(s);
    var n = t("directions.items").length;
    nodes.dirProgress.style.setProperty("--dp", p.toFixed(4));
    showDirection(clamp(Math.floor(p * n), 0, n - 1));
  }

  function updateNews() {
    if (!newsShift) return;
    var p = sectionProgress(nodes.news);
    var x = p * newsShift;
    nodes.newsTrack.style.setProperty("--nx", x.toFixed(1));
    // Легкий паралакс фото всередині кожної картки
    var cards = nodes.newsTrack.children;
    var vw = window.innerWidth;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      var k = clamp((r.left + r.width) / (vw + r.width), 0, 1);
      cards[i].style.setProperty("--par", (1 - k).toFixed(3));
    }
  }

  function updateChrome() {
    var y = window.scrollY;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    nodes.progress.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);
    nodes.toTop.classList.toggle("is-visible", y > window.innerHeight * 2);

    // Шапка ховається при скролі вниз і повертається при скролі вгору
    var menuOpen = document.getElementById("mobile-nav").classList.contains("is-open");
    var hide = y > lastY + 4 && y > window.innerHeight * 1.2 && !menuOpen;
    if (y < lastY - 4 || y < 100) nodes.header.classList.remove("is-hidden");
    else if (hide) nodes.header.classList.add("is-hidden");
    lastY = y;

    // Активний пункт меню — «пігулка» їде під ним
    var mid = window.innerHeight * 0.4;
    var current = null;
    nodes.navLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (!sec) return;
      var r = sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) current = a;
    });
    if (current !== nodes.activeLink) {
      nodes.activeLink = current;
      nodes.navLinks.forEach(function (a) { a.classList.toggle("is-active", a === current); });
      movePill();
    }
  }

  function movePill() {
    var nav = nodes.nav;
    if (!nav) return;
    var a = nodes.activeLink;
    nav.classList.toggle("has-active", !!a);
    if (!a) return;
    nav.style.setProperty("--px", a.offsetLeft + "px");
    nav.style.setProperty("--pw", a.offsetWidth + "px");
  }

  function onScroll() {
    updateHero();
    updateManifest();
    updateDirections();
    updateNews();
    updateChrome();
  }

  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      onScroll();
    });
  }

  /* ---------------- Header / меню / мова ---------------- */
  function bindChrome() {
    var toggle = document.getElementById("nav-toggle");
    var mobileNav = document.getElementById("mobile-nav");
    function setMenu(open) {
      mobileNav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) nodes.header.classList.remove("is-hidden");
    }
    toggle.addEventListener("click", function () {
      setMenu(!mobileNav.classList.contains("is-open"));
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) setMenu(false);
    });

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () { setLang(btn.getAttribute("data-lang")); });
    });

    nodes.toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------------- Курсор і «магнітні» кнопки ---------------- */
  function bindCursor() {
    var cursor = document.getElementById("cursor");
    if (!finePointer || reduced || !cursor) {
      if (cursor) cursor.remove();
      return;
    }
    var label = document.getElementById("cursor-label");
    var tx = -100, ty = -100, cx = -100, cy = -100;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.remove("is-hidden");
    }, { passive: true });
    document.addEventListener("pointerleave", function () { cursor.classList.add("is-hidden"); });
    (function loop() {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.setProperty("--cx", cx.toFixed(1) + "px");
      cursor.style.setProperty("--cy", cy.toFixed(1) + "px");
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", function (e) {
      var target = e.target.closest("[data-cursor], a, button, label, input, select, textarea");
      cursor.classList.remove("is-label", "is-link");
      if (!target) return;
      var kind = target.getAttribute("data-cursor");
      if (kind && !e.target.closest("a, button")) {
        label.textContent = t("cursor." + kind);
        cursor.classList.add("is-label");
      } else if (!target.matches("input, select, textarea")) {
        cursor.classList.add("is-link");
      }
    });

    document.querySelectorAll("[data-magnetic]").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () {
        b.style.setProperty("--mx", "0px");
        b.style.setProperty("--my", "0px");
      });
    });
  }

  /* ---------------- Master render ---------------- */
  function renderAll() {
    applyStaticText();
    renderHeroFacts();
    renderAbout();
    renderDirectionTabs();
    renderTeam();
    renderJoin();
    renderMedia();
    renderFooter();
    renderContactStatic();
    requestAnimationFrame(movePill);
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    state.lang = detectInitialLang();
    document.documentElement.lang = state.lang === "ua" ? "uk" : "en";
    if (reduced) document.documentElement.classList.add("reduced-motion");

    nodes = {
      hero: document.getElementById("hero"),
      header: document.getElementById("site-header"),
      manifest: document.getElementById("about-manifest"),
      directions: document.getElementById("directions"),
      dirProgress: document.getElementById("directions-progress"),
      news: document.getElementById("media"),
      newsTrack: document.getElementById("news-grid"),
      progress: document.getElementById("scroll-progress"),
      toTop: document.getElementById("to-top"),
      nav: document.getElementById("main-nav"),
      navLinks: Array.prototype.slice.call(document.querySelectorAll("#main-nav a")),
      activeLink: null,
    };

    mountTrees();
    bindTheme();
    bindChrome();
    bindTeam();
    bindNews();
    bindJoinEvents();
    bindContactForm();
    bindNewsletterForm();
    initHeroSlides();

    renderAll();
    observeReveals(document.body);
    document.getElementById("year").textContent = new Date().getFullYear();

    bindCursor();
    runPreloader();

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", function () {
      measureNews();
      movePill();
      requestTick();
    });
    if (mqMobile.addEventListener) mqMobile.addEventListener("change", function () { measureNews(); requestTick(); });
    // Шрифти змінюють ширину стрічки новин і пунктів меню — перемірюємо після завантаження
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureNews(); movePill(); requestTick(); });
    window.addEventListener("load", function () { measureNews(); requestTick(); });
    onScroll();
  });
})();
