/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts,astro}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    logs: false,
    themes: [
      {
        yolo: {
          "color-scheme": "dark",
          primary: "#FF7400",
          secondary: "#1eb854",
          accent: "#AC3E31",
          neutral: "#DBAE59",
          "base-100": "#212121",
          info: "#0091D5",
          success: "#6BB187",
          warning: "#343232",
          error: "#272626",
          "--rounded-box": "0.4rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": ".125rem",
          "primary-content": "#1A1919",
          "base-300": "#c2ffd7",
        },
      },
    ],
  },
};
