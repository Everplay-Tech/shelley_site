import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['var(--font-pixel)', 'monospace'],
      },
      colors: {
        shelley: {
          wood: "#4a3728",
          amber: "#ffbf00",
          charcoal: "#1a1a1a",
          "dark-wood": "#2d1f15",
          "spirit-blue": "#4a90d9",
          "spirit-green": "#5ae05a",
          "hp-red": "#e05a5a",
          "djinn-purple": "#8b5cf6",
        },
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0,0,0,0.8)',
        'pixel-sm': '2px 2px 0px 0px rgba(0,0,0,0.8)',
        'pixel-amber': '4px 4px 0px 0px rgba(255,191,0,0.3)',
        'pixel-inset': 'inset 2px 2px 0px 0px rgba(0,0,0,0.4)',
      },
      animation: {
        'sprite-idle': 'sprite-idle 1.6s steps(4) infinite',
        'blink-cursor': 'blink-cursor 1s steps(1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'sprite-idle': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '-256px 0' },
        },
        'blink-cursor': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
