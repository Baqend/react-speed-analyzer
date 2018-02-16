module.exports = {
  plugins: {
    'postcss-import': {
      path: ['./src']
    },
    'postcss-nested': {},
    'postcss-calc': {},
    'postcss-cssnext': {
      browsers: ['last 2 versions', '> 5%'],
    },
    'postcss-flexbugs-fixes': {},
  },
}
