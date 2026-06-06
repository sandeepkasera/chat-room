module.exports = function formatMessage(username, text) {
  return { username, text, time: new Date().toLocaleTimeString() };
};
