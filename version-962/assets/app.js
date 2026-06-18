(function () {
    function all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function one(selector, root) {
        return (root || document).querySelector(selector);
    }

    function textValue(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function uniqueOptions(cards, key) {
        var values = [];
        cards.forEach(function (card) {
            var value = card.dataset[key] || '';
            if (value && values.indexOf(value) === -1) {
                values.push(value);
            }
        });
        return values.sort(function (a, b) {
            return b.localeCompare(a, 'zh-CN');
        });
    }

    function fillSelect(select, values) {
        if (!select) {
            return;
        }
        values.forEach(function (value) {
            var option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function setupMobileMenu() {
        var button = one('[data-menu-toggle]');
        var panel = one('[data-mobile-panel]');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            panel.classList.toggle('open');
        });
    }

    function setupHero() {
        var slider = one('[data-hero-slider]');
        if (!slider) {
            return;
        }
        var slides = all('[data-hero-slide]', slider);
        var dots = all('[data-hero-dot]', slider);
        var prev = one('[data-hero-prev]', slider);
        var next = one('[data-hero-next]', slider);
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }
        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(current + 1);
            }, 5600);
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.dataset.heroDot || 0));
                play();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                play();
            });
        }
        slider.addEventListener('mouseenter', function () {
            clearInterval(timer);
        });
        slider.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function setupFilters() {
        all('[data-filter-scope]').forEach(function (scope) {
            var container = scope.parentElement || document;
            var cards = all('.searchable-card', container);
            if (!cards.length) {
                cards = all('.searchable-card');
            }
            var keyword = one('[data-filter-keyword]', scope);
            var year = one('[data-filter-year]', scope);
            var region = one('[data-filter-region]', scope);
            var type = one('[data-filter-type]', scope);
            var empty = one('[data-empty-result]', scope);
            fillSelect(year, uniqueOptions(cards, 'year'));
            fillSelect(region, uniqueOptions(cards, 'region'));
            fillSelect(type, uniqueOptions(cards, 'type'));
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query && keyword) {
                keyword.value = query;
            }
            function apply() {
                var q = textValue(keyword && keyword.value);
                var selectedYear = year ? year.value : '';
                var selectedRegion = region ? region.value : '';
                var selectedType = type ? type.value : '';
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = textValue([
                        card.dataset.title,
                        card.dataset.year,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.genre
                    ].join(' '));
                    var matched = true;
                    if (q && haystack.indexOf(q) === -1) {
                        matched = false;
                    }
                    if (selectedYear && card.dataset.year !== selectedYear) {
                        matched = false;
                    }
                    if (selectedRegion && card.dataset.region !== selectedRegion) {
                        matched = false;
                    }
                    if (selectedType && card.dataset.type !== selectedType) {
                        matched = false;
                    }
                    card.style.display = matched ? '' : 'none';
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('visible', visible === 0);
                }
            }
            [keyword, year, region, type].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', apply);
                    control.addEventListener('change', apply);
                }
            });
            apply();
        });
    }

    window.initMoviePlayer = function (videoId, layerId, source) {
        var video = document.getElementById(videoId);
        var layer = document.getElementById(layerId);
        if (!video || !source) {
            return;
        }
        var hls = null;
        var ready = false;
        function attach() {
            if (ready) {
                return;
            }
            ready = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
        }
        function start() {
            attach();
            if (layer) {
                layer.classList.add('is-hidden');
            }
            var attempt = video.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {
                    if (layer) {
                        layer.classList.remove('is-hidden');
                    }
                });
            }
        }
        if (layer) {
            layer.addEventListener('click', start);
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener('play', function () {
            if (layer) {
                layer.classList.add('is-hidden');
            }
        });
        window.addEventListener('pagehide', function () {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
    });
})();
