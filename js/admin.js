// =========================================================
// ЛОГИКА ПАНЕЛИ АДМИНИСТРАТОРА И МОДЕРАТОРА КПРФ
// Работает как с сервером Node.js (/api/*), так и автономно на GitHub Pages
// =========================================================

let currentModFilter = 'pending';
let adminToken = localStorage.getItem('kprf_admin_token') || '';
const STATIC_DB_KEY = 'kprf_kondinskoe_db_v3';

const DEFAULT_PRESETS = [
  { title: 'Партийная жизнь · Кондинский РК', url: 'uploads/news-1.jpg' },
  { title: 'Газета «Правда» · 113 лет', url: 'uploads/news-2.jpg' },
  { title: 'Экология ХМАО · Река Конда', url: 'uploads/news-3.jpg' },
  { title: 'Важная дата · Память поколений', url: 'uploads/news-4.jpg' },
  { title: 'Приемная КПРФ · ЖКХ и тарифы', url: 'uploads/news-5.jpg' }
];

const DEFAULT_SEED_DATA = {
  news: [
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
      author: 'Пресс-служба Кондинского РК КПРФ'
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
      author: 'Редакция «Правда Югры»'
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
      author: 'Экологическая комиссия РК КПРФ'
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
      author: 'Пресс-служба Кондинского РК КПРФ'
    },
    {
      id: 5,
      title: 'Приемная граждан КПРФ в Междуреченском: помощь в решении проблем с ЖКХ и тарифами',
      category: 'Социальная защита',
      summary: 'Депутаты и юристы райкома КПРФ ведут регулярный прием жителей района. За последний месяц решено более 15 обращений граждан по вопросам ЖКХ и благоустройства.',
      content: '<p>Общественная приемная Кондинского районного отделения КПРФ в пгт Междуреченский продолжает работу по оказанию правовой поддержки жителям района.</p><p>Среди ключевых тем обращений граждан — расчеты тарифов ЖКХ, состояние жилищного фонда и ремонт подъездных дорог. По каждому обращению составлены депутатские запросы в профильные ведомства Ханты-Мансийского автономного округа — Югры.</p><p>Наш адрес для обращений: <strong>пгт Междуреченский, ул. Толстого, д. 26</strong>. Прием граждан проводится каждый вторник и четверг с 15:00 до 18:00.</p>',
      image: 'uploads/news-5.jpg',
      date: '2026-07-18',
      views: 165,
      is_pinned: 0,
      author: 'Юридическая служба РК КПРФ'
    }
  ],
  comments: [
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
  ]
};

function getStaticStore() {
  try {
    const raw = localStorage.getItem(STATIC_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.news) && Array.isArray(parsed.comments)) {
        return parsed;
      }
    }
  } catch (e) {}
  const initial = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
  try {
    localStorage.setItem(STATIC_DB_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function saveStaticStore(store) {
  try {
    localStorage.setItem(STATIC_DB_KEY, JSON.stringify(store));
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  setupLogin();

  if (adminToken === 'kprf_admin_session_token_2026') {
    hideLoginOverlay();
    initAdminApp();
  } else {
    showLoginOverlay();
  }
});

function initAdminTheme() {
  const btn = document.getElementById('adminThemeBtn');
  if (localStorage.getItem('kprf_theme') === 'dark') {
    document.body.classList.add('dark-theme');
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('kprf_theme', isDark ? 'dark' : 'light');
    });
  }
}

function showLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'flex';
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'none';
}

function hideLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.style.display = 'none';
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'inline-flex';
}

function setupLogin() {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      adminToken = '';
      localStorage.removeItem('kprf_admin_token');
      showLoginOverlay();
      showAdminToast('Вы вышли из панели управления');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value;
      if (loginError) loginError.style.display = 'none';

      try {
        let token = '';
        const isGithubPages = window.location.hostname.endsWith('github.io');

        if (!isGithubPages) {
          try {
            const res = await fetch('api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            if (res.status === 404 || res.status === 405) throw new Error('STATIC_FALLBACK');
            const result = await res.json();
            if (!res.ok || !result.success) {
              throw new Error(result.error || 'Неверный логин или пароль');
            }
            token = result.token;
          } catch (netErr) {
            if (netErr.message === 'Неверный логин или пароль') throw netErr;
            if (username === 'Admin' && password === 'XDRjkaVNeR1!') {
              token = 'kprf_admin_session_token_2026';
            } else {
              throw new Error('Неверный логин или пароль');
            }
          }
        } else {
          if (username === 'Admin' && password === 'XDRjkaVNeR1!') {
            token = 'kprf_admin_session_token_2026';
          } else {
            throw new Error('Неверный логин или пароль');
          }
        }

        adminToken = token;
        localStorage.setItem('kprf_admin_token', adminToken);
        hideLoginOverlay();
        initAdminApp();
        showAdminToast('Добро пожаловать в панель управления!');
      } catch (err) {
        if (loginError) {
          loginError.textContent = err.message;
          loginError.style.display = 'block';
        }
      }
    });
  }
}

async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (adminToken) {
    options.headers['Authorization'] = `Bearer ${adminToken}`;
  }
  const res = await fetch(url, options);
  if (res.status === 401) {
    adminToken = '';
    localStorage.removeItem('kprf_admin_token');
    showLoginOverlay();
    throw new Error('Требуется авторизация администратора');
  }
  return res;
}

function initAdminApp() {
  setupTabs();
  setupModFilters();
  setupEditorForm();
  setupImageUpload();

  loadStats();
  loadCommentsQueue();
  loadNewsTable();
  loadMaterialsPresets();

  const dateInput = document.getElementById('newsDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');

      if (targetId === 'tabComments') loadCommentsQueue();
      if (targetId === 'tabNews') loadNewsTable();
      if (targetId === 'tabCreate' && !document.getElementById('editNewsId').value) {
        resetEditorForm();
      }
    });
  });
}

async function loadStats() {
  const isGithubPages = window.location.hostname.endsWith('github.io');
  let stats = null;

  if (!isGithubPages) {
    try {
      const res = await authFetch('api/stats');
      if (res.ok) {
        const result = await res.json();
        if (result.success) stats = result.data;
      }
    } catch (e) {}
  }

  if (!stats) {
    const store = getStaticStore();
    stats = {
      totalNews: store.news.length,
      pendingComments: store.comments.filter(c => c.status === 'pending').length,
      approvedComments: store.comments.filter(c => c.status === 'approved').length,
      totalViews: store.news.reduce((s, n) => s + (n.views || 0), 0)
    };
  }

  document.getElementById('statTotalNews').textContent = stats.totalNews || 0;
  document.getElementById('statPendingComments').textContent = stats.pendingComments || 0;
  document.getElementById('statApprovedComments').textContent = stats.approvedComments || 0;
  document.getElementById('statTotalViews').textContent = stats.totalViews || 0;

  const pendingBadge = document.getElementById('statPendingBadge');
  const tabBadge = document.getElementById('tabPendingBadge');
  if (tabBadge) tabBadge.textContent = stats.pendingComments || 0;

  if (stats.pendingComments > 0) {
    if (pendingBadge) pendingBadge.style.display = 'block';
  } else {
    if (pendingBadge) pendingBadge.style.display = 'none';
  }
}

function loadMaterialsPresets() {
  const grid = document.getElementById('materialsGrid');
  if (!grid) return;

  grid.innerHTML = DEFAULT_PRESETS.map(item => `
    <button type="button" class="material-thumb-btn" data-img-url="${escapeHtml(item.url)}" onclick="selectMaterialPreset('${escapeHtml(item.url)}')">
      <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title)}" loading="lazy">
      <span>${escapeHtml(item.title)}</span>
    </button>
  `).join('');
}

function selectMaterialPreset(url) {
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const imgInput = document.getElementById('newsImage');
  const previewImg = document.getElementById('uploadPreviewImg');
  const previewWrap = document.getElementById('uploadPreviewWrap');
  const uploadPrompt = document.getElementById('uploadPrompt');

  if (imgInput) imgInput.value = cleanUrl;
  if (previewImg && previewWrap && uploadPrompt) {
    previewImg.src = cleanUrl;
    previewWrap.style.display = 'block';
    uploadPrompt.style.display = 'none';
  }

  document.querySelectorAll('.material-thumb-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-img-url') === cleanUrl);
  });
}

function setupModFilters() {
  const btns = document.querySelectorAll('.mod-filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentModFilter = btn.getAttribute('data-mod-status');
      loadCommentsQueue();
    });
  });
}

async function loadCommentsQueue() {
  const queue = document.getElementById('commentsQueue');
  if (!queue) return;

  const isGithubPages = window.location.hostname.endsWith('github.io');
  let list = null;

  if (!isGithubPages) {
    try {
      const res = await authFetch(`api/comments?status=${encodeURIComponent(currentModFilter)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) list = result.data;
      }
    } catch (e) {}
  }

  if (!list) {
    const store = getStaticStore();
    list = store.comments
      .filter(c => !currentModFilter || currentModFilter === 'all' || c.status === currentModFilter)
      .map(c => {
        const n = store.news.find(item => item.id === c.news_id);
        return { ...c, news_title: n ? n.title : 'Публикация' };
      })
      .sort((a, b) => b.id - a.id);
  }

  renderCommentsQueue(list);
}

function renderCommentsQueue(comments) {
  const queue = document.getElementById('commentsQueue');
  if (!queue) return;

  if (!comments || comments.length === 0) {
    queue.innerHTML = `
      <div style="background: var(--bg-card); border: 1px dashed var(--border-strong); border-radius: var(--radius-md); padding: 36px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.05rem; color: var(--text-primary); font-weight: 600; margin-bottom: 4px;">В данной категории комментариев нет</div>
        <div>Все поступившие отзывы обработаны или фильтр пуст.</div>
      </div>
    `;
    return;
  }

  queue.innerHTML = comments.map(comm => {
    let statusBadgeText = 'На модерации';
    let statusClass = 'pending';
    if (comm.status === 'approved') {
      statusBadgeText = 'Одобрен';
      statusClass = 'approved';
    } else if (comm.status === 'rejected') {
      statusBadgeText = 'Отклонен';
      statusClass = 'rejected';
    }

    return `
      <div class="mod-comment-card ${statusClass}">
        <div class="mod-card-top">
          <div class="mod-news-title">
            <span>Статья:</span>
            <strong>«${escapeHtml(comm.news_title || 'Публикация')}»</strong>
          </div>
          <div class="status-badge ${statusClass}">${statusBadgeText}</div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div class="mod-author-info">${escapeHtml(comm.author_name || comm.author)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(comm.created_at || 'Недавно')}</div>
        </div>

        <div class="mod-comment-text">${escapeHtml(comm.content || comm.text)}</div>

        <div class="mod-actions">
          ${comm.status !== 'approved' ? `
            <button type="button" class="action-btn approve" onclick="changeCommentStatus(${Number(comm.id)}, 'approved')">
              ✓ Одобрить и опубликовать
            </button>
          ` : ''}

          ${comm.status !== 'rejected' ? `
            <button type="button" class="action-btn reject" onclick="changeCommentStatus(${Number(comm.id)}, 'rejected')">
              Отклонить
            </button>
          ` : ''}

          <button type="button" class="action-btn delete" onclick="deleteComment(${Number(comm.id)})">
            Удалить
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function changeCommentStatus(id, newStatus) {
  const isGithubPages = window.location.hostname.endsWith('github.io');
  if (!isGithubPages) {
    try {
      const res = await authFetch(`api/comments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Static');
    } catch (e) {
      updateStaticCommentStatus(id, newStatus);
    }
  } else {
    updateStaticCommentStatus(id, newStatus);
  }

  showAdminToast(newStatus === 'approved' ? 'Комментарий одобрен и опубликован!' : 'Комментарий отклонен');
  loadStats();
  loadCommentsQueue();
}

function updateStaticCommentStatus(id, newStatus) {
  const store = getStaticStore();
  const idx = store.comments.findIndex(c => c.id === Number(id));
  if (idx !== -1) {
    store.comments[idx].status = newStatus;
    saveStaticStore(store);
  }
}

async function deleteComment(id) {
  if (!confirm('Удалить этот комментарий?')) return;

  const isGithubPages = window.location.hostname.endsWith('github.io');
  if (!isGithubPages) {
    try {
      const res = await authFetch(`api/comments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Static');
    } catch (e) {
      const store = getStaticStore();
      store.comments = store.comments.filter(c => c.id !== Number(id));
      saveStaticStore(store);
    }
  } else {
    const store = getStaticStore();
    store.comments = store.comments.filter(c => c.id !== Number(id));
    saveStaticStore(store);
  }

  showAdminToast('Комментарий удален');
  loadStats();
  loadCommentsQueue();
}

async function loadNewsTable() {
  const tbody = document.getElementById('adminNewsTableBody');
  if (!tbody) return;

  const isGithubPages = window.location.hostname.endsWith('github.io');
  let newsList = null;

  if (!isGithubPages) {
    try {
      const res = await authFetch('api/news');
      if (res.ok) {
        const result = await res.json();
        if (result.success) newsList = result.data;
      }
    } catch (e) {}
  }

  if (!newsList) {
    const store = getStaticStore();
    newsList = [...store.news].sort((a, b) => (b.is_pinned || 0) - (a.is_pinned || 0) || String(b.date).localeCompare(String(a.date)));
  }

  if (!newsList || newsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">Нет опубликованных новостей</td></tr>';
    return;
  }

  tbody.innerHTML = newsList.map(item => {
    const pinnedBadge = item.is_pinned
      ? `<span style="color: var(--gold-dark); font-weight: 600;">★ Закреплена</span>`
      : `<span style="color: var(--text-muted);">Обычная</span>`;
    let rawImg = item.image || 'uploads/news-1.jpg';
    if (rawImg.startsWith('/')) rawImg = rawImg.slice(1);

    return `
      <tr>
        <td>
          <img src="${escapeHtml(rawImg)}" alt="thumb" class="admin-thumb" onerror="this.src='uploads/news-1.jpg'">
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 3px;">${escapeHtml(item.title)}</div>
          <div style="font-size: 0.78rem; color: var(--red-primary);">${escapeHtml(item.category || 'Партийная жизнь')} · ${escapeHtml(item.author || 'КПРФ ХМАО')}</div>
        </td>
        <td style="white-space: nowrap;">${escapeHtml(item.date)}</td>
        <td>${Number(item.views || 0)}</td>
        <td>${pinnedBadge}</td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="action-btn default" onclick="startEditNews(${Number(item.id)})">Редактировать</button>
            <a href="index.html?article=${Number(item.id)}" target="_blank" class="action-btn default" style="text-decoration: none;">Открыть</a>
            <button type="button" class="action-btn delete" onclick="deleteNewsItem(${Number(item.id)})">Удалить</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteNewsItem(id) {
  if (!confirm('Удалить эту публикацию?')) return;

  const isGithubPages = window.location.hostname.endsWith('github.io');
  if (!isGithubPages) {
    try {
      const res = await authFetch(`api/news/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Static');
    } catch (e) {
      const store = getStaticStore();
      store.news = store.news.filter(n => n.id !== Number(id));
      store.comments = store.comments.filter(c => c.news_id !== Number(id));
      saveStaticStore(store);
    }
  } else {
    const store = getStaticStore();
    store.news = store.news.filter(n => n.id !== Number(id));
    store.comments = store.comments.filter(c => c.news_id !== Number(id));
    saveStaticStore(store);
  }

  showAdminToast('Публикация удалена');
  loadStats();
  loadNewsTable();
}

function setupImageUpload() {
  const fileInput = document.getElementById('newsImageFile');
  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewImg = document.getElementById('uploadPreviewImg');
    const previewWrap = document.getElementById('uploadPreviewWrap');
    const uploadPrompt = document.getElementById('uploadPrompt');

    const isGithubPages = window.location.hostname.endsWith('github.io');

    if (!isGithubPages) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await authFetch('api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Static');
        const result = await res.json();
        if (result.success && result.url) {
          const cleanUrl = result.url.startsWith('/') ? result.url.slice(1) : result.url;
          document.getElementById('newsImage').value = cleanUrl;
          if (previewImg && previewWrap && uploadPrompt) {
            previewImg.src = cleanUrl;
            previewWrap.style.display = 'block';
            uploadPrompt.style.display = 'none';
          }
          showAdminToast('Изображение загружено');
          return;
        }
      } catch (e) {}
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      document.getElementById('newsImage').value = dataUrl;
      if (previewImg && previewWrap && uploadPrompt) {
        previewImg.src = dataUrl;
        previewWrap.style.display = 'block';
        uploadPrompt.style.display = 'none';
      }
      showAdminToast('Изображение прикреплено');
    };
    reader.readAsDataURL(file);
  });
}

function formatDoc(command, value = null) {
  document.execCommand(command, false, value);
  const editor = document.getElementById('newsContentEditor');
  if (editor) editor.focus();
}

function formatHeading(tag = '<h3>') {
  const editor = document.getElementById('newsContentEditor');
  if (!editor) return;
  document.execCommand('formatBlock', false, tag);
  editor.focus();
}

function formatParagraph() {
  const editor = document.getElementById('newsContentEditor');
  if (!editor) return;
  document.execCommand('formatBlock', false, '<p>');
  editor.focus();
}

function clearEditorFormat() {
  const editor = document.getElementById('newsContentEditor');
  if (!editor) return;
  const plainText = editor.innerText || editor.textContent || '';
  if (!plainText.trim()) {
    editor.innerHTML = '';
    return;
  }
  const lines = plainText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  editor.innerHTML = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
}

async function startEditNews(id) {
  const isGithubPages = window.location.hostname.endsWith('github.io');
  let item = null;

  if (!isGithubPages) {
    try {
      const res = await authFetch(`api/news/${id}?increment=false`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) item = result.data;
      }
    } catch (e) {}
  }

  if (!item) {
    const store = getStaticStore();
    item = store.news.find(n => n.id === Number(id));
  }
  if (!item) return;

  document.getElementById('editNewsId').value = item.id;
  document.getElementById('newsTitle').value = item.title;
  document.getElementById('newsDate').value = item.date;
  document.getElementById('newsSummary').value = item.summary;

  const catSelect = document.getElementById('newsCategory');
  if (catSelect) catSelect.value = item.category || 'Партийная жизнь';

  const authorInput = document.getElementById('newsAuthor');
  if (authorInput) authorInput.value = item.author || 'Пресс-служба Кондинского РК КПРФ';

  selectMaterialPreset(item.image || 'uploads/news-1.jpg');

  const editor = document.getElementById('newsContentEditor');
  if (editor) editor.innerHTML = item.content || '';

  document.getElementById('newsPinned').checked = item.is_pinned === 1;
  document.getElementById('editorTitlePrefix').textContent = 'Редактирование';
  document.getElementById('saveNewsBtnText').textContent = 'Сохранить изменения';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';

  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const createTabBtn = document.querySelector('.admin-tab[data-tab="tabCreate"]');
  const createPane = document.getElementById('tabCreate');
  if (createTabBtn) createTabBtn.classList.add('active');
  if (createPane) createPane.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEditorForm() {
  const form = document.getElementById('newsEditorForm');
  if (form) form.reset();
  document.getElementById('editNewsId').value = '';
  document.getElementById('editorTitlePrefix').textContent = 'Создание';
  document.getElementById('saveNewsBtnText').textContent = 'Опубликовать новость';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('newsDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('newsAuthor').value = 'Пресс-служба Кондинского РК КПРФ';
  document.getElementById('newsImage').value = 'uploads/news-1.jpg';
  document.getElementById('uploadPreviewWrap').style.display = 'none';
  document.getElementById('uploadPrompt').style.display = 'block';
  document.getElementById('newsContentEditor').innerHTML = '';
}

function setupEditorForm() {
  const form = document.getElementById('newsEditorForm');
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (!form) return;

  if (cancelBtn) cancelBtn.addEventListener('click', resetEditorForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editor = document.getElementById('newsContentEditor');
    const contentHtml = editor ? editor.innerHTML.trim() : '';
    if (!contentHtml || contentHtml === '<br>') {
      showAdminToast('Введите полный текст новости');
      return;
    }

    const id = document.getElementById('editNewsId').value;
    const data = {
      title: document.getElementById('newsTitle').value.trim(),
      category: document.getElementById('newsCategory').value || 'Партийная жизнь',
      author: document.getElementById('newsAuthor').value.trim() || 'Пресс-служба Кондинского РК КПРФ',
      date: document.getElementById('newsDate').value,
      image: document.getElementById('newsImage').value || 'uploads/news-1.jpg',
      summary: document.getElementById('newsSummary').value.trim(),
      content: contentHtml,
      is_pinned: document.getElementById('newsPinned').checked ? 1 : 0
    };

    const isGithubPages = window.location.hostname.endsWith('github.io');
    let savedOnServer = false;

    if (!isGithubPages) {
      try {
        const url = id ? `api/news/${id}` : 'api/news';
        const method = id ? 'PUT' : 'POST';
        const res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) savedOnServer = true;
      } catch (e) {}
    }

    if (!savedOnServer) {
      const store = getStaticStore();
      if (id) {
        const idx = store.news.findIndex(n => n.id === Number(id));
        if (idx !== -1) store.news[idx] = { ...store.news[idx], ...data };
      } else {
        const nextId = store.news.reduce((m, n) => Math.max(m, n.id || 0), 0) + 1;
        store.news.push({ id: nextId, views: 0, ...data });
      }
      saveStaticStore(store);
    }

    showAdminToast(id ? 'Публикация обновлена!' : 'Новость опубликована!');
    resetEditorForm();
    loadStats();
    loadNewsTable();

    const newsTabBtn = document.querySelector('.admin-tab[data-tab="tabNews"]');
    if (newsTabBtn) newsTabBtn.click();
  });
}

function showAdminToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
