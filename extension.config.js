export default {
  commands: {
    dev: {
      polyfill: true,
    },
    start: {
      polyfill: true,
    },
    build: {
      browser: "chrome,edge,firefox",
      polyfill: true,
      zip: true,
    },
  },
};
