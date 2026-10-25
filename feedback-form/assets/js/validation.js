/* =====================================================================
   Лаб. 9 — клієнтська валідація форми зворотного зв'язку.
   Vanilla JS, без бібліотек. Це перевірка для зручності (UX), а не захист:
   сервер, якщо форма надсилатиме дані, має перевіряти їх повторно.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Регулярні вирази ---------- */

  // Телефон: рівно «+380» і 9 цифр, нічого більше (без пробілів, дужок, дефісів, літер)
  const PHONE_RE = /^\+380\d{9}$/;

  // Email: локальна частина — блоки [A-Za-z0-9_%+-], розділені однією крапкою;
  // домен — мітки з літер/цифр/дефісів (дефіс не на краях), розділені крапкою; зона — від 2 літер
  const EMAIL_RE = /^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  // Ім'я: слова з будь-яких літер Unicode (кирилиця, латиниця), між словами — один пробіл,
  // дефіс або апостроф (' ’ ʼ). Цифри, емодзі, HTML-теги, подвійні пробіли — не проходять
  const NAME_RE = /^\p{L}+(?:[ '’ʼ-]\p{L}+)*$/u;

  const LIMITS = { nameMin: 2, nameMax: 60, emailMax: 254, messageMin: 10, messageMax: 1000 };

  /* ---------- Функції валідації: повертають текст помилки або "" ---------- */

  function validateName(value) {
    const v = value.trim();
    if (!v) return "Вкажіть ім'я.";
    if (v.length < LIMITS.nameMin) return "Ім'я має містити щонайменше 2 літери.";
    if (v.length > LIMITS.nameMax) return "Ім'я задовге — до 60 символів.";
    if (!NAME_RE.test(v)) return "Використовуйте лише літери; між словами — пробіл, дефіс або апостроф.";
    return "";
  }

  function validateEmail(value) {
    const v = value.trim();
    if (!v) return "Вкажіть email.";
    if (v.length > LIMITS.emailMax || !EMAIL_RE.test(v)) return "Перевірте email — він має бути у форматі name@example.com.";
    return "";
  }

  function validatePhone(value) {
    const v = value.trim();
    if (!v) return "Вкажіть номер телефону.";
    if (/[^\d+]/.test(v)) return "Номер може містити лише цифри після «+380» — без літер і пробілів.";
    if (!PHONE_RE.test(v)) {
      const digits = v.replace(/\D/g, "").length;
      if (v.startsWith("+380") && digits < 12) return "Замало цифр: після +380 потрібно рівно 9 цифр.";
      if (v.startsWith("+380") && digits > 12) return "Забагато цифр: після +380 потрібно рівно 9 цифр.";
      return "Введіть номер у форматі +380XXXXXXXXX.";
    }
    return "";
  }

  function validateMessage(value) {
    const len = value.trim().length;
    if (!len) return "Напишіть повідомлення.";
    if (len < LIMITS.messageMin) return "Повідомлення закоротке — щонайменше 10 символів (зараз " + len + ").";
    if (len > LIMITS.messageMax) return "Повідомлення задовге — до 1000 символів (зараз " + len + ").";
    return "";
  }

  function validateAgreement(checked) {
    return checked ? "" : "Щоб надіслати форму, погодьтеся з обробкою персональних даних.";
  }

  /* ---------- DOM ---------- */

  const form = document.getElementById("feedbackForm");
  if (!form) return;

  const FIELDS = {
    name: { el: form.elements.name, validate: () => validateName(form.elements.name.value) },
    phone: { el: form.elements.phone, validate: () => validatePhone(form.elements.phone.value) },
    email: { el: form.elements.email, validate: () => validateEmail(form.elements.email.value) },
    message: { el: form.elements.message, validate: () => validateMessage(form.elements.message.value) },
    agree: { el: form.elements.agree, validate: () => validateAgreement(form.elements.agree.checked) },
  };
  const ORDER = ["name", "phone", "email", "message", "agree"]; // порядок як на екрані

  const statusBox = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = document.getElementById("submitLabel");
  const spinner = submitBtn.querySelector(".spinner");
  const phoneHint = document.getElementById("phoneHint");
  const counter = document.getElementById("messageCount");

  // Поле вважається «торкнутим» після першого виходу з нього з непорожнім значенням
  // або після спроби надіслати форму. До цього помилок не показуємо.
  const touched = new Set();
  let submitted = false;
  let sending = false;

  /* ---------- UI-функції ---------- */

  function wrap(id) {
    return form.querySelector('[data-field="' + id + '"]');
  }

  // describedby = підказка (+ лічильник) + за потреби помилка
  function setDescribedBy(id, withError) {
    const el = FIELDS[id].el;
    const base = (el.dataset.baseDescribedby ||= el.getAttribute("aria-describedby") || "");
    const parts = base.split(" ").filter((x) => x && x !== id + "Error");
    if (withError) parts.push(id + "Error");
    if (parts.length) el.setAttribute("aria-describedby", parts.join(" "));
  }

  function showError(id, message) {
    const el = FIELDS[id].el;
    const err = document.getElementById(id + "Error");
    wrap(id).dataset.state = "error";
    el.classList.remove("border-green-500");
    el.classList.add("border-red-500");
    el.setAttribute("aria-invalid", "true");
    err.textContent = message;
    err.hidden = false;
    setDescribedBy(id, true);
  }

  function showSuccess(id) {
    const el = FIELDS[id].el;
    const err = document.getElementById(id + "Error");
    wrap(id).dataset.state = "success";
    el.classList.remove("border-red-500");
    el.classList.add("border-green-500");
    el.setAttribute("aria-invalid", "false");
    err.textContent = "";
    err.hidden = true;
    setDescribedBy(id, false);
  }

  function clearError(id) {
    const el = FIELDS[id].el;
    const err = document.getElementById(id + "Error");
    delete wrap(id).dataset.state;
    el.classList.remove("border-red-500", "border-green-500");
    el.setAttribute("aria-invalid", "false");
    err.textContent = "";
    err.hidden = true;
    setDescribedBy(id, false);
  }

  // Перевірити одне поле й показати результат. silentErrors — лише «зелений» стан, без червоного
  function check(id, silentErrors) {
    const message = FIELDS[id].validate();
    if (!message) showSuccess(id);
    else if (silentErrors) clearError(id);
    else showError(id, message);
    return !message;
  }

  /* ---------- Телефон: м'яке автоформатування ---------- */

  // Змінюємо значення лише коли це однозначно і пояснюємо зміну підказкою.
  // Літери не видаляємо — їх побачить валідація і покаже помилку.
  function normalizePhone() {
    const el = FIELDS.phone.el;
    const raw = el.value;
    let v = raw;
    let note = "";

    if (/[\s()\-.]/.test(v) && !/[^\d\s()\-.+]/.test(v)) {
      v = v.replace(/[\s()\-.]/g, "");
      note = "Пробіли, дужки й дефіси прибрано автоматично.";
    }
    if (/^0\d{9}$/.test(v)) {
      v = "+38" + v;
      note = "Номер перетворено у формат +380: «" + raw.trim() + "» → «" + v + "».";
    } else if (/^380\d{9}$/.test(v)) {
      v = "+" + v;
      note = "Додано «+» на початку номера.";
    }

    if (v !== raw) {
      el.value = v;
      phoneHint.textContent = note;
      phoneHint.hidden = false;
    } else if (!raw) {
      phoneHint.hidden = true;
      phoneHint.textContent = "";
    }
  }

  function updateCounter() {
    const len = FIELDS.message.el.value.trim().length;
    counter.textContent = len + " / " + LIMITS.messageMax;
    counter.classList.toggle("is-over", len > LIMITS.messageMax);
  }

  /* ---------- Динамічна валідація: input, blur, change ---------- */

  ORDER.forEach(function (id) {
    const el = FIELDS[id].el;

    if (el.type === "checkbox") {
      // Для checkbox взаємодія = зміна стану
      el.addEventListener("change", function () {
        touched.add(id);
        check(id, false);
        refreshStatus();
      });
      return;
    }

    // input: поки поле не «торкнуте» — лише позитивний відгук (зелена рамка), без червоного
    el.addEventListener("input", function () {
      if (id === "phone") normalizePhone();
      if (id === "message") updateCounter();
      check(id, !touched.has(id));
      refreshStatus();
    });

    // blur: фінальна перевірка поля, якщо користувач щось у нього вводив
    el.addEventListener("blur", function () {
      if (id === "phone") normalizePhone();
      if (el.value.trim() === "" && !touched.has(id)) return; // пройшли Tab-ом повз — не сваримо
      touched.add(id);
      check(id, false);
      refreshStatus();
    });
  });

  // Підсумок над формою: показуємо лише після першої спроби надсилання
  function refreshStatus() {
    if (!submitted) return;
    const bad = ORDER.filter((id) => FIELDS[id].validate());
    if (!bad.length) {
      statusBox.hidden = true;
      statusBox.textContent = "";
      return;
    }
    statusBox.textContent = bad.length === 1
      ? "Перевірте 1 поле, позначене червоним."
      : "Перевірте " + bad.length + " " + (bad.length < 5 ? "поля" : "полів") + ", позначені червоним.";
    statusBox.hidden = false;
  }

  /* ---------- Надсилання ---------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // без перезавантаження сторінки і без справжньої відправки
    if (sending) return;    // захист від швидкого повторного натискання

    submitted = true;
    normalizePhone();
    let firstInvalid = null;
    ORDER.forEach(function (id) {
      touched.add(id);
      const ok = check(id, false);
      if (!ok && !firstInvalid) firstInvalid = id;
    });
    refreshStatus();

    if (firstInvalid) {
      FIELDS[firstInvalid].el.focus(); // фокус на перше поле з помилкою
      return;
    }

    // Імітація надсилання: бекенду немає, тому лише коротка пауза з індикатором
    sending = true;
    submitBtn.disabled = true;
    spinner.classList.remove("hidden");
    submitLabel.textContent = "Перевіряємо…";

    const firstName = FIELDS.name.el.value.trim().split(/\s+/)[0];
    setTimeout(function () {
      form.reset();       // очищаємо поля
      resetStates();      // і прибираємо зелені рамки
      sending = false;
      submitBtn.disabled = false;
      spinner.classList.add("hidden");
      submitLabel.textContent = "Надіслати";
      openModal(firstName);
    }, 600);
  });

  function resetStates() {
    ORDER.forEach(clearError);
    touched.clear();
    submitted = false;
    statusBox.hidden = true;
    phoneHint.hidden = true;
    updateCounter();
  }

  /* ---------- Модальне вікно ---------- */

  const modal = document.getElementById("successModal");
  const card = document.getElementById("successCard");
  const closeBtn = document.getElementById("successClose");
  const page = document.getElementById("page");
  let lastFocus = null;

  function openModal(firstName) {
    // textContent, а не innerHTML: введене ім'я ніколи не виконується як HTML
    document.getElementById("successName").textContent = firstName ? firstName + ", усі" : "Усі";
    lastFocus = document.activeElement;
    modal.hidden = false;
    page.inert = true;                       // сторінка під вікном недоступна для кліків, Tab і скрінрідера
    document.body.classList.add("modal-open");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeModal() {
    modal.hidden = true;
    page.inert = false;
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onKeydown);
    (FIELDS.name.el || lastFocus).focus(); // повертаємо фокус на початок порожньої форми
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    } else if (event.key === "Tab") {
      // Пастка фокусу: у вікні одна кнопка, тож Tab / Shift+Tab лишаються на ній
      event.preventDefault();
      closeBtn.focus();
    }
  }

  closeBtn.addEventListener("click", closeModal);

  // Клік по затемненню закриває вікно, клік усередині білої картки — ні
  modal.addEventListener("click", function (event) {
    if (!card.contains(event.target)) closeModal();
  });

  updateCounter();
})();
