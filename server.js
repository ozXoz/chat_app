const path = require('path');
const express = require('express');
const http = require('http');
const app = express();
const socketio = require('socket.io');
const formatMessage = require('./public/utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./public/utils/users');
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
const botName = 'Welcome to Our Web Chat ! this is virtual writing in hereee';
// Run when client connect

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    if (!user) {
      return;
    }

    socket.join(user.room);
    socket.emit('message', formatMessage(botName, '~~~~~ Welcome~~~~~~~'))
    socket.broadcast.to(user.room)
      .emit('message', formatMessage(botName, `A ${user.username} user has joined the chat`));
    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  });

  // listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      return;
    }
    io.to(user.room).emit('message', formatMessage(user.username, msg))
  });

  

socket.on('disconnect', () => {
  const user = userLeave(socket.id);

  if (!user) {
    return;
  }

  io.to(user.room).emit('message', formatMessage(botName, `${user.username} has been left the chat !!!`));

  // send users and room info
  const roomUsers = getRoomUsers(user.room);
  if (roomUsers) {
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: roomUsers
    });
  }
});

// ...

});

const PORT = 3333 || process.env.PORT;

server.listen(PORT, () => console.log(`server is running on port ${PORT}`));
