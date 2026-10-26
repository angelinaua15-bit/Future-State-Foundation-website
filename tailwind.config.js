/* Лаб. 12: Tailwind збирається під час розробки (а не Play CDN у браузері).
   npx tailwindcss@3.4.17 -c tailwind.config.js -i src/tailwind.css -o assets/css/tailwind.css --minify
   CI (GitHub Actions) перезбирає файл і перевіряє, що закомічена версія актуальна. */
module.exports = {
  content: ["./index.html", "./assets/js/**/*.js"],
  prefix: "tw-",
  corePlugins: { preflight: false },
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: "#00469b",
        "brand-dark": "#01226b",
        yellow: "#fec301",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        surface: "var(--surface-strong)",
      },
      fontFamily: { display: "var(--font-display)" },
    },
  },
};
