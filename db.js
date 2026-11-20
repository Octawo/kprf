const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'kprf.db');
const jsonFallbackPath = path.join(__dirname, 'kprf-fallback.json');

let db = null;
let useJsonFallback = false;

const INITIAL_NEWS = [
  {
    id: 1,
    title: 'Партийный актив Кондинского района обсудил план мероприятий на второе полугодие 2026 года',
    category: 'Партийная жизнь',
    summary: 'В пгт Междуреченский состоялось расширенное заседание бюро Кондинского районного комитета КПРФ. Коммунисты наметили приоритетные задачи по социальной защите жителей округа.',
    content: '<p>В поселке городского типа Междуреченский прошло заседание бюро Кондинского районного комитета КПРФ. В мероприятии приняли участие депутаты, секретари первичных партийных отделений и активисты Ленинского комсомола.</p><p>Первый секретарь райкома выступил с подробным отчетом о проделанной работе за первое полугодие 2026 года. Основное внимание было уделено вопросам социальной защиты граждан, контролю за состоянием жилищно-коммунального хозяйства в поселках района (Междуреченский, Мортка, Куминский, Кондинское) и поддержке ветеранов труда.</p><blockquote>«Наша задача — быть надежной опорой для каждого жителя Кондинского района и отстаивать интересы трудящихся на всех уровнях власти в ХМАО — Югре», — подчеркнули участники заседания.</blockquote>',
    image: 'uploads/news-1.jpg',
    date: '2026-07-27',
    views: 144,
    is_pinned: 1,
    author: 'Пресс-служба Кондинского РК КПРФ',
    created_at: '2026-07-27 12:00:00'
  },
  {
    id: 2,
    title: '113 лет газете «Правда»: голос народа и правда истории',
    category: 'Газета Правда',
    summary: 'Главное печатное издание КПРФ отмечает знаменательную дату. В Кондинском отделении прошла акция по распространению свежих выпусков «Правды» среди жителей ХМАО — Югры.',
    content: '<p>Газета «Правда», основанная 5 мая 1912 года по инициативе В.И. Ленина, остается важнейшим источником честной и объективной информации о жизни нашей страны и борьбе за права трудящихся.</p><p>В честь памятной даты коммунисты Кондинского районного отделения КПРФ провели распространение спецвыпуска газеты на улицах Междуреченского и в сельских поселениях района. Жители с интересом встречали активистов и задавали вопросы о законодательных инициативах фракции КПРФ в Думе ХМАО — Югры.</p><p>Мы приглашаем всех жителей подписываться на газету «Правда» и вступать в ряды читателей и единомышленников нашей партии!</p>',
    image: 'uploads/news-2.jpg',
    date: '2026-07-25',
    views: 101,
    is_pinned: 0,
    author: 'Редакция «Правда Югры»',
    created_at: '2026-07-25 10:00:00'
  },
  {
    id: 3,
    title: 'Сохранение природы Кондинского района — наш общий долг перед будущими поколениями',
    category: 'Экология ХМАО',
    summary: 'Молодые коммунисты и активисты ЛКСМ РФ выступили с инициативой по общественному контролю за экологическим состоянием водоемов и лесных массивов района.',
    content: '<p>Кондинский район славится своей богатой природой, чистыми реками и бескрайней тайгой. Однако вопросы охраны окружающей среды требуют постоянного внимания общества и власти.</p><p>Активисты Кондинского районного комитета КПРФ и ЛКСМ РФ организовали рейд по проверке прибрежных зон реки Конда и сообщили в администрацию района о выявленных несанкционированных свалках.</p><p>Коммунисты намерены продолжать регулярный экологический мониторинг и привлекать к акциям по уборке территорий неравнодушных жителей района.</p>',
    image: 'uploads/news-3.jpg',
    date: '2026-07-23',
    views: 115,
    is_pinned: 0,
    author: 'Экологическая комиссия РК КПРФ',
    created_at: '2026-07-23 14:30:00'
  },
  {
    id: 4,
    title: 'Важная дата: День памяти и гордости за социалистические достижения Отчизны',
    category: 'История и идеология',
    summary: 'Коммунисты ХМАО провели торжественный митинг и возложение цветов к памятнику борцам за Советскую власть, напомнив о значении социальной справедливости.',
    content: '<p>В исторический день памяти великих достижений Советского Союза коммунисты Кондинского отделения возложили красные гвоздики к памятным мемориалам.</p><p>В выступлениях участников митинга звучали призывы к сплочению общества на основе идеалов социальной справедливости, бесплатного качественного образования и здравоохранения для всех граждан России.</p>',
    image: 'uploads/news-4.jpg',
    date: '2026-07-20',
    views: 87,
    is_pinned: 0,
    author: 'Пресс-служба Кондинского РК КПРФ',
    created_at: '2026-07-20 11:00:00'
  },
  {
    id: 5,
    title: 'Приемная граждан КПРФ в Междуреченском: помощь в решении проблем с ЖКХ и тарифами',
    category: 'Социальная защита',
    summary: 'Актив Кондинского райкома КПРФ ведет регулярный прием жителей района. За последний месяц решено более 15 обращений граждан по вопросам ЖКХ и благоустройства.',
    content: '<p>Общественная приемная Кондинского районного отделения КПРФ в пгт Междуреченский продолжает работу по оказанию правовой поддержки жителям района.</p><p>Среди ключевых тем обращений граждан — расчеты тарифов ЖКХ, состояние жилищного фонда и ремонт подъездных дорог. По каждому обращению подготовлены обращения в профильные ведомства Ханты-Мансийского автономного округа — Югры.</p><p>Наш адрес для обращений: <strong>пгт Междуреченский, ул. Толстого, д. 26</strong>. Прием граждан проводится каждый вторник и четверг с 8:00 до 10:00.</p>',
    image: 'uploads/news-5.jpg',
    date: '2026-07-18',
    views: 165,
    is_pinned: 0,
    author: 'Юридическая служба РК КПРФ',
    created_at: '2026-07-18 15:00:00'
  }
];

const INITIAL_COMMENTS = [
  {
    id: 1,
    news_id: 1,
    author_name: 'Иван Петрович, пгт Междуреченский',
    content: 'Молодцы, товарищи! Очень важно поднимать вопросы благоустройства нашего поселка и помогать ветеранам.',
    status: 'approved',
    created_at: '2026-07-26 14:20'
  },
  {
    id: 2,
    news_id: 1,
    author_name: 'Елена Васнецова',
    content: 'Подскажите, когда состоится следующий прием граждан по вопросам тарифов ЖКХ?',
    status: 'approved',
    created_at: '2026-07-26 18:05'
  },
  {
    id: 3,
    news_id: 1,
    author_name: 'Алексей Н., Куминский',
    content: 'Хотел бы присоединиться к проверке экологического состояния рек Кондинского района. Как связаться с координатором?',
    status: 'pending',
    created_at: '2026-07-27 08:15'
  },
  {
    id: 4,
    news_id: 2,
    author_name: 'Ветеран труда ХМАО',
    content: 'Газета «Правда» всегда писала честно о жизни людей труда. Спасибо за сохранение традиций!',
    status: 'approved',
    created_at: '2026-07-25 11:30'
  },
  {
    id: 5,
    news_id: 3,
    author_name: 'Мария Юрьевна',
    content: 'Обязательно нужно проверить свалки возле Мортки, спасибо райкому за инициативу!',
    status: 'pending',
    created_at: '2026-07-27 09:40'
  },
  {
    id: 6,
    news_id: 5,
    author_name: 'Житель района',
    content: 'В нашем доме №12 по улице Ленина есть проблема с отоплением, куда можно принести заявление?',
    status: 'pending',
    created_at: '2026-07-27 10:10'
  }
];

function normalizeComment(row) {
  if (!row) return null;
  const authorName = row.author_name || row.author || 'Житель района';
  const textContent = row.content || row.text || '';
  return {
    ...row,
    author_name: authorName,
    author: authorName,
    content: textContent,
    text: textContent
  };
}

try {
  const Database = require('better-sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
} catch (err) {
  useJsonFallback = true;
}

if (!useJsonFallback) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Партийная жизнь',
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT NOT NULL,
      date TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      author TEXT DEFAULT 'Пресс-служба Кондинского РК КПРФ',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      news_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_news_pinned_date ON news(is_pinned DESC, date DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
    CREATE INDEX IF NOT EXISTS idx_comments_news_status ON comments(news_id, status);
  `);

  const rowCount = db.prepare('SELECT COUNT(*) AS cnt FROM news').get().cnt;
  if (rowCount === 0) {
    const insertNews = db.prepare(`
      INSERT INTO news (title, category, summary, content, image, date, views, is_pinned, author, created_at)
      VALUES (@title, @category, @summary, @content, @image, @date, @views, @is_pinned, @author, @created_at)
    `);
    const insertComment = db.prepare(`
      INSERT INTO comments (news_id, author_name, content, status, created_at)
      VALUES (@news_id, @author_name, @content, @status, @created_at)
    `);

    const seedTx = db.transaction(() => {
      for (const item of INITIAL_NEWS) insertNews.run(item);
      for (const comm of INITIAL_COMMENTS) insertComment.run(comm);
    });
    seedTx();
  }
} else {
  if (!fs.existsSync(jsonFallbackPath)) {
    fs.writeFileSync(jsonFallbackPath, JSON.stringify({ news: INITIAL_NEWS, comments: INITIAL_COMMENTS }, null, 2), 'utf8');
  }
}

function readJsonStore() {
  try {
    return JSON.parse(fs.readFileSync(jsonFallbackPath, 'utf8'));
  } catch (e) {
    return { news: [...INITIAL_NEWS], comments: [...INITIAL_COMMENTS] };
  }
}

function writeJsonStore(data) {
  fs.writeFileSync(jsonFallbackPath, JSON.stringify(data, null, 2), 'utf8');
}

function matchesSearch(item, searchStr) {
  if (!searchStr || !searchStr.trim()) return true;
  const q = searchStr.trim().toLowerCase();
  const hay = [
    item.title || '',
    item.summary || '',
    (item.content || '').replace(/<[^>]*>/g, ' '),
    item.category || '',
    item.author || ''
  ].join(' ').toLowerCase();
  return hay.includes(q);
}

module.exports = {
  getNews: (category, search, sort = 'newest') => {
    let rows = [];
    if (!useJsonFallback) {
      let sql = `
        SELECT n.*,
          (SELECT COUNT(*) FROM comments c WHERE c.news_id = n.id AND c.status = 'approved') AS comments_count
        FROM news n
        WHERE 1=1
      `;
      const params = [];
      if (category && category !== 'Все новости' && category !== 'Все') {
        sql += ' AND n.category = ?';
        params.push(category);
      }
      if (sort === 'popular') {
        sql += ' ORDER BY n.is_pinned DESC, n.views DESC, n.date DESC, n.id DESC';
      } else {
        sql += ' ORDER BY n.is_pinned DESC, n.date DESC, n.id DESC';
      }
      rows = db.prepare(sql).all(...params);
    } else {
      const store = readJsonStore();
      rows = store.news
        .filter(n => !category || category === 'Все' || category === 'Все новости' || n.category === category)
        .map(n => ({
          ...n,
          comments_count: store.comments.filter(c => c.news_id === n.id && c.status === 'approved').length
        }));
      rows.sort((a, b) => {
        if ((b.is_pinned || 0) !== (a.is_pinned || 0)) return (b.is_pinned || 0) - (a.is_pinned || 0);
        if (sort === 'popular' && (b.views || 0) !== (a.views || 0)) return (b.views || 0) - (a.views || 0);
        if (b.date !== a.date) return String(b.date).localeCompare(String(a.date));
        return b.id - a.id;
      });
    }
    if (search && search.trim() !== '') {
      rows = rows.filter(item => matchesSearch(item, search));
    }
    return rows;
  },

  getNewsById: (id, includeAllComments = false, incrementViews = true) => {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return null;

    if (!useJsonFallback) {
      const item = db.prepare('SELECT * FROM news WHERE id = ?').get(numId);
      if (!item) return null;
      if (incrementViews) {
        db.prepare('UPDATE news SET views = views + 1 WHERE id = ?').run(numId);
        item.views = (item.views || 0) + 1;
      }
      let commSql = 'SELECT * FROM comments WHERE news_id = ?';
      const commParams = [numId];
      if (!includeAllComments) {
        commSql += ' AND status = ?';
        commParams.push('approved');
      }
      commSql += ' ORDER BY id ASC';
      item.comments = db.prepare(commSql).all(...commParams).map(normalizeComment);
      return item;
    } else {
      const store = readJsonStore();
      const idx = store.news.findIndex(n => n.id === numId);
      if (idx === -1) return null;
      if (incrementViews) {
        store.news[idx].views = (store.news[idx].views || 0) + 1;
        writeJsonStore(store);
      }
      const item = { ...store.news[idx] };
      item.comments = store.comments
        .filter(c => c.news_id === numId && (includeAllComments || c.status === 'approved'))
        .map(normalizeComment);
      return item;
    }
  },

  createNews: (data) => {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const record = {
      title: data.title,
      category: data.category || 'Партийная жизнь',
      summary: data.summary || '',
      content: data.content,
      image: data.image || 'uploads/news-1.jpg',
      date: data.date || new Date().toISOString().slice(0, 10),
      is_pinned: data.is_pinned ? 1 : 0,
      author: data.author || 'Пресс-служба Кондинского РК КПРФ',
      created_at: nowStr
    };
    if (!useJsonFallback) {
      const info = db.prepare(`
        INSERT INTO news (title, category, summary, content, image, date, is_pinned, author, created_at)
        VALUES (@title, @category, @summary, @content, @image, @date, @is_pinned, @author, @created_at)
      `).run(record);
      return Number(info.lastInsertRowid);
    } else {
      const store = readJsonStore();
      const nextId = store.news.reduce((max, n) => Math.max(max, n.id || 0), 0) + 1;
      store.news.push({ id: nextId, views: 0, ...record });
      writeJsonStore(store);
      return nextId;
    }
  },

  updateNews: (id, data) => {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return false;
    if (!useJsonFallback) {
      const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(numId);
      if (!existing) return false;
      db.prepare(`
        UPDATE news
        SET title = ?, category = ?, summary = ?, content = ?, image = ?, date = ?, is_pinned = ?, author = ?
        WHERE id = ?
      `).run(
        data.title ?? existing.title,
        data.category || existing.category,
        data.summary ?? existing.summary,
        data.content ?? existing.content,
        data.image || existing.image,
        data.date || existing.date,
        data.is_pinned !== undefined ? (data.is_pinned ? 1 : 0) : existing.is_pinned,
        data.author || existing.author,
        numId
      );
      return true;
    } else {
      const store = readJsonStore();
      const idx = store.news.findIndex(n => n.id === numId);
      if (idx === -1) return false;
      store.news[idx] = { ...store.news[idx], ...data };
      writeJsonStore(store);
      return true;
    }
  },

  deleteNews: (id) => {
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return false;
    if (!useJsonFallback) {
      db.prepare('DELETE FROM comments WHERE news_id = ?').run(numId);
      const info = db.prepare('DELETE FROM news WHERE id = ?').run(numId);
      return info.changes > 0;
    } else {
      const store = readJsonStore();
      store.news = store.news.filter(n => n.id !== numId);
      store.comments = store.comments.filter(c => c.news_id !== numId);
      writeJsonStore(store);
      return true;
    }
  },

  getComments: (statusFilter) => {
    if (!useJsonFallback) {
      let sql = `
        SELECT c.*, n.title AS news_title
        FROM comments c
        LEFT JOIN news n ON c.news_id = n.id
        WHERE 1=1
      `;
      const params = [];
      if (statusFilter && statusFilter !== 'all') {
        sql += ' AND c.status = ?';
        params.push(statusFilter);
      }
      sql += ' ORDER BY c.id DESC';
      return db.prepare(sql).all(...params).map(normalizeComment);
    } else {
      const store = readJsonStore();
      return store.comments
        .filter(c => !statusFilter || statusFilter === 'all' || c.status === statusFilter)
        .map(c => {
          const n = store.news.find(item => item.id === c.news_id);
          return normalizeComment({ ...c, news_title: n ? n.title : 'Публикация' });
        })
        .sort((a, b) => b.id - a.id);
    }
  },

  createComment: (newsId, authorName, content) => {
    const numNewsId = parseInt(newsId, 10);
    const formattedDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (!useJsonFallback) {
      const info = db.prepare(`
        INSERT INTO comments (news_id, author_name, content, status, created_at)
        VALUES (?, ?, ?, 'pending', ?)
      `).run(numNewsId, authorName, content, formattedDate);
      return Number(info.lastInsertRowid);
    } else {
      const store = readJsonStore();
      const nextId = store.comments.reduce((max, c) => Math.max(max, c.id || 0), 0) + 1;
      store.comments.push({
        id: nextId,
        news_id: numNewsId,
        author_name: authorName,
        content,
        status: 'pending',
        created_at: formattedDate
      });
      writeJsonStore(store);
      return nextId;
    }
  },

  updateCommentStatus: (id, status) => {
    const numId = parseInt(id, 10);
    if (!useJsonFallback) {
      const info = db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, numId);
      return info.changes > 0;
    } else {
      const store = readJsonStore();
      const idx = store.comments.findIndex(c => c.id === numId);
      if (idx === -1) return false;
      store.comments[idx].status = status;
      writeJsonStore(store);
      return true;
    }
  },

  deleteComment: (id) => {
    const numId = parseInt(id, 10);
    if (!useJsonFallback) {
      const info = db.prepare('DELETE FROM comments WHERE id = ?').run(numId);
      return info.changes > 0;
    } else {
      const store = readJsonStore();
      store.comments = store.comments.filter(c => c.id !== numId);
      writeJsonStore(store);
      return true;
    }
  },

  getStats: () => {
    if (!useJsonFallback) {
      const totalNews = db.prepare('SELECT COUNT(*) AS cnt FROM news').get().cnt;
      const pendingComments = db.prepare("SELECT COUNT(*) AS cnt FROM comments WHERE status = 'pending'").get().cnt;
      const approvedComments = db.prepare("SELECT COUNT(*) AS cnt FROM comments WHERE status = 'approved'").get().cnt;
      const totalViews = db.prepare('SELECT SUM(views) AS val FROM news').get().val || 0;
      return { totalNews, pendingComments, approvedComments, totalViews };
    } else {
      const store = readJsonStore();
      return {
        totalNews: store.news.length,
        pendingComments: store.comments.filter(c => c.status === 'pending').length,
        approvedComments: store.comments.filter(c => c.status === 'approved').length,
        totalViews: store.news.reduce((sum, n) => sum + (n.views || 0), 0)
      };
    }
  }
};
