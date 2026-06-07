const { Server } = require('socket.io');
const formatMessage = require('../utils/formatMessage');

module.exports = function attachSocket(server) {
  const io = new Server(server);
  // Queue for random matching: store socket ids, usernames, and timeout handles
  const randomQueue = [];

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

    // Random matching: two users are paired into a generated room
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

    socket.on('chatMessage', (msg) => {
      const username = socket.username || 'Anonymous';
      const room = socket.room;
      if (room) io.to(room).emit('message', formatMessage(username, msg));
    });

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
  });

  return io;
};
