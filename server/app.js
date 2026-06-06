const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/chat', (req, res) => {
  const { username, room } = req.query;
  if (!username || !room) return res.redirect('/');
  res.render('chat', { username, room });
});

module.exports = app;
