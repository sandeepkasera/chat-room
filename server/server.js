const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

function formatMessage(username, text) {
  return { username, text, time: new Date().toLocaleTimeString() };
}

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/chat', (req, res) => {
  const { username, room } = req.query;
  if (!username || !room) return res.redirect('/');
  res.render('chat', { username, room });
});

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
