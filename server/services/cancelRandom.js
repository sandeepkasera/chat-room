module.exports = function(io, socket, randomQueue, formatMessage) {
  socket.on('cancelRandom', () => {
    // Remove from queue if present and clear timer
    for (let i = 0; i < randomQueue.length; i++) {
      if (randomQueue[i].socketId === socket.id) {
        const entry = randomQueue.splice(i, 1)[0];
        if (entry && entry.timer) clearTimeout(entry.timer);
        console.log(`[socket] Random join cancelled by socketId=${socket.id}`);
        break;
      }
    }
  });
};
