module.exports = {
  style: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
      env: {
        stage: 3,
        features: {
          "nesting-rules": true,
        },
      },
    },
  },
};
