module.exports = function(io, socket, randomQueue, formatMessage) {
  socket.on('disconnect', () => {
    const username = socket.username;
    const room = socket.room;
    console.log(`[socket] Disconnect: username="${username || 'unknown'}", room="${room || 'unknown'}", socketId=${socket.id}`);
    if (username && room) {
      socket.to(room).emit('message', formatMessage('System', `${username} has left the chat`));
    }
    // If socket was waiting in random queue, remove it and clear timeout
    for (let i = 0; i < randomQueue.length; i++) {
      if (randomQueue[i].socketId === socket.id) {
        const entry = randomQueue.splice(i, 1)[0];
        if (entry && entry.timer) clearTimeout(entry.timer);
        console.log(`[socket] Removed from random queue on disconnect: socketId=${socket.id}`);
        break;
      }
    }
  });
};
