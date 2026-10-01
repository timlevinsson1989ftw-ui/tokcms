const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const requireAdmin = require('./requireAdmin');

const router = express.Router();
const viewsDir = path.join(__dirname, 'views');

// Render ACP views from acp/views instead of the site's views/,
// and expose a few locals to every ACP template
router.use((req, res, next) => {
  const render = res.render.bind(res);
  res.render = (view, ...args) => render(path.join(viewsDir, view), ...args);

  res.locals.base = req.baseUrl; // "/acp"
  res.locals.admin = req.session.admin;
  next();
});

// ── Public part of the ACP ──────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect(req.baseUrl);
  res.render('login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // TODO: fetch the admin from Supabase instead of .env
  const ok =
    username === process.env.ADMIN_USER &&
    await bcrypt.compare(password ?? '', process.env.ADMIN_PASS_HASH ?? '');

  if (!ok) {
    return res.status(401).render('login', { title: 'Login', error: 'Wrong username or password' });
  }

  req.session.admin = { username };
  res.redirect(req.baseUrl);
});

// ── Everything below requires an admin session ──────────────────────
router.use(requireAdmin);

router.get('/', (req, res) => {
  res.render('dashboard', { title: 'Dashboard', active: 'dashboard' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect(req.baseUrl + '/login'));
});

module.exports = router;