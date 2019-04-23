module.exports = {
  plugins: [
    require('postcss-import')({
      path: ['./src', '../src'],
      resolve: function resolve(id, basedir, importOptions) {
        if (id.startsWith('~')) {
          return require.resolve(id.substring(1))
        }

        return id
      }
    }),
    require('postcss-nested')(),
    require('postcss-calc')(),
    require('postcss-cssnext')({
      browsers: ['last 2 versions', '> 5%'],
    }),
    require('postcss-flexbugs-fixes')(),
    require('postcss-wrap')({
      selector: '#speed-kit-analyzer',
      skip: ['speed-kit-analyzer']
    }),
  ],
}
