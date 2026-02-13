import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shelley: {
          wood: "#4a3728",
          amber: "#ffbf00",
          charcoal: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
