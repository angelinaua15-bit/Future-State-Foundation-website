/**
 * Cloudflare Worker: приймає заявки з сайту і пересилає їх у Telegram-групу.
 *
 * Секрети (Settings → Variables and Secrets у Cloudflare):
 *   BOT_TOKEN — токен бота від @BotFather
 *   CHAT_ID   — id групи (від'ємне число, напр. -1001234567890)
 */

const ALLOWED_ORIGINS = [
  "https://angelinaua15-bit.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

const LIMITS = { name: 100, email: 150, phone: 40, subject: 100, message: 3000, lang: 5 };

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildMessage(data) {
  if (data.type === "newsletter") {
    return "📰 <b>Нова підписка на розсилку</b>\n\n" + "<b>Email:</b> " + esc(data.email);
  }
  const lines = [
    "📩 <b>Нова заявка з сайту</b>",
    "",
    "<b>Ім'я:</b> " + esc(data.name),
    "<b>Email:</b> " + esc(data.email),
  ];
  if (data.phone) lines.push("<b>Телефон:</b> " + esc(data.phone));
  if (data.subject) lines.push("<b>Тема:</b> " + esc(data.subject));
  lines.push("", "<b>Повідомлення:</b>", esc(data.message));
  if (data.lang) lines.push("", "<i>Мова сайту: " + esc(data.lang.toUpperCase()) + "</i>");
  return lines.join("\n");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method" }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "bad_json" }, 400, origin);
    }

    // Honeypot: людина це поле не бачить, тож заповнений — це бот.
    if (body.website) return json({ ok: true }, 200, origin);

    const data = { type: body.type === "newsletter" ? "newsletter" : "contact" };
    for (const key of Object.keys(LIMITS)) data[key] = clean(body[key], LIMITS[key]);

    if (!EMAIL_RE.test(data.email)) return json({ ok: false, error: "email" }, 400, origin);
    if (data.type === "contact" && (data.name.length < 2 || data.message.length < 10)) {
      return json({ ok: false, error: "fields" }, 400, origin);
    }

    const tg = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: buildMessage(data),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!tg.ok) {
      console.log("Telegram error", tg.status, await tg.text());
      return json({ ok: false, error: "telegram" }, 502, origin);
    }
    return json({ ok: true }, 200, origin);
  },
};
