module.exports = {
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "ios": "8",
          "android": "5.1",
        },
        "useBuiltIns": "usage", // or "entry"
        "corejs": 3,
      }
    ]
  ]
};
