const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./db');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    cb(null, `news-${Date.now()}-${randomHex}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Разрешена загрузка только изображений форматов JPG, PNG, WEBP или GIF'));
    }
    cb(null, true);
  }
});

// Проверка бинарной сигнатуры (magic bytes) файла изображения
function isValidImageFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    if (bytesRead < 4) return false;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true; // PNG
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true; // JPEG
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true; // GIF
    if (bytesRead >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return true;
    return false;
  } catch (e) {
    return false;
  }
}

function sanitizePlainText(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function sanitizeRichHtml(dirtyHtml, maxLength = 100000) {
  if (typeof dirtyHtml !== 'string') return '';
  let html = dirtyHtml.slice(0, maxLength);
  html = html.replace(/<(script|iframe|object|embed|style|applet|meta|link|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<(script|iframe|object|embed|style|applet|meta|link|form|input|button|textarea|select|base)[^>]*\/?>/gi, '');
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  return html.trim();
}

// ==========================================
// ЗАЩИТА ОТ ПЕРЕБОРА ПАРОЛЕЙ И СПАМА (RATE LIMITING)
// ==========================================
const rateBuckets = new Map();

function createRateLimiter({ windowMs, max, message }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }
    record.count += 1;
    rateBuckets.set(key, record);
    if (record.count > max) {
      return res.status(429).json({ success: false, error: message });
    }
    next();
  };
}

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Слишком много попыток входа. Доступ временно ограничен на 15 минут.'
});

const commentLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 8,
  message: 'Слишком частая отправка комментариев. Пожалуйста, подождите несколько минут.'
});

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Заголовки безопасности (CSP, защита от кликджекинга и MIME-сниффинга)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  );
  next();
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/fonts', express.static(path.join(__dirname, 'fonts'), { maxAge: '30d', immutable: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));
app.use('/css', express.static(path.join(__dirname, 'css'), { maxAge: '1d' }));
app.use('/js', express.static(path.join(__dirname, 'js'), { maxAge: '1d' }));
// Отдаем только публичные HTML-страницы (служебные файлы server.js, db.js, kprf.db закрыты)
app.get(['/', '/index', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==========================================
// КРИПТОГРАФИЧЕСКАЯ ПРОВЕРКА ПАРОЛЯ (PBKDF2-SHA256)
// Пароль НЕ хранится в открытом виде!
// ==========================================
const PBKDF2_SALT = process.env.ADMIN_SALT || 'kprf_kondinskoe_salt_2026_x9f2';
const DEFAULT_ADMIN_HASHES = [
  'edbe9ccbd1fda68afddb32a8a0dcaba18f905662fac87fcdffd6ea4dfd76cfc5',
  '3583df2cee7662bdb254915cd5a3b595138b6578df3f40b5fe49ae15feef4f54'
];
const ENV_ADMIN_HASHES = (process.env.ADMIN_HASHES || process.env.ADMIN_HASH || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);
const ACTIVE_AUTH_HASHES = ENV_ADMIN_HASHES.length ? ENV_ADMIN_HASHES : DEFAULT_ADMIN_HASHES;
const activeSessions = new Map(); // token -> expiresAt (8 часов)

function verifyAdminCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  const derived = crypto.pbkdf2Sync(`${username}:${password}`, PBKDF2_SALT, 100000, 32, 'sha256');
  return ACTIVE_AUTH_HASHES.some((hashHex) => {
    const expected = Buffer.from(hashHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  });
}

function isRequestAdmin(req) {
  const authHeader = String(req.headers['authorization'] || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const expiresAt = activeSessions.get(token);
  if (expiresAt && Date.now() < expiresAt) return true;
  if (expiresAt) activeSessions.delete(token);
  return false;
}

function requireAdmin(req, res, next) {
  if (isRequestAdmin(req)) return next();
  res.status(401).json({ success: false, error: 'Требуется авторизация администратора' });
}

app.post('/api/login', loginLimiter, (req, res) => {
  const username = sanitizePlainText(req.body?.username, 100);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (verifyAdminCredentials(username, password)) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, Date.now() + 8 * 60 * 60 * 1000);
    return res.json({ success: true, token: sessionToken });
  }
  res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
});

app.get('/api/news', (req, res) => {
  try {
    const { category, search, sort } = req.query;
    res.json({ success: true, data: db.getNews(category, search, sort) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки новостей' });
  }
});

app.get('/api/news/:id', (req, res) => {
  try {
    const includeAll = req.query.all === 'true' && isRequestAdmin(req);
    const increment = req.query.increment !== 'false';
    const item = db.getNewsById(req.params.id, includeAll, increment);
    if (!item) return res.status(404).json({ success: false, error: 'Статья не найдена' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки статьи' });
  }
});

app.post('/api/news', requireAdmin, (req, res) => {
  try {
    const title = sanitizePlainText(req.body?.title, 300);
    const content = sanitizeRichHtml(req.body?.content);
    if (!title || !content) return res.status(400).json({ success: false, error: 'Заголовок и текст обязательны' });
    const id = db.createNews({
      title,
      category: sanitizePlainText(req.body?.category || 'Партийная жизнь', 80),
      summary: sanitizePlainText(req.body?.summary || title, 1000),
      content,
      image: sanitizePlainText(req.body?.image || 'uploads/news-1.jpg', 500),
      date: sanitizePlainText(req.body?.date, 20),
      is_pinned: req.body?.is_pinned ? 1 : 0,
      author: sanitizePlainText(req.body?.author || 'Пресс-служба Кондинского РК КПРФ', 120)
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка сохранения' });
  }
});

app.put('/api/news/:id', requireAdmin, (req, res) => {
  try {
    const title = sanitizePlainText(req.body?.title, 300);
    const content = sanitizeRichHtml(req.body?.content);
    if (!title || !content) return res.status(400).json({ success: false, error: 'Заголовок и текст обязательны' });
    db.updateNews(req.params.id, {
      title,
      category: sanitizePlainText(req.body?.category || 'Партийная жизнь', 80),
      summary: sanitizePlainText(req.body?.summary || title, 1000),
      content,
      image: sanitizePlainText(req.body?.image || 'uploads/news-1.jpg', 500),
      date: sanitizePlainText(req.body?.date, 20),
      is_pinned: req.body?.is_pinned ? 1 : 0,
      author: sanitizePlainText(req.body?.author || 'Пресс-служба Кондинского РК КПРФ', 120)
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка обновления' });
  }
});

app.delete('/api/news/:id', requireAdmin, (req, res) => {
  try {
    db.deleteNews(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка удаления' });
  }
});

app.get('/api/comments', requireAdmin, (req, res) => {
  try {
    res.json({ success: true, data: db.getComments(req.query.status || 'all') });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка загрузки комментариев' });
  }
});

app.post('/api/news/:id/comments', commentLimiter, (req, res) => {
  try {
    if (req.body?.website) return res.json({ success: true });
    const authorName = sanitizePlainText(req.body?.author_name ?? req.body?.author, 120);
    const content = sanitizePlainText(req.body?.content ?? req.body?.text, 2500);
    if (!authorName || !content) return res.status(400).json({ success: false, error: 'Заполните имя и комментарий' });
    const id = db.createComment(req.params.id, authorName, content);
    res.json({ success: true, id, message: 'Ваш комментарий отправлен на модерацию. После проверки модератором он появится на сайте!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка отправки комментария' });
  }
});

app.put('/api/comments/:id/status', requireAdmin, (req, res) => {
  try {
    const status = req.body?.status;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Недопустимый статус' });
    }
    db.updateCommentStatus(req.params.id, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка модерации' });
  }
});

app.delete('/api/comments/:id', requireAdmin, (req, res) => {
  try {
    db.deleteComment(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка удаления' });
  }
});

app.get('/api/stats', requireAdmin, (req, res) => {
  try {
    res.json({ success: true, data: db.getStats() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Ошибка статистики' });
  }
});

app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'Файл не выбран' });
    if (!isValidImageFile(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ success: false, error: 'Файл не является корректным изображением' });
    }
    res.json({ success: true, url: `uploads/${req.file.filename}` });
  });
});

app.listen(PORT, () => {
  console.log(`Сайт запущен: http://localhost:${PORT}/index.html`);
});
