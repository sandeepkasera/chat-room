module.exports = function(io, socket, randomQueue, formatMessage) {
  socket.on('endChat', ({ room }) => {
    const by = socket.username || 'unknown';
    if (!room) return;
    console.log(`[socket] Chat ended by username="${by}", room="${room}"`);
    // If this is a random-generated room, notify peers differently
    if (String(room).startsWith('rand-')) {
      // Notify other participants that their peer disconnected
      socket.to(room).emit('peerDisconnected', { room, by });
      // Remove only the initiator from the room
      try { socket.leave(room); } catch (e) {}
    } else {
      // notify all clients in the room that chat ended
      io.to(room).emit('chatEnded', { room, by });

      // remove all sockets from the room
      const roomSet = io.sockets.adapter.rooms.get(room);
      if (roomSet) {
        for (const sid of Array.from(roomSet)) {
          const s = io.sockets.sockets.get(sid);
          if (s) s.leave(room);
        }
      }
    }
  });
};
