function initMoviePlayer(videoId, sourceUrl) {
  var video = document.getElementById(videoId);
  if (!video || !sourceUrl) {
    return;
  }

  var shell = video.closest('.player-shell');
  var overlay = shell ? shell.querySelector('.player-overlay') : null;
  var started = false;
  var hlsInstance = null;

  function bindSource() {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
      return;
    }

    video.src = sourceUrl;
  }

  function playVideo() {
    if (!started) {
      started = true;
      bindSource();
      video.setAttribute('controls', 'controls');
      if (shell) {
        shell.classList.add('is-playing');
      }
    }

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function() {});
    }
  }

  if (overlay) {
    overlay.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function() {
    if (!started) {
      playVideo();
    }
  });

  window.addEventListener('pagehide', function() {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
}

(function() {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMobileMenu() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function() {
      menu.classList.toggle('is-open');
    });
  }

  function initSearchForms() {
    selectAll('[data-search-form]').forEach(function(form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var query = input ? input.value.trim() : '';
        if (query) {
          window.location.href = './search.html?q=' + encodeURIComponent(query);
        }
      });
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }

    var slides = selectAll('[data-slide]', slider);
    var dots = selectAll('[data-slide-dot]', slider);
    var index = 0;

    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    dots.forEach(function(dot, dotIndex) {
      dot.addEventListener('click', function() {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function() {
        showSlide(index + 1);
      }, 5600);
    }
  }

  function initCardFilters() {
    selectAll('[data-card-filter]').forEach(function(input) {
      var scope = input.closest('[data-filter-scope]') || document;
      var cards = selectAll('[data-card]', scope);
      input.addEventListener('input', function() {
        var query = input.value.trim().toLowerCase();
        cards.forEach(function(card) {
          var text = card.getAttribute('data-search') || card.textContent.toLowerCase();
          card.style.display = !query || text.indexOf(query) !== -1 ? '' : 'none';
        });
      });
    });
  }

  function getQueryValue(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function movieCard(movie) {
    var tags = (movie.tags || movie.genre || '')
      .split(/[,，/、|；;\s]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(function(tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      })
      .join('');

    return [
      '<article class="movie-card" data-card>',
      '<a class="poster-link" href="' + movie.url + '" aria-label="' + escapeHtml(movie.title) + '">',
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="poster-overlay"><span class="play-badge">▶</span></span>',
      '<span class="poster-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</span>',
      '<span class="poster-year">' + escapeHtml(movie.year) + '</span>',
      '</a>',
      '<div class="card-body">',
      '<h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p>' + escapeHtml(movie.one_line || '') + '</p>',
      '<div class="tag-row">' + tags + '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var page = document.querySelector('[data-search-page]');
    if (!page || typeof MOVIES === 'undefined') {
      return;
    }

    var input = page.querySelector('[data-search-input]');
    var results = page.querySelector('[data-search-results]');
    var initialQuery = getQueryValue('q');

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function render() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var matches = MOVIES.filter(function(movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.one_line].join(' ').toLowerCase();
        return !query || text.indexOf(query) !== -1;
      }).slice(0, 120);

      if (!results) {
        return;
      }

      if (!matches.length) {
        results.innerHTML = '<div class="no-results">未找到匹配影片</div>';
        return;
      }

      results.innerHTML = matches.map(movieCard).join('');
    }

    if (input) {
      input.addEventListener('input', render);
    }

    render();
  }

  document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initSearchForms();
    initHeroSlider();
    initCardFilters();
    initSearchPage();
  });
})();
