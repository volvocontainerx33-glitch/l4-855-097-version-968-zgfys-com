(function() {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = qs('[data-menu-toggle]');
  var mobileNav = qs('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function() {
      mobileNav.classList.toggle('is-open');
    });
  }

  qsa('[data-hero]').forEach(function(hero) {
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function() {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function() {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function() {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  });

  qsa('[data-filter-scope]').forEach(function(scope) {
    var input = qs('[data-filter-input]', scope);
    var yearSelect = qs('[data-filter-year]', scope);
    var genreSelect = qs('[data-filter-genre]', scope);
    var cards = qsa('[data-movie-card]', scope);
    var empty = qs('[data-empty-hint]', scope);
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function valueOf(element) {
      return element ? element.value.trim().toLowerCase() : '';
    }

    function filterCards() {
      var keyword = valueOf(input);
      var year = valueOf(yearSelect);
      var genre = valueOf(genreSelect);
      var visible = 0;

      cards.forEach(function(card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year')
        ].join(' ').toLowerCase();
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchYear = !year || String(card.getAttribute('data-year')).toLowerCase() === year;
        var matchGenre = !genre || String(card.getAttribute('data-genre')).toLowerCase().indexOf(genre) !== -1;
        var show = matchKeyword && matchYear && matchGenre;
        card.style.display = show ? '' : 'none';
        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, yearSelect, genreSelect].forEach(function(element) {
      if (element) {
        element.addEventListener('input', filterCards);
        element.addEventListener('change', filterCards);
      }
    });

    filterCards();
  });
})();

function setupMoviePlayer(streamUrl) {
  var video = document.getElementById('movie-video');
  var button = document.getElementById('play-overlay');
  var hlsPlayer = null;
  var isReady = false;

  if (!video || !button || !streamUrl) {
    return;
  }

  function attachStream() {
    if (isReady) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsPlayer = new window.Hls({ enableWorker: true });
      hlsPlayer.loadSource(streamUrl);
      hlsPlayer.attachMedia(video);
    } else {
      video.src = streamUrl;
    }

    isReady = true;
  }

  function playVideo() {
    attachStream();
    button.classList.add('is-hidden');
    video.play().catch(function() {
      button.classList.remove('is-hidden');
    });
  }

  button.addEventListener('click', playVideo);
  video.addEventListener('click', function() {
    if (!isReady) {
      playVideo();
    }
  });

  window.addEventListener('beforeunload', function() {
    if (hlsPlayer) {
      hlsPlayer.destroy();
    }
  });
}
