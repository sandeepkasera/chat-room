const { Server } = require('socket.io');
const formatMessage = require('../utils/formatMessage');

module.exports = function attachSocket(server) {
  const io = new Server(server);
  // Queue for random matching: store socket ids, usernames, and timeout handles
  const randomQueue = [];

  io.on('connection', (socket) => {
    // Register socket listeners from the services folder
    const register = require('./services');
    register(io, socket, randomQueue, formatMessage);
  });

  return io;
};
