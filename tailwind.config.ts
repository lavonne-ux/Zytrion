import type { Config } from "tailwindcss";
// Zytrion brand tokens, per the Platform Build Specification.
// All prior green references are retired; this palette is the only one in use.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "zy-navy": "#0A0F2E",       // primary ground, headings
        "zy-royal": "#0B3DBF",      // primary accent, key actions
        "zy-electric": "#1565FF",   // highlights, active states
        "zy-light-blue": "#4AB3E8", // soft accents, supporting fills
        "zy-silver": "#C7CDD6",     // chrome/steel, dividers
        "zy-chrome": "#C7CDD6",     // same steel/chrome silver as zy-silver; components across the site use this exact class name for body and secondary text, but it was never defined here, so it rendered as nothing until now
        "zy-near-black": "#080C1A", // body text on light ground
      },
      fontFamily: {
        sans: ["Calibri", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
