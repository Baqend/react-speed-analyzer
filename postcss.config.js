module.exports = (ctx) => ({
  map: ctx.env === 'development' ? ctx.map : false,
  plugins: {
    'postcss-nested': {},
    'postcss-calc': {},
    'postcss-flexbugs-fixes': {},
    'postcss-cssnext': { browsers: ['last 2 versions', '> 5%'], },
    cssnano: ctx.env === 'production' ? {} : false
  }
})
