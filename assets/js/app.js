/* ==========================================================================
   Фундація майбутнього держави — інтерактивність
   Vanilla JS, без залежностей і без збірки.
   ========================================================================== */
(function () {
  "use strict";

  var DICT = window.FSF_I18N;
  var DATA = window.FSF_DATA;
  var LANG_KEY = "fsf-lang";

  var state = {
    lang: "ua",
    join: { view: "wizard", step: 1, role: null, direction: null, detail: null },
  };

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
  }

  /* ---------------- generic data-i18n binding ---------------- */
  function applyStaticText() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === state.lang);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === state.lang ? "true" : "false");
    });
  }

  /* ---------------- utility: build a card and register reveal ---------------- */
  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function icon(name) {
    var icons = {
      arrow: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
    return icons[name] || "";
  }

  /* ---------------- About ---------------- */
  function renderAbout() {
    var wrap = document.getElementById("about-values");
    if (!wrap) return;
    wrap.innerHTML = "";
    t("about.values").forEach(function (v, i) {
      var div = el("div", "reveal");
      div.style.setProperty("--reveal-delay", i * 90);
      div.innerHTML =
        '<div class="value-card"><div class="value-card__dot"></div><h3>' + v.title + "</h3><p>" + v.text + "</p></div>";
      wrap.appendChild(div);
    });
    observeReveals(wrap);
  }

  /* ---------------- Directions ---------------- */
  function renderDirections() {
    var wrap = document.getElementById("directions-grid");
    if (!wrap) return;
    wrap.innerHTML = "";
    t("directions.items").forEach(function (item, i) {
      var li = el("li", "reveal");
      li.style.setProperty("--reveal-delay", i * 90);
      li.innerHTML =
        '<div class="card direction-card">' +
        '<div class="direction-card__icon"><img src="assets/img/icons/' + item.icon + '.svg" alt="" width="26" height="26" /></div>' +
        "<h3>" + item.title + "</h3>" +
        "<p>" + item.text + "</p>" +
        '<a href="#join" class="btn-text">' + t("directions.cta") + " " + icon("arrow") + "</a>" +
        "</div>";
      wrap.appendChild(li);
    });
    observeReveals(wrap);
  }

  /* ---------------- Hero facts ---------------- */
  function renderHeroFacts() {
    var heroStats = document.getElementById("hero-stats");
    if (!heroStats) return;
    heroStats.innerHTML = "";
    t("hero.facts").forEach(function (m) {
      var valueHtml = m.counter
        ? '<div class="hero__stat-value" data-counter data-target="' + m.value + '" data-suffix="">0</div>'
        : '<div class="hero__stat-value">' + m.value + "</div>";
      var div = el("div", "", valueHtml + '<div class="hero__stat-label">' + m.label + "</div>");
      heroStats.appendChild(div);
    });
    observeCounters(heroStats);
  }

  /* ---------------- Team ---------------- */
  function renderTeam() {
    var wrap = document.getElementById("team-grid");
    if (!wrap) return;
    wrap.innerHTML = "";
    DATA.team.forEach(function (m, i) {
      var li = el("li", "reveal");
      li.style.setProperty("--reveal-delay", (i % 3) * 90);
      li.innerHTML =
        '<div class="card team-card">' +
        '<div class="team-card__media"><img src="' + m.img + '" alt="" loading="lazy" /></div>' +
        '<div class="team-card__body">' +
        "<h3>" + m.name + "</h3>" +
        '<p class="role">' + m.role[state.lang] + "</p>" +
        '<button type="button" class="btn-text" data-team-open="' + i + '">' + t("team.readMore") + " " + icon("arrow") + "</button>" +
        "</div></div>";
      wrap.appendChild(li);
    });
    observeReveals(wrap);
  }

  var lastFocusedBeforeModal = null;

  function openTeamModal(index) {
    var member = DATA.team[index];
    if (!member) return;
    var backdrop = document.getElementById("team-modal");
    document.getElementById("team-modal-name").textContent = member.name;
    document.getElementById("team-modal-role").textContent = member.role[state.lang];
    document.getElementById("team-modal-bio").textContent = member.bio[state.lang];
    lastFocusedBeforeModal = document.activeElement;
    backdrop.classList.add("is-open");
    document.body.classList.add("modal-open");
    document.getElementById("team-modal-close").focus();
  }

  function closeTeamModal() {
    var backdrop = document.getElementById("team-modal");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    if (lastFocusedBeforeModal && lastFocusedBeforeModal.focus) lastFocusedBeforeModal.focus();
  }

  /* ---------------- Media / News ---------------- */
  function renderMedia() {
    var wrap = document.getElementById("news-grid");
    var dotsWrap = document.getElementById("news-dots");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (dotsWrap) dotsWrap.innerHTML = "";
    var formatter = new Intl.DateTimeFormat(state.lang === "ua" ? "uk-UA" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    DATA.news.forEach(function (n, i) {
      var li = el("li", "reveal news-carousel__slide");
      li.style.setProperty("--reveal-delay", i * 100);
      li.innerHTML =
        '<article class="card news-card">' +
        '<div class="news-card__media"><img src="' + n.image + '" alt="" loading="lazy" /></div>' +
        '<div class="news-card__body">' +
        '<time class="news-card__date" datetime="' + n.date + '">' + formatter.format(new Date(n.date)) + "</time>" +
        "<h3>" + n.title[state.lang] + "</h3>" +
        "<p>" + n.text[state.lang] + "</p>" +
        '<span class="btn-text">' + t("media.readMore") + " " + icon("arrow") + "</span>" +
        "</div></article>";
      wrap.appendChild(li);

      if (dotsWrap) {
        var dot = el("button", "news-carousel__dot" + (i === 0 ? " is-active" : ""));
        dot.type = "button";
        dot.setAttribute("aria-label", (state.lang === "ua" ? "Новина " : "News ") + (i + 1));
        dot.addEventListener("click", function () {
          scrollNewsToSlide(i);
        });
        dotsWrap.appendChild(dot);
      }
    });
    observeReveals(wrap);
    wrap.scrollLeft = 0;
    updateNewsNavState(wrap);
    updateNewsActiveDot(wrap, dotsWrap);
  }

  function updateNewsActiveDot(track, dotsWrap) {
    if (!dotsWrap) return;
    var slides = track.querySelectorAll(".news-carousel__slide");
    var dots = dotsWrap.querySelectorAll(".news-carousel__dot");
    if (!slides.length || !dots.length) return;
    var trackLeft = track.getBoundingClientRect().left;
    var closestIdx = 0;
    var closestDist = Infinity;
    slides.forEach(function (s, i) {
      var dist = Math.abs(s.getBoundingClientRect().left - trackLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === closestIdx);
    });
  }

  function newsScrollAmount(track) {
    var slide = track.querySelector(".news-carousel__slide");
    if (!slide) return track.clientWidth;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap) || 22;
    return slide.getBoundingClientRect().width + gap;
  }

  function scrollNewsToSlide(i) {
    var track = document.getElementById("news-grid");
    if (!track) return;
    var slide = track.children[i];
    if (!slide) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delta = slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({ left: track.scrollLeft + delta, behavior: reduced ? "auto" : "smooth" });
  }

  function updateNewsNavState(track) {
    var prev = document.getElementById("news-prev");
    var next = document.getElementById("news-next");
    if (!prev || !next) return;
    var max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = max <= 4 || track.scrollLeft >= max - 4;
  }

  function bindNewsCarousel() {
    var track = document.getElementById("news-grid");
    var prev = document.getElementById("news-prev");
    var next = document.getElementById("news-next");
    if (!track || !prev || !next) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    prev.addEventListener("click", function () {
      track.scrollBy({ left: -newsScrollAmount(track), behavior: reduced ? "auto" : "smooth" });
    });
    next.addEventListener("click", function () {
      track.scrollBy({ left: newsScrollAmount(track), behavior: reduced ? "auto" : "smooth" });
    });
    var dotsWrap = document.getElementById("news-dots");
    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        updateNewsNavState(track);
        updateNewsActiveDot(track, dotsWrap);
        ticking = false;
      });
    });
    window.addEventListener("resize", function () {
      updateNewsNavState(track);
      updateNewsActiveDot(track, dotsWrap);
    });
  }

  /* ---------------- Footer ---------------- */
  function renderFooter() {
    var links = document.getElementById("footer-links");
    if (links) {
      links.innerHTML = "";
      t("footer.links").forEach(function (l) {
        var li = el("li", "", '<a href="' + l.href + '">' + l.label + "</a>");
        links.appendChild(li);
      });
    }
    var contacts = document.getElementById("footer-contacts");
    if (contacts) {
      contacts.innerHTML =
        '<li><a href="mailto:' + DATA.contact.email + '">' + DATA.contact.email + "</a></li>" +
        '<li><a href="tel:' + DATA.contact.phone.replace(/\s/g, "") + '">' + DATA.contact.phone + "</a></li>";
    }
  }

  /* ---------------- Contact info + socials ---------------- */
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
        var a = el("a", id === "social-row" ? "social-btn" : "", id === "social-row" ? socialSvg(s.id) : s.label.slice(0, 1));
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
      if (currentValue && t("contact.form.subjectOptions").indexOf(currentValue) > -1) {
        subjectSelect.value = currentValue;
      }
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

  /* ---------------- Scroll reveal ---------------- */
  var revealObserver = null;
  function getRevealObserver() {
    if (revealObserver) return revealObserver;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    return revealObserver;
  }

  function observeReveals(container) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var items = container.querySelectorAll(".reveal");
    if (reduced) {
      items.forEach(function (i) {
        i.classList.add("is-visible");
      });
      return;
    }
    var obs = getRevealObserver();
    items.forEach(function (i) {
      obs.observe(i);
    });
  }

  /* ---------------- Counters ---------------- */
  var counterObserver = null;
  function getCounterObserver() {
    if (counterObserver) return counterObserver;
    counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    return counterObserver;
  }

  function animateCounter(node) {
    var target = parseInt(node.getAttribute("data-target"), 10) || 0;
    var suffix = node.getAttribute("data-suffix") || "";
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      node.textContent = target.toLocaleString("uk-UA") + suffix;
      return;
    }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(eased * target).toLocaleString("uk-UA") + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function observeCounters(container) {
    var items = container.querySelectorAll("[data-counter]");
    var obs = getCounterObserver();
    items.forEach(function (i) {
      obs.observe(i);
    });
  }

  /* ---------------- Header / mobile nav / back-to-top ---------------- */
  function bindChrome() {
    var header = document.getElementById("site-header");
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      var toTop = document.getElementById("to-top");
      if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = document.getElementById("nav-toggle");
    var mobileNav = document.getElementById("mobile-nav");
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });

    var toTop = document.getElementById("to-top");
    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    var hero = document.getElementById("hero");
    if (hero && window.matchMedia("(hover: hover)").matches) {
      hero.addEventListener("mousemove", function (e) {
        var rect = hero.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty("--mx", x + "%");
        hero.style.setProperty("--my", y + "%");
      });
    }
  }

  function bindTeamModal() {
    var grid = document.getElementById("team-grid");
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-team-open]");
      if (!btn) return;
      openTeamModal(parseInt(btn.getAttribute("data-team-open"), 10));
    });
    document.getElementById("team-modal-close").addEventListener("click", closeTeamModal);
    document.getElementById("team-modal").addEventListener("click", function (e) {
      if (e.target === e.currentTarget) closeTeamModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.getElementById("team-modal").classList.contains("is-open")) {
        closeTeamModal();
      }
    });
  }

  /* ---------------- Forms ---------------- */
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

      // No backend on static hosting by default — swap this block for a
      // real endpoint (Formspree / EmailJS / your own API) when ready.
      // See README "Підключення форм" for exact steps.
      setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = t("contact.form.submit");
        status.textContent = t("contact.form.success");
        status.classList.add("success");
        form.reset();
      }, 500);
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
      status.textContent = t("footer.newsletterSuccess");
      status.classList.add("success");
      form.reset();
    });
  }

  /* ---------------- Master render ---------------- */
  function renderAll() {
    applyStaticText();
    renderAbout();
    renderDirections();
    renderHeroFacts();
    renderTeam();
    renderJoin();
    renderMedia();
    renderFooter();
    renderContactStatic();
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    state.lang = detectInitialLang();
    document.documentElement.lang = state.lang === "ua" ? "uk" : "en";

    bindChrome();
    bindTeamModal();
    bindJoinEvents();
    bindContactForm();
    bindNewsletterForm();
    bindNewsCarousel();

    renderAll();

    // Reveal any static (non-JS-generated) sections marked with .reveal
    observeReveals(document.body);

    document.getElementById("year").textContent = new Date().getFullYear();
  });
})();
