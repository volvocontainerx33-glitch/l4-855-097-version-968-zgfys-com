(function () {
    'use strict';

    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initMobileNavigation() {
        var button = document.querySelector('[data-nav-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');

        if (!button || !nav) {
            return;
        }

        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function initHeroSlider() {
        var root = document.querySelector('[data-hero-slider]');

        if (!root) {
            return;
        }

        var slides = selectAll('[data-slide]', root);
        var dots = selectAll('[data-slide-to]', root);
        var prev = root.querySelector('[data-hero-prev]');
        var next = root.querySelector('[data-hero-next]');
        var activeIndex = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;

            slides.forEach(function (slide, position) {
                slide.classList.toggle('is-active', position === activeIndex);
            });

            dots.forEach(function (dot, position) {
                dot.classList.toggle('is-active', position === activeIndex);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(activeIndex + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-slide-to')) || 0);
                start();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(activeIndex - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(activeIndex + 1);
                start();
            });
        }

        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initFilters() {
        selectAll('[data-filter-scope]').forEach(function (scope) {
            var keyword = scope.querySelector('[data-filter-keyword]');
            var region = scope.querySelector('[data-filter-region]');
            var type = scope.querySelector('[data-filter-type]');
            var year = scope.querySelector('[data-filter-year]');
            var category = scope.querySelector('[data-filter-category]');
            var clear = scope.querySelector('[data-filter-clear]');
            var counter = scope.querySelector('[data-result-count]');
            var empty = scope.querySelector('[data-empty-state]');
            var cards = selectAll('.movie-card', scope);

            function applyFilter() {
                var query = normalize(keyword && keyword.value);
                var regionValue = normalize(region && region.value);
                var typeValue = normalize(type && type.value);
                var yearValue = normalize(year && year.value);
                var categoryValue = normalize(category && category.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var searchText = normalize(card.getAttribute('data-search'));
                    var cardRegion = normalize(card.getAttribute('data-region'));
                    var cardType = normalize(card.getAttribute('data-type'));
                    var cardYear = normalize(card.getAttribute('data-year'));
                    var cardCategory = normalize(card.getAttribute('data-category'));

                    var matched = true;
                    matched = matched && (!query || searchText.indexOf(query) !== -1);
                    matched = matched && (!regionValue || cardRegion === regionValue);
                    matched = matched && (!typeValue || cardType === typeValue);
                    matched = matched && (!yearValue || cardYear === yearValue);
                    matched = matched && (!categoryValue || cardCategory === categoryValue);

                    card.hidden = !matched;
                    if (matched) {
                        visible += 1;
                    }
                });

                if (counter) {
                    counter.textContent = String(visible);
                }

                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            [keyword, region, type, year, category].forEach(function (control) {
                if (!control) {
                    return;
                }

                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            });

            if (clear) {
                clear.addEventListener('click', function () {
                    [keyword, region, type, year, category].forEach(function (control) {
                        if (control) {
                            control.value = '';
                        }
                    });
                    applyFilter();
                });
            }

            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query && keyword) {
                keyword.value = query;
            }

            applyFilter();
        });
    }

    function initRandomButtons() {
        selectAll('[data-random-links]').forEach(function (section) {
            var button = section.querySelector('[data-random-button]');
            var raw = section.getAttribute('data-random-links');
            var links = [];

            try {
                links = JSON.parse(raw || '[]');
            } catch (error) {
                links = [];
            }

            if (!button || !links.length) {
                return;
            }

            button.addEventListener('click', function () {
                var index = Math.floor(Math.random() * links.length);
                window.location.href = links[index];
            });
        });
    }

    function initImageFallbacks() {
        selectAll('img').forEach(function (image) {
            image.addEventListener('error', function () {
                var holder = image.closest('.poster-shell, .hero-poster-stack, .category-card-cover, .detail-poster');
                if (holder) {
                    holder.classList.add('no-image');
                }
            }, { once: true });
        });
    }

    function initPlayers() {
        selectAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            var message = player.querySelector('[data-player-message]');
            var source = player.getAttribute('data-source');
            var hlsInstance = null;

            function setMessage(text) {
                if (message) {
                    message.textContent = text || '';
                }
            }

            function playVideo() {
                if (!video || !source) {
                    setMessage('当前影片暂未配置播放源。');
                    return;
                }

                player.classList.add('is-playing');
                setMessage('正在载入视频源...');

                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.play().then(function () {
                        setMessage('');
                    }).catch(function () {
                        setMessage('请点击视频控件继续播放。');
                    });
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });

                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        video.play().then(function () {
                            setMessage('');
                        }).catch(function () {
                            setMessage('请点击视频控件继续播放。');
                        });
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setMessage('播放源加载失败，请刷新页面后重试。');
                        }
                    });
                    return;
                }

                setMessage('当前浏览器不支持 HLS 播放，请更换浏览器。');
            }

            if (button) {
                button.addEventListener('click', playVideo);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileNavigation();
        initHeroSlider();
        initFilters();
        initRandomButtons();
        initImageFallbacks();
        initPlayers();
    });
}());
