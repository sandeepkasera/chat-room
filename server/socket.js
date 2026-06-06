const { Server } = require('socket.io');
const formatMessage = require('../utils/formatMessage');

module.exports = function attachSocket(server) {
  const io = new Server(server);

  io.on('connection', (socket) => {
    socket.on('join', ({ username, room }) => {
      // Check current number of clients in the room before joining
      const existingRoom = io.sockets.adapter.rooms.get(room);
      const numClients = existingRoom ? existingRoom.size : 0;

      if (numClients >= 2) {
        // Room full (limit 2 participants)
        socket.emit('roomFull', { room });
        return;
      }

      socket.join(room);
      socket.username = username;
      socket.room = room;

      // Notify the joining socket
      socket.emit('message', formatMessage('System', `Welcome ${username}!`));

      // Notify others in the room
      socket.to(room).emit('message', formatMessage('System', `${username} has joined the chat`));
    });

    socket.on('chatMessage', (msg) => {
      const username = socket.username || 'Anonymous';
      const room = socket.room;
      if (room) io.to(room).emit('message', formatMessage(username, msg));
    });

    socket.on('disconnect', () => {
      const username = socket.username;
      const room = socket.room;
      if (username && room) {
        socket.to(room).emit('message', formatMessage('System', `${username} has left the chat`));
      }
    });
  });

  return io;
};
