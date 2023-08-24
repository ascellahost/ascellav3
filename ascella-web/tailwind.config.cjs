const starlightPlugin = require('@astrojs/starlight-tailwind');
const typography = require('@tailwindcss/typography');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: colors.indigo,
        gray: colors.zinc,
      },
    },
  },
  plugins: [require("daisyui"), starlightPlugin, typography],
  daisyui: {
    logs: false,
    themes: [
      {
        'dark': {
          "color-scheme": "dark",
          primary: "#FF7400",
          secondary: "#1eb854",
          accent: "#AC3E31",
          neutral: "#DBAE59",
          "base-100": "#212121",
          "base-200": "#191919",
          "base-300": "#c2ffd7",
          info: "#0091D5",
          success: "#6BB187",
          warning: "#343232",
          error: "#272626",
          "--rounded-box": "0.4rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": ".125rem",
          "primary-content": "#EEEEEE",
        },
        'light': {
          "color-scheme": "light",
          primary: "#FF7400",
          secondary: "#1eb854",
          accent: "#AC3E31",
          neutral: "#DBAE59",
          "base-100": "#ededed",
          "base-200": "#cfcfcf",
          "base-300": "#c2ffd7",
          info: "#0091D5",
          success: "#6BB187",
          warning: "#343232",
          error: "#272626",
          "--rounded-box": "0.4rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": ".125rem",
          "primary-content": "#1A1919",
        },
      },
    ],
  },
};
