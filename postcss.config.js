export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        'last 2 versions',
        'Chrome >= 54',
        'Safari >= 3',
        'Edge >= 79',
        'Firefox >= 60',
        'iOS >= 10',
        'Android >= 54',
      ],
      grid: 'autoplace',
    },
  },
};
