// =========================================================
// ЛОГИКА ПУБЛИЧНОГО ПОРТАЛА КОНДИНСКОГО РАЙОННОГО ОТДЕЛЕНИЯ КПРФ
// Поддерживает работу как с Node.js сервером (/api/*), так и автономно на GitHub Pages
// =========================================================

let currentCategory = 'Все';
let currentSearch = '';
let currentSort = 'newest';
let currentArticleId = null;
let searchTimeout = null;

const STATIC_DB_KEY = 'kprf_kondinskoe_db_v2';
const ASSET_PREFIX = document.querySelector('link[href^="public/"]') ? 'public/' : '';
function resolveAsset(p) {
  if (!p || typeof p !== 'string') return ASSET_PREFIX + 'uploads/news-konda-1.png';
  let clean = p.trim();
  if (/^(https?:|data:|blob:)/i.test(clean)) return clean;
  if (clean.startsWith('/')) clean = clean.slice(1);
  if (ASSET_PREFIX && !clean.startsWith(ASSET_PREFIX)) return ASSET_PREFIX + clean;
  return clean;
}


const DEFAULT_SEED_DATA = {
  news: [
    {
      id: 1,
      title: 'Партийный актив Кондинского района обсудил план мероприятий на второе полугодие 2026 года',
      category: 'Партийная жизнь',
      summary: 'В пгт Междуреченский состоялось расширенное заседание бюро Кондинского районного комитета КПРФ. Коммунисты наметили приоритетные задачи по социальной защите жителей округа.',
      content: '<p>В поселке городского типа Междуреченский прошло заседание бюро Кондинского районного комитета КПРФ. В мероприятии приняли участие депутаты, секретари первичных партийных отделений и активисты Ленинского комсомола.</p><p>Первый секретарь райкома выступил с подробным отчетом о проделанной работе за первое полугодие 2026 года. Основное внимание было уделено вопросам социальной защиты граждан, контролю за состоянием жилищно-коммунального хозяйства в поселках района (Междуреченский, Мортка, Куминский, Кондинское) и поддержке ветеранов труда.</p><blockquote>«Наша задача — быть надежной опорой для каждого жителя Кондинского района и отстаивать интересы трудящихся на всех уровнях власти в ХМАО — Югре», — подчеркнули участники заседания.</blockquote>',
      image: 'uploads/news-konda-1.png',
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
      image: 'uploads/news-konda-2.png',
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
      image: 'uploads/news-konda-3.png',
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
      image: 'uploads/news-konda-4.png',
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
      image: 'uploads/news-konda-5.png',
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
  initPreferences();
  setupFilters();
  setupSorting();
  setupSearch();
  setupModal();
  setupShareActions();
  setupCommentForm();
  setupScrollTop();
  loadNews(true);
});

// =========================================================
// ДОСТУПНОСТЬ (СЛАБОВИДЯЩИМ) И ТЁМНАЯ ТЕМА
// =========================================================
function initPreferences() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const themeText = document.getElementById('themeToggleText');
  const a11yBtn = document.getElementById('a11yToggleBtn');

  if (localStorage.getItem('kprf_theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeBtn) themeBtn.classList.add('active');
    if (themeText) themeText.textContent = 'Светлая тема';
  }

  if (localStorage.getItem('kprf_a11y') === '1') {
    document.body.classList.add('a11y-mode');
    if (a11yBtn) {
      a11yBtn.classList.add('active');
      a11yBtn.setAttribute('aria-pressed', 'true');
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('kprf_theme', isDark ? 'dark' : 'light');
      themeBtn.classList.toggle('active', isDark);
      themeBtn.setAttribute('aria-pressed', String(isDark));
      if (themeText) themeText.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    });
  }

  if (a11yBtn) {
    a11yBtn.addEventListener('click', () => {
      const isA11y = document.body.classList.toggle('a11y-mode');
      localStorage.setItem('kprf_a11y', isA11y ? '1' : '0');
      a11yBtn.classList.toggle('active', isA11y);
      a11yBtn.setAttribute('aria-pressed', String(isA11y));
      showToast(isA11y ? 'Включен режим для слабовидящих (крупный шрифт)' : 'Стандартный режим отображения');
    });
  }
}

// =========================================================
// ЗАГРУЗКА И ОТРИСОВКА НОВОСТЕЙ (С АВТОНОМНЫМ РЕЖИМОМ ДЛЯ GITHUB PAGES)
// =========================================================
function getStaticNewsFiltered(category, search, sort) {
  const store = getStaticStore();
  let list = store.news.map(n => ({
    ...n,
    comments_count: store.comments.filter(c => c.news_id === n.id && c.status === 'approved').length
  }));

  if (category && category !== 'Все' && category !== 'Все новости') {
    list = list.filter(n => n.category === category);
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(n => {
      const hay = [n.title, n.summary, (n.content || '').replace(/<[^>]*>/g, ' '), n.category, n.author].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  list.sort((a, b) => {
    if ((b.is_pinned || 0) !== (a.is_pinned || 0)) return (b.is_pinned || 0) - (a.is_pinned || 0);
    if (sort === 'popular' && (b.views || 0) !== (a.views || 0)) return (b.views || 0) - (a.views || 0);
    if (b.date !== a.date) return String(b.date).localeCompare(String(a.date));
    return b.id - a.id;
  });

  return list;
}

async function loadNews(checkDeepLink = false) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '<div style="color: var(--text-muted); padding: 44px; text-align: center; grid-column: 1/-1; font-weight: 600;">Загрузка публикаций...</div>';

  let list = [];
  try {
    const params = new URLSearchParams();
    params.set('category', currentCategory || 'Все');
    params.set('sort', currentSort || 'newest');
    if (currentSearch.trim() !== '') {
      params.set('search', currentSearch.trim());
    }

    const res = await fetch(`api/news?${params.toString()}`);
    if (!res.ok) throw new Error('Static mode fallback');
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Static mode fallback');
    list = result.data || [];
  } catch (err) {
    // Автономный режим для GitHub Pages
    list = getStaticNewsFiltered(currentCategory, currentSearch, currentSort);
  }

  if (currentCategory === 'Все' && !currentSearch.trim()) {
    const heroStat = document.getElementById('heroStatNews');
    if (heroStat) heroStat.textContent = String(list.length);
  }

  renderNews(list);

  if (checkDeepLink) {
    const urlParams = new URLSearchParams(window.location.search);
    const articleParam = urlParams.get('article');
    if (articleParam && !Number.isNaN(parseInt(articleParam, 10))) {
      openArticleModal(parseInt(articleParam, 10));
    }
  }
}

function renderNews(newsList) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  if (!newsList || newsList.length === 0) {
    grid.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 48px 24px; text-align: center; grid-column: 1/-1; color: var(--text-muted);">
        <div style="font-family: var(--font-accent); font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Публикации не найдены</div>
        <div style="margin-bottom: 18px;">По выбранной рубрике или поисковому запросу пока нет материалов.</div>
        <button type="button" class="read-more-btn" onclick="resetFilters()">Показать все новости</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = newsList.map(item => {
    const pinnedHtml = item.is_pinned ? `<div class="pinned-badge">★ Закреплено</div>` : '';
    const categoryBadge = `<div class="news-badge">${escapeHtml(item.category || 'Партийная жизнь')}</div>`;
    const dateFormatted = formatDate(item.date);
    const safeImg = escapeHtml(sanitizeUrl(item.image));
    const commCount = item.comments_count || 0;

    return `
      <article class="news-card" tabindex="0" role="article" aria-label="${escapeHtml(item.title)}" onclick="openArticleModal(${Number(item.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArticleModal(${Number(item.id)});}">
        <div class="news-card-img-wrapper">
          <img src="${safeImg}" alt="${escapeHtml(item.title)}" class="news-card-img" loading="lazy" onerror="this.src=resolveAsset('uploads/news-konda-1.png')">
          <div class="card-kprf-ribbon">☭ КПРФ</div>
          ${categoryBadge}
          ${pinnedHtml}
        </div>

        <div class="news-card-body">
          <div class="news-card-date">
            <time datetime="${escapeHtml(item.date)}">${dateFormatted}</time>
            <span style="color: var(--text-muted); font-weight: 500;">${escapeHtml(item.author || 'КПРФ ХМАО')}</span>
          </div>

          <h3 class="news-card-title">${escapeHtml(item.title)}</h3>
          <p class="news-card-summary">${escapeHtml(item.summary)}</p>

          <div class="news-card-footer">
            <div class="news-meta-icons">
              <div class="news-meta-item" title="Просмотры статьи">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>${Number(item.views || 0)}</span>
              </div>
              <div class="news-meta-item" title="Одобренные комментарии">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>${Number(commCount)}</span>
              </div>
            </div>

            <button type="button" class="read-more-btn" onclick="event.stopPropagation(); openArticleModal(${Number(item.id)});">
              Читать статью →
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'Все';
  currentSearch = '';
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  document.querySelectorAll('.category-tab').forEach(t => {
    const isAll = t.getAttribute('data-category') === 'Все';
    t.classList.toggle('active', isAll);
    t.setAttribute('aria-selected', String(isAll));
  });
  loadNews();
}

// =========================================================
// ФИЛЬТРЫ, СОРТИРОВКА И ЖИВОЙ ПОИСК
// =========================================================
function setupFilters() {
  const tabs = document.querySelectorAll('.category-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentCategory = tab.getAttribute('data-category') || 'Все';
      loadNews();
    });
  });
}

function setupSorting() {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value || 'newest';
    loadNews();
  });
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  if (!input) return;

  input.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    if (clearBtn) {
      clearBtn.style.display = currentSearch.trim() ? 'block' : 'none';
    }
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadNews();
    }, 250);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      currentSearch = '';
      clearBtn.style.display = 'none';
      input.focus();
      loadNews();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
      e.preventDefault();
      input.focus();
    }
  });
}

// =========================================================
// МОДАЛЬНОЕ ОКНО СТАТЬИ И КОММЕНТАРИЕВ
// =========================================================
async function openArticleModal(id) {
  const modal = document.getElementById('articleModal');
  if (!modal) return;

  let article = null;
  try {
    const res = await fetch(`api/news/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Static mode');
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    article = result.data;
  } catch (err) {
    const store = getStaticStore();
    const numId = parseInt(id, 10);
    const idx = store.news.findIndex(n => n.id === numId);
    if (idx !== -1) {
      store.news[idx].views = (store.news[idx].views || 0) + 1;
      saveStaticStore(store);
      article = {
        ...store.news[idx],
        comments: store.comments.filter(c => c.news_id === numId && c.status === 'approved')
      };
    }
  }

  if (!article) {
    showToast('Статья не найдена');
    return;
  }

  currentArticleId = article.id;

  if (window.history && window.history.replaceState) {
    const newUrl = `${window.location.pathname}?article=${article.id}`;
    window.history.replaceState({ articleId: article.id }, '', newUrl);
  }

  document.getElementById('modalTitle').textContent = article.title;

  const catEl = document.getElementById('modalCategory');
  if (catEl) {
    catEl.textContent = article.category || 'Партийная жизнь';
    catEl.style.display = 'inline-block';
  }

  const plainWords = String(article.content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(plainWords / 160));
  document.getElementById('modalDate').textContent =
    `${formatDate(article.date)} · ${article.author || 'КПРФ ХМАО'} · ${article.views || 1} просм. · ~${readMin} мин чтения`;

  const imgEl = document.getElementById('modalImg');
  imgEl.src = sanitizeUrl(article.image);
  imgEl.alt = article.title || 'Иллюстрация новости';
  imgEl.onerror = () => { imgEl.src = resolveAsset('uploads/news-konda-1.png'); };

  document.getElementById('modalContent').innerHTML = sanitizeArticleHtml(article.content);

  updateShareLinks(article);

  document.getElementById('commentNewsId').value = article.id;

  renderComments(article.comments || []);

  const alertBox = document.getElementById('commentAlert');
  if (alertBox) {
    alertBox.className = 'comment-alert';
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function updateShareLinks(article) {
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?article=${encodeURIComponent(article.id)}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title || 'Кондинское районное отделение КПРФ');

  const vkLink = document.getElementById('shareVkLink');
  const okLink = document.getElementById('shareOkLink');
  const tgLink = document.getElementById('shareTgLink');

  if (vkLink) vkLink.href = `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`;
  if (okLink) okLink.href = `https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodedTitle}`;
  if (tgLink) tgLink.href = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
}

function setupShareActions() {
  const copyBtn = document.getElementById('shareCopyBtn');
  const printBtn = document.getElementById('printArticleBtn');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = currentArticleId
        ? `${baseUrl}?article=${currentArticleId}`
        : window.location.href;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const tmp = document.createElement('input');
          tmp.value = shareUrl;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
        }
        showToast('Ссылка на статью скопирована в буфер обмена!');
      } catch (e) {
        showToast('Ссылка: ' + shareUrl);
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function renderComments(comments) {
  const container = document.getElementById('modalCommentsList');
  const countEl = document.getElementById('modalCommentsCount');

  if (countEl) countEl.textContent = String(comments.length);
  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML = `
      <div class="no-comments-box">
        Пока нет опубликованных комментариев. Будьте первым — поделитесь своим мнением ниже!
      </div>
    `;
    return;
  }

  container.innerHTML = comments.map(comm => {
    const authorName = comm.author_name || comm.author || 'Житель района';
    const textContent = comm.content || comm.text || '';
    return `
      <div class="comment-item">
        <div class="comment-author-row">
          <div class="comment-author-name">
            <span>${escapeHtml(authorName)}</span>
          </div>
          <div class="comment-date">${escapeHtml(comm.created_at || 'Недавно')}</div>
        </div>
        <div class="comment-text">${escapeHtml(textContent)}</div>
      </div>
    `;
  }).join('');
}

function setupCommentForm() {
  const form = document.getElementById('commentForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newsId = document.getElementById('commentNewsId').value;
    const author = document.getElementById('commentAuthor').value.trim();
    const text = document.getElementById('commentText').value.trim();
    const websiteHp = document.getElementById('commentWebsiteHp')?.value || '';
    const alertBox = document.getElementById('commentAlert');
    const submitBtn = document.getElementById('commentSubmitBtn');

    if (!newsId || !author || !text) return;
    if (websiteHp) return;

    if (submitBtn) submitBtn.disabled = true;

    try {
      let msg = 'Ваш комментарий отправлен на модерацию. После проверки модератором он появится на сайте!';
      try {
        const res = await fetch(`api/news/${encodeURIComponent(newsId)}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author_name: author,
            content: text,
            website: websiteHp
          })
        });
        if (!res.ok) throw new Error('Static mode');
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        msg = result.message || msg;
      } catch (networkErr) {
        // Автономное сохранение комментария для GitHub Pages
        const store = getStaticStore();
        const nextId = store.comments.reduce((m, c) => Math.max(m, c.id || 0), 0) + 1;
        const formattedDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
        store.comments.push({
          id: nextId,
          news_id: parseInt(newsId, 10),
          author_name: author,
          content: text,
          status: 'pending',
          created_at: formattedDate
        });
        saveStaticStore(store);
      }

      alertBox.textContent = msg;
      alertBox.className = 'comment-alert success';
      alertBox.style.display = 'block';

      form.reset();
      document.getElementById('commentNewsId').value = newsId;
      showToast('Комментарий отправлен на модерацию!');
    } catch (err) {
      alertBox.textContent = 'Не удалось отправить комментарий: ' + err.message;
      alertBox.className = 'comment-alert error';
      alertBox.style.display = 'block';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function setupModal() {
  const modal = document.getElementById('articleModal');
  const closeBtn = document.getElementById('closeModalBtn');
  if (!modal) return;

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentArticleId = null;
    if (window.history && window.history.replaceState && window.location.search.includes('article=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// =========================================================
// КНОПКА «НАВЕРХ» И УВЕДОМЛЕНИЯ (TOAST)
// =========================================================
function setupScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showToast(message) {
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
  }, 3200);
}

// =========================================================
// УТИЛИТЫ БЕЗОПАСНОСТИ И ФОРМАТИРОВАНИЯ
// =========================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return resolveAsset('uploads/news-konda-1.png');
  const trimmed = urlStr.trim();
  if (/^(javascript|vbscript):/i.test(trimmed)) return resolveAsset('uploads/news-konda-1.png');
  return resolveAsset(trimmed);
}

function sanitizeArticleHtml(dirtyHtml) {
  if (!dirtyHtml) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(dirtyHtml), 'text/html');
  const allowedTags = new Set(['P', 'H2', 'H3', 'H4', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'BR', 'A', 'SPAN']);

  function cleanNode(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.has(child.tagName)) {
          if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(child.tagName)) {
            child.remove();
            continue;
          }
          const textNode = document.createTextNode(child.textContent || '');
          child.replaceWith(textNode);
          continue;
        }
        const attrs = Array.from(child.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          if (child.tagName === 'A' && name === 'href') {
            const val = attr.value.trim();
            if (!/^(https?:\/\/|mailto:|\/|#)/i.test(val)) {
              child.removeAttribute('href');
            } else {
              child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener noreferrer');
            }
          } else {
            child.removeAttribute(attr.name);
          }
        }
        cleanNode(child);
      }
    }
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = String(dateStr).slice(0, 10).split('-');
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    if (year && month && day) {
      const monthIndex = parseInt(month, 10) - 1;
      if (months[monthIndex]) {
        return `${parseInt(day, 10)} ${months[monthIndex]} ${year}`;
      }
    }
  } catch (e) {
    return dateStr;
  }
  return dateStr;
}
