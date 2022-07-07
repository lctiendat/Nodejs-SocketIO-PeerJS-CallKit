const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const ss = require("socket.io-stream");
const path = require("path");

app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/room", (req, res) => {
  res.render("room");
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("join-room", data => {
    console.log(data);
    socket.join(data.room);
    socket.broadcast.to(data.room).emit("user-connected", data.id);

    socket.on('disconnect', () => {
      socket.broadcast.to(data.room).emit('user-disconnected', data.id)
    })
  });
  // socket.on("volume-action", (data) => {
  //   socket.broadcast.to(data.room).emit("volume-action", data);
  // });
  // socket.on("camera-action", (data) => {
  //   console.log(data);
  //   socket.broadcast.to(data.room).emit("camera-action", data);
  // });

  // socket.on("cancel-call", (room) => {
  //   socket.broadcast.to(room).emit("cancel-call", room);
  // });

  // socket.on("disconnect", () => {});
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});
