# My Chat Space (SSR + Socket.IO)

Simple server-side rendered chat application using Express and Socket.IO. The server renders the join page and chat page; real-time messages are handled over WebSockets so you only need to deploy the backend to host the whole app.

Quick start

1. Install dependencies:

```bash
npm install express socket.io ejs
```

2. Start the server:

```bash
npm start
```

3. Open a browser at `http://localhost:3000`, open a second browser or an incognito window to simulate the other user, join the same room and chat.

Notes
- The app uses rooms so multiple separate conversations can run independently.
- The UI is server-side rendered with EJS; the client uses the socket.io client for real-time updates.
