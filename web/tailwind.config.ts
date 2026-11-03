import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        galeus: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#0b132b",
          950: "#060919",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        pixel: ["var(--font-geist-pixel-square)", "var(--font-geist-mono)", "monospace"],
        serif: ["var(--font-geist-serif)", "Times New Roman", "serif"],
      },
      boxShadow: {
        flat: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        tactile: "0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)",
        juicy: "0 4px 20px -2px rgba(37, 99, 235, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
