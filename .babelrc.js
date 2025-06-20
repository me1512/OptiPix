module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        chrome: '68',
        firefox: '62',
        safari: '12'
      },
      useBuiltIns: 'usage',
      corejs: 3
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }],
    '@babel/preset-typescript'
  ]
}