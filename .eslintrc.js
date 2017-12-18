module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "react-app",
  ],
  "rules": {
    "semi": [1, "never"],
    "indent": [1, 2, {"SwitchCase": 1}],
    "no-trailing-spaces": ["error", { "skipBlankLines": true }],
    "arrow-body-style": [1, "as-needed"],
    "react/prefer-stateless-function": "off",
    "react/jsx-filename-extension": "off",
    "react/forbid-prop-types": "off",
    "jsx-a11y/href-no-hash": "off",
  },
  "env": {
    "jest": true
  }
}
