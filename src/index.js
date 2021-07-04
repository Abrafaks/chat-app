const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  // Joining to room

  socket.on("join", ({ username, room } = {}, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // Welcome message for joining user
    socket.emit("message", generateMessage("Welcome!"));

    // Information for other users that new user has joined
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined!`));

    callback();
  });

  // Sending message to all users and filtering it
  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    console.log(message);
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }

    io.to("xd").emit("message", generateMessage(message));
    callback();
  });

  socket.on("disconnect", () => {
    io.emit("message", generateMessage("User has left chat."));
  });
  socket.on("sendLocation", ({ latitude, longitude } = {}, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log("Server is up on port " + port);
});
