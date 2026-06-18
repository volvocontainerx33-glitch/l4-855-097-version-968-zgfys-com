(function () {
  "use strict";

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = $(".menu-toggle");
    var panel = $(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "hidden");
      }
      button.setAttribute("aria-expanded", String(open));
    });
  }

  function setupImages() {
    $all(".poster-wrap img, .hero-poster img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.classList.add("is-missing");
      });
    });
  }

  function setupHero() {
    var slides = $all(".hero-slide");
    if (!slides.length) {
      return;
    }
    var dots = $all("[data-hero-target]");
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    var prev = $("[data-hero-prev]");
    var next = $("[data-hero-next]");
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        play();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-target")) || 0);
        play();
      });
    });
    play();
  }

  function setupPlayers() {
    $all("[data-player]").forEach(function (wrap) {
      var video = $("video", wrap);
      var button = $(".player-start", wrap);
      var hlsSource = wrap.getAttribute("data-hls");
      var mp4Source = wrap.getAttribute("data-mp4");
      var hlsInstance = null;

      function attachSource() {
        if (!video || video.getAttribute("data-ready") === "true") {
          return;
        }
        video.setAttribute("data-ready", "true");
        if (window.location.protocol === "file:" && mp4Source) {
          video.src = mp4Source;
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsSource;
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hlsInstance.loadSource(hlsSource);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal && mp4Source) {
              try {
                hlsInstance.destroy();
              } catch (error) {
                hlsInstance = null;
              }
              video.src = mp4Source;
            }
          });
          return;
        }
        if (mp4Source) {
          video.src = mp4Source;
        }
      }

      function start() {
        attachSource();
        wrap.classList.add("is-playing");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            video.setAttribute("controls", "controls");
          });
        }
      }

      if (button) {
        button.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            start();
          }
        });
        video.addEventListener("play", function () {
          wrap.classList.add("is-playing");
        });
        video.addEventListener("pause", function () {
          wrap.classList.remove("is-playing");
        });
      }
    });
  }

  function createCard(movie) {
    var link = document.createElement("a");
    link.className = "movie-card";
    link.href = movie.url;

    var poster = document.createElement("div");
    poster.className = "poster-wrap";

    var fallback = document.createElement("div");
    fallback.className = "poster-fallback";
    var fallbackText = document.createElement("span");
    fallbackText.textContent = movie.title;
    fallback.appendChild(fallbackText);

    var img = document.createElement("img");
    img.src = movie.poster;
    img.alt = movie.title;
    img.loading = "lazy";
    img.addEventListener("error", function () {
      img.classList.add("is-missing");
    });

    var shade = document.createElement("div");
    shade.className = "poster-shade";

    var typeBadge = document.createElement("span");
    typeBadge.className = "badge badge-type";
    typeBadge.textContent = movie.type;

    var yearBadge = document.createElement("span");
    yearBadge.className = "badge badge-year";
    yearBadge.textContent = movie.year;

    var play = document.createElement("span");
    play.className = "play-float";
    play.textContent = "▶";

    poster.appendChild(fallback);
    poster.appendChild(img);
    poster.appendChild(shade);
    poster.appendChild(typeBadge);
    poster.appendChild(yearBadge);
    poster.appendChild(play);

    var body = document.createElement("div");
    body.className = "movie-card-body";

    var title = document.createElement("h3");
    title.textContent = movie.title;

    var line = document.createElement("p");
    line.textContent = movie.oneLine;

    var meta = document.createElement("div");
    meta.className = "movie-meta";
    var region = document.createElement("span");
    region.textContent = movie.region;
    var genre = document.createElement("span");
    genre.textContent = movie.genre;
    meta.appendChild(region);
    meta.appendChild(genre);

    body.appendChild(title);
    body.appendChild(line);
    body.appendChild(meta);

    link.appendChild(poster);
    link.appendChild(body);
    return link;
  }

  function setupSearch() {
    var page = $("[data-search-page]");
    if (!page || !window.MOVIE_INDEX) {
      return;
    }
    var form = $("#searchForm");
    var input = $("#searchInput");
    var region = $("#filterRegion");
    var type = $("#filterType");
    var results = $("#searchResults");
    var empty = $("#searchEmpty");
    var heading = $("#searchHeading");
    var params = new URLSearchParams(window.location.search);
    input.value = params.get("q") || "";

    function normalized(value) {
      return String(value || "").trim().toLowerCase();
    }

    function render() {
      var q = normalized(input.value);
      var regionValue = region.value;
      var typeValue = type.value;
      var matched = window.MOVIE_INDEX.filter(function (movie) {
        var haystack = normalized([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.oneLine,
          (movie.tags || []).join(" ")
        ].join(" "));
        var okQuery = !q || haystack.indexOf(q) !== -1;
        var okRegion = !regionValue || movie.region.indexOf(regionValue) !== -1;
        var okType = !typeValue || movie.type.indexOf(typeValue) !== -1;
        return okQuery && okRegion && okType;
      }).slice(0, 96);

      results.innerHTML = "";
      matched.forEach(function (movie) {
        results.appendChild(createCard(movie));
      });
      empty.hidden = matched.length > 0;
      heading.textContent = q ? "搜索结果" : "推荐影片";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var params = new URLSearchParams();
      if (input.value.trim()) {
        params.set("q", input.value.trim());
      }
      var nextUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", nextUrl);
      render();
    });
    [input, region, type].forEach(function (control) {
      control.addEventListener("input", render);
      control.addEventListener("change", render);
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupImages();
    setupHero();
    setupPlayers();
    setupSearch();
  });
})();
