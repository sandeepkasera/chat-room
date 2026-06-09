module.exports = function(io, socket, randomQueue, formatMessage) {
  socket.on('randomJoin', ({ username }) => {
    // If someone is waiting, pair them
    if (randomQueue.length > 0) {
      const peer = randomQueue.shift();
      // clear peer timeout if present
      if (peer.timer) clearTimeout(peer.timer);
      const peerSocket = io.sockets.sockets.get(peer.socketId);
      if (!peerSocket) {
        // peer disconnected; notify current client no active
        socket.emit('noActive');
        return;
      }

      const roomId = `rand-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Notify both clients to navigate to the generated room
      socket.emit('matched', { room: roomId });
      peerSocket.emit('matched', { room: roomId });

      console.log(`[socket] Random match created: room="${roomId}" between "${username}" and "${peer.username}"`);
    } else {
      // No one waiting — add to queue and notify client
      // create a timeout to remove the queued client after 60s
      const timer = setTimeout(() => {
        // find and remove from queue if still present
        for (let i = 0; i < randomQueue.length; i++) {
          if (randomQueue[i].socketId === socket.id) {
            randomQueue.splice(i, 1);
            try {
              const s = io.sockets.sockets.get(socket.id);
              if (s) s.emit('noActive');
            } catch (e) {}
            console.log(`[socket] Random queue timeout: removed socketId=${socket.id}`);
            break;
          }
        }
      }, 60 * 1000);

      randomQueue.push({ socketId: socket.id, username, ts: Date.now(), timer });
      socket.emit('waiting');
      console.log(`[socket] Added to random queue: username="${username}", socketId=${socket.id}`);
    }
  });
};
