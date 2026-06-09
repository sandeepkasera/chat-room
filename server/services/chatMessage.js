module.exports = function(io, socket, randomQueue, formatMessage) {
  socket.on('chatMessage', (msg) => {
    const username = socket.username || 'Anonymous';
    const room = socket.room;
    if (room) io.to(room).emit('message', formatMessage(username, msg));
  });
};
