// wiki.js - Wiki route module.

const express = require("express");
const router = express.Router();

// Home page route
router.get("/", function (req, res) {
  res.send("Wiki Home Page");
});

// About page route
router.get("/about", function (req, res) {
  res.send("About this wiki");
});

// Testing URL segment parameters
router.get("/:randomString", function (req, res) {
  res.send(`You typed in <br><h1>${req.params.randomString}</h1>`);
})

module.exports = router;
