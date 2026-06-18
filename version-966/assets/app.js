(function () {
  var mobileToggle = document.querySelector(".mobile-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  var carousel = document.querySelector("[data-hero-carousel]");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = Number(dot.getAttribute("data-slide"));
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function applyFilters(panel) {
    var scope = panel.closest("main") || document;
    var queryInput = panel.querySelector("[data-search-input]");
    var yearSelect = panel.querySelector("[data-year-filter]");
    var activeChip = panel.querySelector(".filter-chip.is-active");
    var query = normalizeText(queryInput ? queryInput.value : "");
    var year = yearSelect ? yearSelect.value : "";
    var category = activeChip ? activeChip.getAttribute("data-filter-value") : "";
    var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalizeText([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-year"),
        card.getAttribute("data-tags")
      ].join(" "));
      var cardYear = card.getAttribute("data-year") || "";
      var cardCategory = card.getAttribute("data-category") || "";
      var matched = true;

      if (query && haystack.indexOf(query) === -1) {
        matched = false;
      }

      if (year && cardYear !== year) {
        matched = false;
      }

      if (category && cardCategory !== category) {
        matched = false;
      }

      card.classList.toggle("is-hidden", !matched);
      if (matched) {
        visible += 1;
      }
    });

    var emptyState = scope.querySelector("[data-empty-state]");
    if (emptyState) {
      emptyState.classList.toggle("is-visible", visible === 0);
    }
  }

  var filterPanels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

  filterPanels.forEach(function (panel) {
    var queryInput = panel.querySelector("[data-search-input]");
    var yearSelect = panel.querySelector("[data-year-filter]");
    var chips = Array.prototype.slice.call(panel.querySelectorAll(".filter-chip"));

    if (queryInput) {
      queryInput.addEventListener("input", function () {
        applyFilters(panel);
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener("change", function () {
        applyFilters(panel);
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (item) {
          item.classList.remove("is-active");
        });
        chip.classList.add("is-active");
        applyFilters(panel);
      });
    });

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");
    if (query && queryInput) {
      queryInput.value = query;
      applyFilters(panel);
    }
  });

  var hlsLoader;

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (!hlsLoader) {
      hlsLoader = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
        script.onload = function () {
          resolve(window.Hls);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    return hlsLoader;
  }

  function startPlayback(panel) {
    var video = panel.querySelector("video");
    var button = panel.querySelector(".player-trigger");
    var url = panel.getAttribute("data-video");

    if (!video || !url) {
      return;
    }

    if (button) {
      button.classList.add("is-hidden");
    }

    function play() {
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      if (!video.getAttribute("src")) {
        video.src = url;
      }
      play();
      return;
    }

    loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        if (!video._hlsInstance) {
          var hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          video._hlsInstance = hls;
          video.addEventListener("canplay", play, { once: true });
        } else {
          play();
        }
      } else {
        video.src = url;
        play();
      }
    }).catch(function () {
      video.src = url;
      play();
    });
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-player]")).forEach(function (panel) {
    var button = panel.querySelector(".player-trigger");
    var video = panel.querySelector("video");

    if (button) {
      button.addEventListener("click", function () {
        startPlayback(panel);
      });
    }

    if (video) {
      video.addEventListener("click", function () {
        if (!video.currentSrc) {
          startPlayback(panel);
        }
      });
    }
  });
})();
