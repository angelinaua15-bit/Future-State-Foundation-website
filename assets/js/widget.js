/* =====================================================================
   Лаб. 11 — «Калькулятор волонтерського часу» (Vanilla JS).
   Перша версія — GitHub Copilot; далі виправлено за результатами QA:
   від'ємні/дробові значення поза межами, badInput, Enter у формі,
   ізоляція (кілька екземплярів), двомовність. Деталі — у CHANGELOG.

   Принципи:
   • жодних нових глобальних змінних — усе в IIFE;
   • кожен [data-volunteer-calc] — окремий екземпляр зі своїм станом,
     частини шукаються через data-vc лише всередині кореня;
   • будь-яке значення з DOM вважається «брудним»: парсимо, перевіряємо
     Number.isNaN / Number.isFinite / діапазон, і лише тоді рахуємо;
   • вивід тільки через textContent (без innerHTML).
   ===================================================================== */
(function () {
  "use strict";

  var HOURS_MIN = 1;
  var HOURS_MAX = 40;
  var FRIENDS_MAX = 5;
  var DEFAULT_MONTHS = 3;
  var EVENTS_PER_MONTH = 4; // год щомісяця за участь у подіях
  var BRIEFING_HOURS = 2; // разовий інструктаж
  // Тижні в періоді: round(місяці × 52 / 12). Білий список — підмінене значення select не пройде.
  var WEEKS = { 1: 4, 3: 13, 6: 26, 12: 52 };
  var REQUIRED = ["form", "hours", "error", "duration", "events", "briefing", "friends", "friends-out", "total", "avg"];
  var PARTS = ["base", "events", "briefing", "friends"];

  // Класи Tailwind, які додаються/знімаються динамічно (Play CDN генерує їх «на льоту»)
  var CLS = {
    inputOk: ["tw-border-[color:var(--line-strong)]"],
    // «!» (important): стан помилки має перебивати focus-стилі поля, бо користувач саме в ньому друкує
    inputError: ["!tw-border-[color:var(--danger)]", "!tw-shadow-[0_0_0_4px_rgba(220,60,50,0.22)]"],
    msgError: ["tw-text-[color:var(--danger)]"],
    msgNotice: ["tw-text-muted"],
    idle: ["tw-opacity-50"], // підсумок «—», поки дані некоректні
  };

  var TEXT = {
    ua: {
      eyebrow: "Волонтерство",
      title: "Калькулятор волонтерського часу",
      subtitle: "Оберіть, скільки часу готові приділяти, — і побачите, скільки годин допомоги це дасть фундації.",
      hours: "Годин на тиждень", hoursRange: "від 1 до 40",
      hoursHelp: "Ціле число: стільки годин на тиждень ви готові допомагати.",
      duration: "Тривалість участі", m1: "1 місяць", m3: "3 місяці", m6: "6 місяців", m12: "12 місяців",
      extra: "Додатково",
      events: "Беру участь у подіях фундації", eventsHelp: "+4 год щомісяця",
      briefing: "Пройду вступний інструктаж", briefingHelp: "+2 год одноразово",
      friends: "Скільки друзів приведу",
      friendsHelp: "Кожен друг, що долучиться з таким самим графіком, додає ще стільки ж основних годин.",
      summary: "Ваш внесок", avg: "У середньому на місяць:",
      partBase: "Основні години", partEvents: "Події фундації", partBriefing: "Інструктаж", partFriends: "Друзі",
      note: "Розрахунок орієнтовний: місяць ≈ 4,33 тижня (1 міс. — 4 тиж., 3 — 13, 6 — 26, 12 — 52). Точний графік погоджуємо з координатором.",
      cta: "Записатися волонтером",
      unit: "год",
      errEmpty: "Вкажіть, скільки годин на тиждень готові приділяти (від 1 до 40).",
      errBad: "Введіть число цифрами, наприклад 5.",
      errMin: "Мінімум — 1 година на тиждень.",
      errMax: "Максимум — 40 годин на тиждень: так залишиться час на відпочинок.",
      notice: "Рахуємо цілі години: {from} → {to}.",
      friendsText: function (n) {
        var m10 = n % 10, m100 = n % 100;
        var w = m10 === 1 && m100 !== 11 ? "друг" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "друзі" : "друзів";
        return n + " " + w;
      },
      locale: "uk-UA",
    },
    en: {
      eyebrow: "Volunteering",
      title: "Volunteer time calculator",
      subtitle: "Choose how much time you can give and see how many hours of help it adds up to for the foundation.",
      hours: "Hours per week", hoursRange: "1 to 40",
      hoursHelp: "A whole number: how many hours a week you are ready to help.",
      duration: "Commitment", m1: "1 month", m3: "3 months", m6: "6 months", m12: "12 months",
      extra: "Extras",
      events: "I will join foundation events", eventsHelp: "+4 h every month",
      briefing: "I will attend the intro briefing", briefingHelp: "+2 h once",
      friends: "Friends I will bring",
      friendsHelp: "Every friend who joins on the same schedule adds the same number of core hours.",
      summary: "Your contribution", avg: "Monthly average:",
      partBase: "Core hours", partEvents: "Foundation events", partBriefing: "Briefing", partFriends: "Friends",
      note: "An estimate: a month ≈ 4.33 weeks (1 mo — 4 wks, 3 — 13, 6 — 26, 12 — 52). The exact schedule is agreed with a coordinator.",
      cta: "Sign up to volunteer",
      unit: "h",
      errEmpty: "Enter how many hours a week you can give (1 to 40).",
      errBad: "Please type a number, for example 5.",
      errMin: "The minimum is 1 hour a week.",
      errMax: "The maximum is 40 hours a week, so you still have time to rest.",
      notice: "We count whole hours: {from} → {to}.",
      friendsText: function (n) { return n + (n === 1 ? " friend" : " friends"); },
      locale: "en-GB",
    },
  };

  // Статичні підписи (label, підказки) — через спільний механізм data-i18n сайту (app.js)
  var dict = window.FSF_I18N;
  if (dict && dict.ua && dict.en) {
    ["ua", "en"].forEach(function (l) {
      var src = TEXT[l], out = {};
      Object.keys(src).forEach(function (k) {
        if (typeof src[k] === "string") out[k] = src[k];
      });
      dict[l].lab11 = out;
    });
  }

  function lang() {
    return document.documentElement.lang === "en" ? "en" : "ua";
  }

  /* ---------- Чисті функції (без DOM) — їх легко перевірити окремо ---------- */

  // Години на тиждень. badInput — прапорець браузера: у type=number ввели не число (value тоді "")
  function parseHours(raw, badInput) {
    if (badInput) return { ok: false, code: "errBad" };
    var str = String(raw == null ? "" : raw).trim();
    if (str === "") return { ok: false, code: "errEmpty" };
    var num = Number(str); // Number, а не parseInt: parseInt("2.5") мовчки дає 2, а parseInt("5abc") — 5
    if (Number.isNaN(num) || !Number.isFinite(num)) return { ok: false, code: "errBad" };
    // Діапазон перевіряємо ДО округлення (баг v1: -5.5 → -5 → від'ємна сума, 40.6 → 41)
    if (num < HOURS_MIN) return { ok: false, code: "errMin" };
    if (num > HOURS_MAX) return { ok: false, code: "errMax" };
    var value = Math.round(num);
    return { ok: true, value: value, rounded: value !== num, from: num };
  }

  // Ціле в межах [min, max]; усе інше — fallback (захист від підміни через DevTools)
  function safeInt(raw, fallback, min, max) {
    var n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function calculate(input) {
    var weeks = WEEKS[input.months];
    var base = input.hours * weeks;
    var parts = {
      base: base,
      events: input.events ? EVENTS_PER_MONTH * input.months : 0,
      briefing: input.briefing ? BRIEFING_HOURS : 0,
      friends: input.friends * base,
    };
    var total = parts.base + parts.events + parts.briefing + parts.friends;
    return { parts: parts, total: total, avg: total / input.months };
  }

  // Форматери Intl створюються один раз на мову й точність (а не на кожну подію input)
  var formatters = {};
  function fmt(n, digits) {
    // Остання лінія оборони: у вивід не потрапляє NaN, Infinity, від'ємне чи -0
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return "—";
    var L = TEXT[lang()], key = L.locale + (digits || 0);
    if (!formatters[key]) {
      formatters[key] = new Intl.NumberFormat(L.locale, { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
    }
    return formatters[key].format(n + 0) + " " + L.unit; // n + 0 перетворює -0 на 0
  }

  /* ---------- Екземпляр віджета ---------- */

  function createCalculator(root) {
    if (root.getAttribute("data-vc-ready") === "true") return null; // повторне підключення скрипта — без дублювання слухачів

    var el = {};
    var missing = REQUIRED.filter(function (name) {
      el[name] = root.querySelector('[data-vc="' + name + '"]');
      return !el[name];
    });
    if (missing.length) {
      console.warn("[volunteer-calc] Віджет не запущено: немає елементів data-vc=" + missing.join(", "), root);
      return null;
    }
    el.friendsOut = el["friends-out"];
    el.parts = {};
    PARTS.forEach(function (p) { el.parts[p] = root.querySelector('[data-vc-part="' + p + '"]'); });

    function swap(node, remove, add) {
      remove.forEach(function (c) { node.classList.remove(c); });
      add.forEach(function (c) { node.classList.add(c); });
    }

    function showMessage(kind, text) {
      var t = el.error;
      t.textContent = text || "";
      t.classList.toggle("tw-hidden", !text);
      swap(t, kind === "error" ? CLS.msgNotice : CLS.msgError, kind === "error" ? CLS.msgError : CLS.msgNotice);
      var invalid = kind === "error";
      el.hours.setAttribute("aria-invalid", invalid ? "true" : "false");
      swap(el.hours, invalid ? CLS.inputOk : CLS.inputError, invalid ? CLS.inputError : CLS.inputOk);
    }

    function readMonths() {
      var m = Number.parseInt(el.duration.value, 10);
      // Лише значення з білого списку; без «підтягування» до меж — інакше -999 тихо стало б 1 місяцем
      if (Number.isNaN(m) || !Object.prototype.hasOwnProperty.call(WEEKS, m)) {
        console.warn("[volunteer-calc] Неочікувана тривалість «" + el.duration.value + "», використано " + DEFAULT_MONTHS + " міс.");
        m = DEFAULT_MONTHS;
        el.duration.value = String(m);
      }
      return m;
    }

    function readFriends() {
      var f = safeInt(el.friends.value, 0, 0, FRIENDS_MAX);
      if (String(f) !== el.friends.value) el.friends.value = String(f); // підмінений max/value повертаємо в межі
      return f;
    }

    function renderPlaceholder() {
      el.total.textContent = "—";
      el.avg.textContent = "—";
      PARTS.forEach(function (p) { if (el.parts[p]) el.parts[p].textContent = "—"; });
      swap(el.total, [], CLS.idle);
    }

    function update() {
      var L = TEXT[lang()];
      var friends = readFriends();
      el.friendsOut.textContent = String(friends);
      el.friends.setAttribute("aria-valuetext", L.friendsText(friends));

      var h = parseHours(el.hours.value, el.hours.validity && el.hours.validity.badInput);
      if (!h.ok) {
        showMessage("error", L[h.code]);
        renderPlaceholder();
        return;
      }
      if (h.rounded) {
        showMessage("notice", L.notice.replace("{from}", String(h.from).replace(".", lang() === "ua" ? "," : ".")).replace("{to}", String(h.value)));
      } else {
        showMessage("none", "");
      }

      var r = calculate({
        hours: h.value,
        months: readMonths(),
        events: el.events.checked === true,
        briefing: el.briefing.checked === true,
        friends: friends,
      });
      if (!Number.isFinite(r.total) || r.total < 0) { // теоретично недосяжно, але не показуємо сміття
        console.error("[volunteer-calc] Некоректний результат", r);
        renderPlaceholder();
        return;
      }
      el.total.textContent = fmt(r.total);
      el.avg.textContent = fmt(r.avg, 1);
      PARTS.forEach(function (p) {
        if (el.parts[p]) el.parts[p].textContent = (p === "base" ? "" : "+") + fmt(r.parts[p]);
      });
      swap(el.total, CLS.idle, []);
    }

    // Enter у полі відправив би форму GET-запитом і перезавантажив сторінку (баг v1)
    el.form.addEventListener("submit", function (e) { e.preventDefault(); update(); });
    // Одна делегована підписка на корінь: input — набір цифр і повзунок, change — select і чекбокси
    root.addEventListener("input", update);
    root.addEventListener("change", update);

    root.setAttribute("data-vc-ready", "true");
    update();
    return { update: update };
  }

  /* ---------- Запуск ---------- */
  function init() {
    var instances = [];
    var roots = document.querySelectorAll("[data-volunteer-calc]");
    if (!roots.length) {
      console.warn("[volunteer-calc] На сторінці немає [data-volunteer-calc] — віджет не запущено.");
      return;
    }
    Array.prototype.forEach.call(roots, function (root) {
      var inst = createCalculator(root);
      if (inst) instances.push(inst);
    });
    // Мова сайту змінюється атрибутом <html lang> — перераховуємо тексти помилок і формат чисел
    if (instances.length && "MutationObserver" in window) {
      new MutationObserver(function () {
        instances.forEach(function (i) { i.update(); });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
