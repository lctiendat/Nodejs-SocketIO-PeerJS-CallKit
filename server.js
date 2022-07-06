const express = require("express");
const app = express();
const http = require("http");
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

io.on("connection", async (socket) => {
  console.log("a user connected");
  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.broadcast.to(room).emit("userJoined", socket.id);
  });

  socket.on("volume-action", (data) => {
    socket.broadcast.to(data.room).emit("volume-action", data);
  });
  socket.on("camera-action", (data) => {
    console.log(data);
    socket.broadcast.to(data.room).emit("camera-action", data);
  });

  socket.on("cancel-call", (room) => {
    socket.broadcast.to(room).emit("cancel-call", room);
  });

  socket.on("disconnect", () => {});
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});
