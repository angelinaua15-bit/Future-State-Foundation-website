(() => {
  const REQUIRED_IDS = [
    "vc-hours",
    "vc-hours-help",
    "vc-error-hours",
    "vc-duration",
    "vc-events",
    "vc-briefing",
    "vc-friends",
    "vc-friends-out",
    "vc-total",
    "vc-breakdown",
    "vc-month-avg"
  ];

  const missing = REQUIRED_IDS.filter((id) => !document.getElementById(id));
  if (missing.length) {
    console.warn("Widget calculator: missing required elements:", missing);
    return;
  }

  const elements = {
    hours: document.getElementById("vc-hours"),
    errorHours: document.getElementById("vc-error-hours"),
    duration: document.getElementById("vc-duration"),
    events: document.getElementById("vc-events"),
    briefing: document.getElementById("vc-briefing"),
    friends: document.getElementById("vc-friends"),
    friendsOut: document.getElementById("vc-friends-out"),
    total: document.getElementById("vc-total"),
    breakdown: document.getElementById("vc-breakdown"),
    monthAvg: document.getElementById("vc-month-avg")
  };

  const numberFormatter = new Intl.NumberFormat("uk-UA");
  const oneDecimalFormatter = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  function formatNumber(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return "—";
    }
    return numberFormatter.format(num);
  }

  function formatOneDecimal(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return "—";
    }
    return oneDecimalFormatter.format(num);
  }

  function setHoursError(message, isError) {
    elements.errorHours.textContent = message || "";
    elements.hours.setAttribute("aria-invalid", String(Boolean(isError)));
    if (isError) {
      elements.hours.classList.add("tw-border-red-500", "tw-ring-2", "tw-ring-red-200");
    } else {
      elements.hours.classList.remove("tw-border-red-500", "tw-ring-2", "tw-ring-red-200");
      elements.hours.classList.add("tw-border-[var(--color-line)]");
    }
  }

  function normalizeInt(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (
      Number.isNaN(parsed) ||
      !Number.isFinite(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < min ||
      parsed > max
    ) {
      return fallback;
    }
    return parsed;
  }

  function normalizeHoursValue(rawValue) {
    const trimmed = String(rawValue || "").trim();

    if (trimmed === "") {
      return {
        valid: false,
        reason: "Поле обов’язкове. Введіть кількість годин на тиждень.",
        value: null
      };
    }

    const numeric = Number(trimmed);
    if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
      return {
        valid: false,
        reason: "Некоректне значення. Введіть число від 1 до 40.",
        value: null
      };
    }

    const rounded = Math.round(numeric);

    if (!Number.isInteger(numeric)) {
      return {
        valid: true,
        reason: `Значення округлено до ${rounded}.`,
        value: rounded
      };
    }

    if (numeric < 1 || numeric > 40) {
      return {
        valid: false,
        reason: "Введіть значення від 1 до 40 годин на тиждень.",
        value: null
      };
    }

    return {
      valid: true,
      reason: "",
      value: numeric
    };
  }

  function updateFriendsOutput() {
    const safeFriends = normalizeInt(elements.friends.value, 0, 0, 5);
    elements.friendsOut.textContent = String(safeFriends);
  }

  function updateBreakdown(base, eventsValue, briefingValue, friendsValue, totalValue) {
    const breakdownItems = Array.from(elements.breakdown.children);

    if (breakdownItems.length < 4) {
      console.warn("Widget calculator: breakdown list is incomplete.");
      return;
    }

    breakdownItems[0].lastElementChild.textContent = `${formatNumber(base)} год`;
    breakdownItems[1].lastElementChild.textContent = `${formatNumber(eventsValue)} год`;
    breakdownItems[2].lastElementChild.textContent = `${formatNumber(briefingValue)} год`;
    breakdownItems[3].lastElementChild.textContent = `${formatNumber(friendsValue)} год`;

    if (
      !Number.isFinite(base) ||
      !Number.isFinite(eventsValue) ||
      !Number.isFinite(briefingValue) ||
      !Number.isFinite(friendsValue) ||
      !Number.isFinite(totalValue)
    ) {
      breakdownItems[0].lastElementChild.textContent = "—";
      breakdownItems[1].lastElementChild.textContent = "—";
      breakdownItems[2].lastElementChild.textContent = "—";
      breakdownItems[3].lastElementChild.textContent = "—";
    }
  }

  function render() {
    const hoursResult = normalizeHoursValue(elements.hours.value);

    if (!hoursResult.valid) {
      setHoursError(hoursResult.reason, true);
      elements.total.textContent = "—";
      elements.monthAvg.textContent = "—";
      updateBreakdown(NaN, NaN, NaN, NaN, NaN);
      return;
    }

    const selectedMonth = normalizeInt(elements.duration.value, 3, 1, 12);
    const validSelectValues = [1, 3, 6, 12];
    const safeMonths = validSelectValues.includes(selectedMonth) ? selectedMonth : 3;

    const friendsCount = normalizeInt(elements.friends.value, 0, 0, 5);
    const hasEvents = Boolean(elements.events.checked);
    const hasBriefing = Boolean(elements.briefing.checked);

    const weeks = Math.round((safeMonths * 52) / 12);
    const base = hoursResult.value * weeks;
    const eventsValue = hasEvents ? 4 * safeMonths : 0;
    const briefingValue = hasBriefing ? 2 : 0;
    const friendsValue = friendsCount * base;
    const total = base + eventsValue + briefingValue + friendsValue;
    const monthAvg = safeMonths > 0 ? total / safeMonths : 0;

    setHoursError("", false);

    if (hoursResult.reason) {
      const message = hoursResult.reason;
      if (message.includes("округлено")) {
        setHoursError(message, false);
      }
    }

    elements.total.textContent = `≈ ${formatNumber(total)} год`;
    elements.monthAvg.textContent = `≈ ${formatOneDecimal(monthAvg)} год/міс.`;

    updateBreakdown(base, eventsValue, briefingValue, friendsValue, total);
  }

  function bindEvents() {
    elements.hours.addEventListener("input", () => {
      render();
    });

    elements.hours.addEventListener("change", () => {
      render();
    });

    elements.duration.addEventListener("change", () => {
      render();
    });

    elements.events.addEventListener("change", () => {
      render();
    });

    elements.briefing.addEventListener("change", () => {
      render();
    });

    elements.friends.addEventListener("input", () => {
      updateFriendsOutput();
      render();
    });

    elements.friends.addEventListener("change", () => {
      updateFriendsOutput();
      render();
    });
  }

  function initialize() {
    updateFriendsOutput();
    render();
    bindEvents();
  }

  initialize();
})();
