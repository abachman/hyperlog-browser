const colors = require("tailwindcss/colors");

module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        current: "currentColor",

        primary: colors.indigo,
        secondary: colors.rose,

        blue: colors.lightBlue,
        gray: colors.coolGray,
        red: colors.red,
        teal: colors.teal,
        violet: colors.violet,
        yellow: colors.amber,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
