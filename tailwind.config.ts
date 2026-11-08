import type { Config } from "tailwindcss";

const status = (n: string) => ({
  DEFAULT: `var(--${n})`,
  fg: `var(--${n}-fg)`,
  bg: `var(--${n}-bg)`,
  line: `var(--${n}-line)`,
});

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        card: "var(--card)",
        subtle: "var(--subtle)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          ink: "var(--primary-ink)",
          on: "var(--on-primary)",
        },
        ok: status("ok"),
        warn: status("warn"),
        alert: status("alert"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: { card: "var(--shadow)" },
    },
  },
  plugins: [],
};

export default config;
