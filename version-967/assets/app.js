(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function bindNavigation() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (button && panel) {
      button.addEventListener("click", function () {
        panel.classList.toggle("open");
      });
    }

    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        var target = value ? "./search.html?q=" + encodeURIComponent(value) : "./search.html";
        window.location.href = target;
      });
    });
  }

  function bindHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot") || 0));
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();
  }

  function bindCardFilter() {
    var input = document.querySelector("[data-card-filter]");
    var list = document.querySelector("[data-card-list]");
    if (!input || !list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var hay = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-year")
        ].join(" ").toLowerCase();
        card.style.display = !q || hay.indexOf(q) !== -1 ? "" : "none";
      });
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMovie(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "<article class=\"movie-card\" data-title=\"" + escapeHtml(movie.title) + "\" data-region=\"" + escapeHtml(movie.region) + "\" data-genre=\"" + escapeHtml(movie.genre) + "\" data-year=\"" + escapeHtml(movie.year) + "\">" +
      "<a class=\"poster-link\" href=\"" + escapeHtml(movie.url) + "\" aria-label=\"" + escapeHtml(movie.title) + " 在线观看\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"movie-badge\">" + escapeHtml(movie.year) + "</span>" +
      "<span class=\"play-float\">▶</span>" +
      "</a>" +
      "<div class=\"movie-card-body\">" +
      "<div class=\"movie-meta-line\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.oneLine) + "</p>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  function bindSearchPage() {
    var page = document.querySelector("[data-search-page]");
    if (!page || !window.SITE_MOVIES) {
      return;
    }
    var input = document.getElementById("search-page-input");
    var results = document.getElementById("search-results");
    var title = document.getElementById("search-title");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";

    function search(value) {
      var q = value.trim().toLowerCase();
      if (!q) {
        title.textContent = "推荐影片";
        return;
      }
      var matched = window.SITE_MOVIES.filter(function (movie) {
        return [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.oneLine, (movie.tags || []).join(" ")].join(" ").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 160);
      title.textContent = "搜索：" + value.trim();
      results.innerHTML = matched.length ? matched.map(renderMovie).join("") : "<div class=\"empty-state\">暂无匹配内容</div>";
    }

    if (input) {
      input.value = initial;
      search(initial);
      var form = page.querySelector("[data-inline-search]");
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        search(input.value);
        var url = input.value.trim() ? "./search.html?q=" + encodeURIComponent(input.value.trim()) : "./search.html";
        window.history.replaceState(null, "", url);
      });
    }
  }

  window.initMoviePlayer = function (streamUrl) {
    var video = document.querySelector("[data-player-video]");
    var overlay = document.querySelector("[data-player-overlay]");
    if (!video || !streamUrl) {
      return;
    }
    var loaded = false;
    var hls = null;

    function load() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      load();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    bindNavigation();
    bindHero();
    bindCardFilter();
    bindSearchPage();
  });
})();
