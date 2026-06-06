const http = require('http');
const app = require('./app');
const attachSocket = require('./socket');

const server = http.createServer(app);

// Attach socket.io to the server (creates and configures IO)
attachSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
