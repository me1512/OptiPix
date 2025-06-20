// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        'chrome >= 68',
        'firefox >= 62',
        'safari >= 12'
      ]
    }
  }
}