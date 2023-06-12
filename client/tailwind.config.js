export default {
  purge: ["./src/**/*.svelte", "./src/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        jura: ["Jura", "sans-serif"],
      },
      backgroundColor: {
        "transparent-grey": "rgba(40, 40, 45, 0.2)", // Customize the alpha value to set the transparency level you desire
        "highlight-transparent-grey": "rgba(65, 66, 65, 0.37)", // Customize the alpha value to set the transparency level you desire
      },
    },
  },
  variants: {},
  plugins: [],
};
