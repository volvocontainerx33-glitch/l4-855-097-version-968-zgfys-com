(function () {
  function select(selector, root) {
    return (root || document).querySelector(selector);
  }

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function initMenu() {
    var button = select('[data-menu-toggle]');
    var panel = select('[data-mobile-panel]');
    if (!button || !panel) return;
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initSearchForms() {
    selectAll('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = select('input[name="q"]', form);
        if (!input || !input.value.trim()) {
          event.preventDefault();
          return;
        }
        input.value = input.value.trim();
      });
    });
  }

  function initHero() {
    var hero = select('[data-hero]');
    if (!hero) return;
    var slides = selectAll('[data-hero-slide]', hero);
    var tabs = selectAll('[data-hero-tab]', hero);
    if (!slides.length) return;
    var index = 0;
    var timer = null;

    function activate(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      tabs.forEach(function (tab, i) {
        tab.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        activate(index + 1);
      }, 5200);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        activate(i);
        start();
      });
    });

    hero.addEventListener('mouseenter', function () {
      clearInterval(timer);
    });

    hero.addEventListener('mouseleave', start);
    activate(0);
    start();
  }

  function initCatalogFilter() {
    var input = select('[data-catalog-search]');
    var grid = select('[data-catalog-grid]');
    if (!input || !grid) return;
    var cards = selectAll('[data-search]', grid);
    input.addEventListener('input', function () {
      var keyword = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        card.hidden = keyword && text.indexOf(keyword) === -1;
      });
    });
  }

  function createMovieCard(movie) {
    return [
      '<article class="movie-card">',
      '  <a class="poster-link" href="./' + escapeHtml(movie.file) + '" aria-label="观看' + escapeHtml(movie.title) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="poster-gradient"></span>',
      '    <span class="badge badge-region">' + escapeHtml(movie.region) + '</span>',
      '    <span class="badge badge-type">' + escapeHtml(movie.type) + '</span>',
      '    <span class="poster-play">▶</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <h3><a href="./' + escapeHtml(movie.file) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="movie-meta">',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.genre) + '</span>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function initSearchPage() {
    var target = select('#searchResults');
    if (!target || !window.MOVIE_INDEX) return;
    var params = new URLSearchParams(window.location.search);
    var keyword = (params.get('q') || '').trim();
    var pageInput = select('[data-search-input]');
    if (pageInput) pageInput.value = keyword;
    var data = window.MOVIE_INDEX;
    var result = [];

    if (keyword) {
      var words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
      result = data.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine].join(' ').toLowerCase();
        return words.every(function (word) {
          return text.indexOf(word) !== -1;
        });
      }).slice(0, 120);
    } else {
      result = data.slice(0, 36);
    }

    if (!result.length) {
      target.innerHTML = '<div class="article-card"><h2>没有匹配结果</h2><p>可以尝试更换片名、年份、地区或类型关键词继续搜索。</p></div>';
      return;
    }

    target.innerHTML = result.map(createMovieCard).join('\n');
  }

  function initPlayer() {
    var video = select('[data-player]');
    var layer = select('[data-play-layer]');
    if (!video || !layer) return;
    var url = video.getAttribute('data-url');
    var ready = false;
    var hlsInstance = null;

    function loadPlayer() {
      if (!url) return;
      if (!ready) {
        ready = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);
        } else {
          video.src = url;
        }
        video.setAttribute('controls', 'controls');
      }
      layer.classList.add('is-hidden');
      var playNow = function () {
        video.play().catch(function () {});
      };
      if (video.readyState > 0) {
        playNow();
      } else {
        video.addEventListener('loadedmetadata', playNow, { once: true });
      }
    }

    layer.addEventListener('click', loadPlayer);
    video.addEventListener('click', function () {
      if (!ready) {
        loadPlayer();
      } else if (video.paused) {
        video.play().catch(function () {});
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) hlsInstance.destroy();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSearchForms();
    initHero();
    initCatalogFilter();
    initSearchPage();
    initPlayer();
  });
})();
