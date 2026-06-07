document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const username = document.body.dataset.username;
  const room = document.body.dataset.room;

  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('message-form');
  const input = document.getElementById('message-input');

  function setVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }

  setVh();
  window.addEventListener('resize', setVh);

  socket.emit('join', { username, room });

  socket.on('roomFull', ({ room }) => {
    alert(`Room "${room}" is full. Please choose another room.`);
    window.location.href = '/';
  });
  
    // End chat handling
    const endBtn = document.getElementById('end-chat');
    let initiatedEnd = false;
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to end this chat for everyone?')) return;
        initiatedEnd = true;
        socket.emit('endChat', { room });
        // Immediately redirect the initiator when ending global or random room
        if (room === 'global' || String(room).startsWith('rand-')) {
          window.location.href = '/';
        }
      });
    }

    socket.on('chatEnded', ({ room, by }) => {
      if (initiatedEnd) return; // initiator already redirected
      // notify and redirect other clients in the room
      alert(`Chat has been ended by ${by || 'a participant'}. You will be returned to Home.`);
      window.location.href = '/';
    });

    // When a peer disconnects in random rooms, show message and offer to find new random partner
    socket.on('peerDisconnected', ({ room: r, by }) => {
      if (String(r) !== String(room)) return; // not for this room
      // show a system message
      appendMessage({ username: 'System', text: 'User disconnected', time: new Date().toLocaleTimeString() });
      // show the Find New Random button if present
      const findBtn = document.getElementById('find-random');
      if (findBtn) {
        findBtn.classList.remove('hidden');
        findBtn.addEventListener('click', () => {
          // emit randomJoin and show waiting state
          socket.emit('randomJoin', { username });
          findBtn.textContent = 'Searching...';
          findBtn.disabled = true;
        }, { once: true });
      }
    });

    // If this client gets matched for a new random room, navigate
    socket.on('matched', ({ room: newRoom }) => {
      const params = new URLSearchParams({ username, room: newRoom });
      window.location.href = '/chat?' + params.toString();
    });

  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<div class="meta"><strong>${escapeHtml(msg.username)}</strong> <span>${msg.time}</span></div><div class="text">${escapeHtml(msg.text)}</div>`;
    messagesEl.appendChild(div);
    scrollBottom();
  }

  socket.on('message', (msg) => {
    appendMessage(msg);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    socket.emit('chatMessage', text);
    input.value = '';
    input.focus();
  });

  input.addEventListener('focus', () => {
    setTimeout(scrollBottom, 150);
  });

  window.addEventListener('resize', () => {
    if (document.activeElement === input) {
      setTimeout(scrollBottom, 150);
    }
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
