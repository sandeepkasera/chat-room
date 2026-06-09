module.exports = function registerAll(io, socket, randomQueue, formatMessage) {
  require('./join')(io, socket, randomQueue, formatMessage);
  require('./randomJoin')(io, socket, randomQueue, formatMessage);
  require('./cancelRandom')(io, socket, randomQueue, formatMessage);
  require('./chatMessage')(io, socket, randomQueue, formatMessage);
  require('./endChat')(io, socket, randomQueue, formatMessage);
  require('./disconnect')(io, socket, randomQueue, formatMessage);
};
