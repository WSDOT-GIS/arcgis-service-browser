const { publish } = require("gh-pages");

publish(".", {
  src: [
      "index.{html,css}",
      "dist/*"
  ]
}, err => {
  if (err) {
    console.error(err);
  }
});
