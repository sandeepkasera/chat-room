module.exports = function(io, socket, randomQueue, formatMessage) {
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
};
