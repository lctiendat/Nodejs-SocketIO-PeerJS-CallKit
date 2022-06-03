const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/room", (req, res) => {
  res.render("room");
});

io.on("connection", socket => {
    console.log("a user connected");
    socket.join(socket.id);
})

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});
