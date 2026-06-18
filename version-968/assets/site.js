(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  var forms = document.querySelectorAll('[data-search-form]');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';

      if (!value) {
        event.preventDefault();
        window.location.href = 'search.html';
      }
    });
  });

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = Number(dot.getAttribute('data-hero-dot')) || 0;
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  var filterBar = document.querySelector('[data-filter-bar]');
  var filterGrid = document.querySelector('[data-filter-grid]');

  if (filterBar && filterGrid) {
    var queryInput = filterBar.querySelector('[data-local-query]');
    var yearSelect = filterBar.querySelector('[data-year-filter]');
    var regionSelect = filterBar.querySelector('[data-region-filter]');
    var categorySelect = filterBar.querySelector('[data-category-filter]');
    var emptyState = document.querySelector('[data-empty-state]');
    var cards = Array.prototype.slice.call(filterGrid.querySelectorAll('[data-card]'));

    function normalize(value) {
      return String(value || '').toLowerCase().replace(/\s+/g, '');
    }

    function runFilter() {
      var query = normalize(queryInput ? queryInput.value : '');
      var year = yearSelect ? yearSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var category = categorySelect ? categorySelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize(card.getAttribute('data-search'));
        var cardYear = card.getAttribute('data-year') || '';
        var cardRegion = card.getAttribute('data-region') || '';
        var cardCategory = card.getAttribute('data-category') || '';
        var matched = true;

        if (query && text.indexOf(query) === -1) {
          matched = false;
        }

        if (year && cardYear !== year) {
          matched = false;
        }

        if (region && cardRegion !== region) {
          matched = false;
        }

        if (category && cardCategory !== category) {
          matched = false;
        }

        card.style.display = matched ? '' : 'none';

        if (matched) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.classList.toggle('is-visible', visible === 0);
      }
    }

    if (queryInput && queryInput.hasAttribute('data-query-from-url')) {
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');

      if (q) {
        queryInput.value = q;
      }
    }

    [queryInput, yearSelect, regionSelect, categorySelect].forEach(function (control) {
      if (!control) {
        return;
      }

      control.addEventListener('input', runFilter);
      control.addEventListener('change', runFilter);
    });

    runFilter();
  }
})();
