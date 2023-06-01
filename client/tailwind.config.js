export default {
  purge: ["./src/**/*.svelte", "./src/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        jura: ["Jura", "sans-serif"],
      },
      backgroundColor: {
        "transparent-grey": "rgba(40, 40, 45, 0.2)", // Customize the alpha value to set the transparency level you desire
        "highlight-transparent-grey": "rgba(50, 50, 55, 0.4)", // Customize the alpha value to set the transparency level you desire
      },
    },
  },
  variants: {},
  plugins: [],
};
