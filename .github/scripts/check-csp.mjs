// Лаб. 12: CI-перевірка, що SHA-256 інлайн-скрипта в index.html збігається з хешем у CSP (vercel.json).
// Якщо змінити скрипт і забути оновити CSP, браузер на продакшні тихо заблокує його (тема, прелоадер).
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const html = readFileSync("index.html", "utf8");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hashes = inline.map((code) => "'sha256-" + createHash("sha256").update(code, "utf8").digest("base64") + "'");

const cfg = JSON.parse(readFileSync("vercel.json", "utf8"));
const csp = cfg.headers.flatMap((r) => r.headers).find((h) => h.key === "Content-Security-Policy");
if (!csp) { console.error("CSP не знайдено у vercel.json"); process.exit(1); }

const missing = hashes.filter((h) => !csp.value.includes(h));
console.log(`Інлайн-скриптів: ${inline.length}; хеші: ${hashes.join(", ")}`);
if (missing.length) {
  console.error(`::error file=vercel.json::CSP не містить хешів ${missing.join(", ")} — оновіть script-src`);
  process.exit(1);
}
console.log("CSP актуальна ✔");
