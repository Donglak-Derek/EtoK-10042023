const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.set("view engine", "ejs");

app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "Assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));

app.use("/", require("./Server/routes/router.js"));

var server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
