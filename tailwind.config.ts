import type { Config } from "tailwindcss";

const handleConfig: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FDF6E3",
        kraft: "#E8D5A3",
        navy: "#1E2D4A",
        green: "#4A7C59",
        coral: "#D4614E",
        yellow: "#F5C842",
        blue: "#5B8DB8",
        purple: "#8B6BA8",
        cork: "#c8b99a",
      },
      fontFamily: {
        caveat: ["var(--font-caveat)", "cursive"],
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default handleConfig;
