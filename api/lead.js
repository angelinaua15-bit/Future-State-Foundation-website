/**
 * Vercel Function: приймає заявки з сайту і пересилає їх у Telegram-групу.
 *
 * Змінні середовища (Vercel → Settings → Environment Variables):
 *   BOT_TOKEN — токен бота від @BotFather
 *   CHAT_ID   — id групи (від'ємне число, напр. -1001234567890)
 */

const ALLOWED_ORIGINS = [
  "https://angelinaua15-bit.github.io",
  "https://future-state-foundation-website.vercel.app",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

const LIMITS = { name: 100, email: 150, phone: 40, subject: 100, message: 3000, lang: 5 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).send("Forbidden");
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: "bad_json" });
    }
  }
  body = body || {};

  // Honeypot: людина це поле не бачить, тож заповнений — це бот.
  if (body.website) return res.status(200).json({ ok: true });

  const data = { type: body.type === "newsletter" ? "newsletter" : "contact" };
  for (const key of Object.keys(LIMITS)) data[key] = clean(body[key], LIMITS[key]);

  if (!EMAIL_RE.test(data.email)) return res.status(400).json({ ok: false, error: "email" });
  if (data.type === "contact" && (data.name.length < 2 || data.message.length < 10)) {
    return res.status(400).json({ ok: false, error: "fields" });
  }

  const tg = await fetch("https://api.telegram.org/bot" + process.env.BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.CHAT_ID,
      text: buildMessage(data),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!tg.ok) {
    const tgBody = await tg.json().catch(() => ({}));
    console.log("Telegram error", tg.status, tgBody);
    return res.status(502).json({ ok: false, error: "telegram", detail: tgBody.description || null });
  }
  return res.status(200).json({ ok: true });
};
