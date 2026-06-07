const { Server } = require('socket.io');
const formatMessage = require('../utils/formatMessage');

module.exports = function attachSocket(server) {
  const io = new Server(server);

  io.on('connection', (socket) => {
    socket.on('join', ({ username, room }) => {
      // Check current number of clients in the room before joining
      const existingRoom = io.sockets.adapter.rooms.get(room);
      const numClients = existingRoom ? existingRoom.size : 0;

      // capacity: global room supports up to 50 participants, others are limited to 2
      const capacity = room === 'global' ? 50 : 2;

      if (numClients >= capacity) {
        // Room full
        console.log(`[socket] Join rejected: room="${room}" full (capacity=${capacity}); username="${username}" socketId=${socket.id}`);
        socket.emit('roomFull', { room });
        return;
      }

      socket.join(room);
      socket.username = username;
      socket.room = room;

      // Log successful join
      console.log(`[socket] User joined: username="${username}", room="${room}", socketId=${socket.id}`);

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
      console.log(`[socket] Disconnect: username="${username || 'unknown'}", room="${room || 'unknown'}", socketId=${socket.id}`);
      if (username && room) {
        socket.to(room).emit('message', formatMessage('System', `${username} has left the chat`));
      }
    });
  });

  return io;
};
