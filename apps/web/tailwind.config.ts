import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#6b7280",
        surface: "#f8fafc",
        border: "#e5e7eb",
        brand: "#2563eb",
      },
    },
  },
  plugins: [],
};

export default config;
