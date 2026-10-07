require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const isProd = process.env.NODE_ENV === 'production';
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Fly.io sits behind a proxy
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // public site views

// ── Livereload (dev only, incl. .pug files) ─────────────────────────
if (!isProd) {
  const livereload = require('livereload');
  const connectLivereload = require('connect-livereload');

  const lrServer = livereload.createServer({
    extraExts: ['pug'], // livereload ignores .pug by default
    delay: 100
  });

  lrServer.watch([
    path.join(__dirname, 'public'),
    path.join(__dirname, 'views'),
    path.join(__dirname, 'acp', 'views')
  ]);

  app.use(connectLivereload());

  // Refresh the browser after nodemon restarts the server
  lrServer.server.once('connection', () => {
    setTimeout(() => lrServer.refresh('/'), 100);
  });
}

// ── Middleware ──────────────────────────────────────────────────────
if (isProd && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProd }
}));

// ── Routes ──────────────────────────────────────────────────────────
app.use('/acp', require('./acp/router')); // before the site routes

app.get('/', (req, res) => res.render('index', { title: 'Home' }));

app.get('/profile/:username', (req, res) => {
  const username = req.params.username;

  return res.render('profile', {
    title: `${username} Profile`,
    username
  });
});

app.get('/profile', (req, res) => res.status(404).send('Not found'));

app.get('/ucp', (req, res) => res.render('ucp', { title: 'User Panel'}));

// Keep this last
app.use((req, res) => res.status(404).send('Not found'));

app.listen(process.env.PORT || 3000, () => {
  console.log(`http://localhost:${process.env.PORT || 3000}`);
});