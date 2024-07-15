const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const __path = process.cwd();
const PORT = process.env.PORT || 8001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__path, "public")));

app.get("/pair", (req, res) => {
  res.sendFile(path.join(__path, "/public/pair.html"));
});

app.get("/qr", (req, res) => {
  res.sendFile(path.join(__path, "/public/qr.html"));
});

const pair = require("./routes/pair");
app.use("/code", pair);
const scan = require("./routes/qr");
app.use("/server/scan", scan);

app.get("/", (req, res) => {
  res.sendFile(path.join(__path, "/public/index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});

module.exports = app;
