// База данных книг
const booksDatabase = {
  'samurai': {
    title: 'Самурай без меча',
    author: 'Китами Масао',
    cover: 'img/Самурай.jpg',
    genre: 'Исторический роман',
    pdfUrl: 'pdf/samuray_bez_mecha-pdf.pdf',
    driveUrl: 'https://drive.google.com/drive/folders/1N9WJhZkZXP0ewtfuZ45e0UKFTJ75-k3d'
  },
  'aitmatov': {
    title: 'И дольше века длится день',
    author: 'Чингиз Айтматов',
    cover: 'img/Чынгыз.jpg',
    genre: 'Художественная литература',
    pdfUrl: 'pdf/and_longer_than_a_century.pdf',
    driveUrl: 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing'
  },
  'tolstoy': {
    title: 'Война и мир',
    author: 'Лев Толстой',
    cover: 'img/лев толстой.jpg',
    genre: 'Художественная литература',
    pdfUrl: 'pdf/war_and_peace.pdf',
    driveUrl: 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing'
  },
  'navoi': {
    title: 'Стихи',
    author: 'Алишер Навои',
    cover: 'img/Алишер.jpg',
    genre: 'Поэзия',
    pdfUrl: 'pdf/poems.pdf',
    driveUrl: 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing'
  }
};

// Состояние приложения
const state = {
  currentPage: 'home',
  theme: localStorage.getItem('theme') || 'light',
  searchQuery: '',
  selectedGenre: 'all',
  books: booksDatabase
};

// Состояние пользователя
const userState = {
  isAuthenticated: false,
  user: null
};

// PDF-ридер
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let canvas = document.getElementById('pdfCanvas');
let ctx = canvas.getContext('2d');

// Функции для навигации
function navigateTo(page) {
  document.querySelectorAll('.content-page').forEach(p => {
    p.classList.remove('active');
  });
  
  const targetPage = document.getElementById(page);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  document.querySelectorAll('.menu-list-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });

  state.currentPage = page;
}

// Загрузка контента для страницы
function loadPageContent(page) {
  switch(page) {
    case 'home':
      loadHomeContent();
      break;
    case 'books':
      loadBooksContent();
      break;
    case 'categories':
      loadCategoriesContent();
      break;
    case 'payment':
      loadPaymentContent();
      break;
  }
}

// Загрузка контента главной страницы
function loadHomeContent() {
  const featuredContent = document.querySelector('.featured-content');
  const categoriesContainer = document.querySelector('.categories-container');
  const bookListContainer = document.querySelector('.book-list-container');

  if (featuredContent) featuredContent.style.display = 'flex';
  if (categoriesContainer) categoriesContainer.style.display = 'block';
  if (bookListContainer) bookListContainer.style.display = 'block';
}

// Загрузка контента страницы книг
function loadBooksContent() {
  const featuredContent = document.querySelector('.featured-content');
  const categoriesContainer = document.querySelector('.categories-container');
  const bookListContainer = document.querySelector('.book-list-container');

  if (featuredContent) featuredContent.style.display = 'none';
  if (categoriesContainer) categoriesContainer.style.display = 'none';
  if (bookListContainer) {
    bookListContainer.style.display = 'block';
    updateBookList();
  }
}

// Загрузка контента страницы категорий
function loadCategoriesContent() {
  const featuredContent = document.querySelector('.featured-content');
  const categoriesContainer = document.querySelector('.categories-container');
  const bookListContainer = document.querySelector('.book-list-container');

  if (featuredContent) featuredContent.style.display = 'none';
  if (categoriesContainer) {
    categoriesContainer.style.display = 'block';
    loadCategories();
  }
  if (bookListContainer) bookListContainer.style.display = 'none';
}

// Загрузка категорий
function loadCategories() {
  const categoriesGrid = document.querySelector('.categories-grid');
  if (!categoriesGrid) return;

  const genres = {
    'all': 'Все книги',
    'Исторический роман': 'Исторические',
    'Поэзия': 'Поэзия',
    'Историческая проза': 'Историческая проза'
  };

  categoriesGrid.innerHTML = '';
  Object.entries(genres).forEach(([id, name]) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.dataset.genre = id;
    item.innerHTML = `
      <i class="fas fa-book"></i>
      <span>${name}</span>
    `;
    item.addEventListener('click', () => filterByGenre(id));
    categoriesGrid.appendChild(item);
  });
}

function loadPaymentContent() {
  // Проверяем статус подписки
  const subscribeButtons = document.querySelectorAll('.subscribe-button');
  subscribeButtons.forEach(button => {
    button.disabled = state.isSubscribed;
    button.textContent = state.isSubscribed ? 'Подписка активна' : 'Оформить подписку';
  });
}

// Функция для открытия PDF
function openPDF(bookId) {
  const book = booksDatabase[bookId];
  if (book && book.pdfUrl) {
    window.open(book.pdfUrl, '_blank');
  }
}

// Создание элемента книги
function createBookElement(id, book) {
  const div = document.createElement('div');
  div.className = 'book-list-item';
  div.innerHTML = `
    <img src="${book.cover}" alt="${book.title}" class="book-list-item-img">
    <span class="book-list-item-title">${book.title}</span>
    <div class="book-actions">
      <button class="read-button" onclick="openPDF('${id}')">Читать</button>
      <button class="download-button" onclick="downloadPDF('${id}')">
        <i class="fab fa-google-drive"></i>
      </button>
    </div>
  `;
  return div;
}

// Функция для открытия книги
function openBook(bookId) {
  const book = booksDatabase[bookId];
  if (!book) return;

  state.currentBook = book;
  const reader = document.getElementById('reader');
  const bookContent = document.getElementById('bookContent');
  
  bookContent.innerHTML = book.content.map((text, index) => {
    if (index % 2 === 0) {
      return `<h2>${text}</h2>`;
    } else {
      return `<p>${text}</p>`;
    }
  }).join('');

  document.getElementById('currentPage').textContent = book.currentPage;
  document.getElementById('totalPages').textContent = Math.ceil(book.content.length / 2);

  reader.classList.add('active');
  document.body.style.overflow = 'hidden';

  addToReadingHistory(bookId);
}

function closeReader() {
  const reader = document.getElementById('reader');
  reader.classList.remove('active');
  document.body.style.overflow = '';
  state.currentBook = null;
}

function changePage(direction) {
  if (!state.currentBook) return;

  const totalPages = Math.ceil(state.currentBook.content.length / 2);
  const newPage = state.currentBook.currentPage + direction;

  if (newPage >= 1 && newPage <= totalPages) {
    state.currentBook.currentPage = newPage;
    document.getElementById('currentPage').textContent = newPage;
    
    // Прокручиваем к текущей странице
    const bookContent = document.getElementById('bookContent');
    const pageHeight = bookContent.clientHeight / totalPages;
    bookContent.scrollTo({
      top: (newPage - 1) * pageHeight,
      behavior: 'smooth'
    });

    // Обновляем прогресс
    const progress = (newPage / totalPages) * 100;
    document.querySelector('.progress').style.width = `${progress}%`;

    // Сохраняем прогресс
    saveReadingProgress(state.currentBook.id, newPage);
  }
}

function toggleBookmark() {
  if (!state.currentBook) return;

  const currentPage = state.currentBook.currentPage;
  const bookmarkIndex = state.currentBook.bookmarks.indexOf(currentPage);

  if (bookmarkIndex === -1) {
    state.currentBook.bookmarks.push(currentPage);
  } else {
    state.currentBook.bookmarks.splice(bookmarkIndex, 1);
  }

  // Обновляем иконку закладки
  const bookmarkButton = document.querySelector('.reader-controls .bookmark-button');
  bookmarkButton.style.color = bookmarkIndex === -1 ? '#ff6b6b' : '#666';

  // Сохраняем закладки
  saveBookmarks(state.currentBook.id, state.currentBook.bookmarks);
}

function changeFontSize(delta) {
  state.fontSize = Math.max(12, Math.min(24, state.fontSize + delta));
  document.getElementById('bookContent').style.fontSize = `${state.fontSize}px`;
  localStorage.setItem('fontSize', state.fontSize);
}

// Функции для работы с книгами
function downloadPDF(bookId) {
  const book = booksDatabase[bookId];
  if (book && book.driveUrl) {
    window.open(book.driveUrl, '_blank');
  }
}

// Функции для работы с историей
function addToReadingHistory(bookId) {
  const book = booksDatabase[bookId];
  if (!book) return;

  const historyItem = {
    id: bookId,
    title: book.title,
    author: book.author,
    timestamp: new Date().toISOString()
  };

  state.readingHistory.unshift(historyItem);
  if (state.readingHistory.length > 10) {
    state.readingHistory.pop();
  }

  saveHistory();
}

function addToDownloadHistory(bookId) {
  const book = booksDatabase[bookId];
  if (!book) return;

  const downloadItem = {
    id: bookId,
    title: book.title,
    author: book.author,
    timestamp: new Date().toISOString()
  };

  const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
  downloadHistory.unshift(downloadItem);
  if (downloadHistory.length > 10) {
    downloadHistory.pop();
  }
  localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
}

function saveHistory() {
  localStorage.setItem('readingHistory', JSON.stringify(state.readingHistory));
}

function saveReadingProgress(bookId, page) {
  const progress = JSON.parse(localStorage.getItem('readingProgress') || '{}');
  progress[bookId] = page;
  localStorage.setItem('readingProgress', JSON.stringify(progress));
}

function saveBookmarks(bookId, bookmarks) {
  const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
  savedBookmarks[bookId] = bookmarks;
  localStorage.setItem('bookmarks', JSON.stringify(savedBookmarks));
}

// Функция для поиска
function searchBooks(query) {
  state.searchQuery = query.toLowerCase();
  const filteredBooks = Object.entries(booksDatabase).filter(([id, book]) => {
    return book.title.toLowerCase().includes(state.searchQuery) ||
           book.author.toLowerCase().includes(state.searchQuery) ||
           book.description.toLowerCase().includes(state.searchQuery);
  });
  
  updateBookList(filteredBooks);
}

// Функция для фильтрации по жанру
function filterByGenre(genre) {
  const bookListWrapper = document.querySelector('.book-list-wrapper');
  if (!bookListWrapper) return;

  // Обновляем активную категорию
  document.querySelectorAll('.category-item').forEach(item => {
    if (item.dataset.genre === genre) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Фильтруем и показываем книги
  bookListWrapper.innerHTML = '';
  Object.entries(booksDatabase).forEach(([id, book]) => {
    if (genre === 'all' || book.genre === genre) {
      const bookElement = document.createElement('div');
      bookElement.className = 'book-list-item';
      bookElement.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" class="book-list-item-img">
        <span class="book-list-item-title">${book.title}</span>
        <div class="book-actions">
          <button class="read-button" onclick="openPDF('${id}')">Читать</button>
          <button class="download-button" onclick="downloadPDF('${id}')">
            <i class="fab fa-google-drive"></i>
          </button>
        </div>
      `;
      bookListWrapper.appendChild(bookElement);
    }
  });
}

// Обновление списка книг
function updateBookList(books = Object.entries(booksDatabase)) {
  const bookListWrapper = document.querySelector('.book-list-wrapper');
  if (!bookListWrapper) return;

  bookListWrapper.innerHTML = '';

  books.forEach(([id, book]) => {
    const bookElement = createBookElement(id, book);
    bookListWrapper.appendChild(bookElement);
  });
}

// Функция для смены темы
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const icon = themeToggle.querySelector('i');
  
  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.add('dark-theme');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    localStorage.setItem('theme', 'dark');
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем сохраненную тему
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  }

  // Добавляем обработчик для смены темы
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Добавляем обработчики для категорий
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      filterByGenre(item.dataset.genre);
    });
  });

  // Показываем все книги при загрузке
  filterByGenre('all');
});

// Функция для отображения страницы PDF
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    const renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  document.getElementById('currentPage').textContent = num;
}

// Функция для перехода на предыдущую страницу
function goPrev() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

// Функция для перехода на следующую страницу
function goNext() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

// Функция для постановки страницы в очередь на отображение
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

// Функция для увеличения масштаба
function zoomIn() {
  scale += 0.25;
  queueRenderPage(pageNum);
}

// Функция для уменьшения масштаба
function zoomOut() {
  if (scale <= 0.25) {
    return;
  }
  scale -= 0.25;
  queueRenderPage(pageNum);
}

// Функция для переключения полноэкранного режима
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Обработчики событий
document.getElementById('prevPage').addEventListener('click', goPrev);
document.getElementById('nextPage').addEventListener('click', goNext);
document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);
document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);
