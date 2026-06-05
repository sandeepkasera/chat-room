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
    alert(`Room "${room}" is full (2 participants). Please choose another room.`);
    window.location.href = '/';
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
