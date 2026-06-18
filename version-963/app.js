(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMenu() {
        var button = qs('[data-menu-toggle]');
        var menu = qs('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var hero = qs('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = qsa('[data-hero-slide]', hero);
        var dots = qsa('[data-hero-dot]', hero);
        var prev = qs('[data-hero-prev]', hero);
        var next = qs('[data-hero-next]', hero);
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function move(step) {
            show(index + step);
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                move(1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                start();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                move(-1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                move(1);
                start();
            });
        }

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        start();
    }

    function setupFilter() {
        qsa('[data-filter-root]').forEach(function (root) {
            var input = qs('[data-filter-input]', root);
            var pills = qsa('[data-filter-pill]', root);
            var list = qs('[data-filter-list]') || root.nextElementSibling;
            var cards = list ? qsa('.movie-card', list) : [];
            var current = '';

            function textOf(card) {
                return [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags')
                ].join(' ').toLowerCase();
            }

            function apply() {
                var query = input ? input.value.trim().toLowerCase() : '';
                cards.forEach(function (card) {
                    var haystack = textOf(card);
                    var okQuery = !query || haystack.indexOf(query) !== -1;
                    var okPill = !current || haystack.indexOf(current.toLowerCase()) !== -1;
                    card.style.display = okQuery && okPill ? '' : 'none';
                });
            }

            if (input) {
                input.addEventListener('input', apply);
            }

            pills.forEach(function (pill) {
                pill.addEventListener('click', function () {
                    current = pill.getAttribute('data-filter-pill') || '';
                    pills.forEach(function (item) {
                        item.classList.toggle('is-active', item === pill);
                    });
                    apply();
                });
            });
        });
    }

    function setupSearchPage() {
        var results = qs('#search-results');
        if (!results || !window.SITE_MOVIES) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        var title = qs('[data-search-title]');
        var input = qs('[data-search-page-input]');
        if (input) {
            input.value = query;
        }
        var normalized = query.toLowerCase();
        var movies = window.SITE_MOVIES.filter(function (movie) {
            if (!normalized) {
                return true;
            }
            return [
                movie.title,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                movie.category,
                (movie.tags || []).join(' '),
                movie.oneLine
            ].join(' ').toLowerCase().indexOf(normalized) !== -1;
        }).slice(0, 240);
        if (title) {
            title.textContent = query ? '“' + query + '”相关影片' : '精选影片';
        }
        results.innerHTML = movies.map(function (movie) {
            var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
                return '<span>' + escapeHtml(tag) + '</span>';
            }).join('');
            return [
                '<article class="movie-card">',
                '<a class="poster-box" href="' + movie.url + '" aria-label="' + escapeHtml(movie.title) + '">',
                '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
                '<span class="poster-shade"></span>',
                '<span class="poster-play">▶</span>',
                '<span class="poster-badges"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></span>',
                '</a>',
                '<div class="movie-card-body">',
                '<h2><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h2>',
                '<p>' + escapeHtml(movie.oneLine) + '</p>',
                '<div class="movie-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.genre) + '</span></div>',
                '<div class="tag-row">' + tags + '</div>',
                '</div>',
                '</article>'
            ].join('');
        }).join('');
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

    function initPlayer(url) {
        var video = qs('[data-player]');
        var overlay = qs('[data-player-overlay]');
        if (!video || !url) {
            return;
        }
        var prepared = false;
        var hls = null;

        function prepare() {
            if (prepared) {
                return;
            }
            prepared = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 60
                });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
        }

        function play() {
            prepare();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var request = video.play();
            if (request && typeof request.catch === 'function') {
                request.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener('click', play);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
        window.addEventListener('beforeunload', function () {
            if (hls) {
                hls.destroy();
            }
        });
        prepare();
    }

    window.SitePlayer = {
        init: initPlayer
    };

    document.addEventListener('DOMContentLoaded', function () {
        setupMenu();
        setupHero();
        setupFilter();
        setupSearchPage();
    });
})();
