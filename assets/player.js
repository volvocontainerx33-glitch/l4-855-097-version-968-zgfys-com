(function () {
  var shells = document.querySelectorAll('[data-player]');

  shells.forEach(function (shell) {
    var video = shell.querySelector('video');
    var button = shell.querySelector('.play-overlay');
    var hls = null;
    var attached = false;
    var pendingPlay = false;

    if (!video) {
      return;
    }

    function revealButton() {
      if (button) {
        button.hidden = false;
      }
      shell.classList.remove('is-playing');
    }

    function hideButton() {
      if (button) {
        button.hidden = true;
      }
      shell.classList.add('is-playing');
    }

    function tryPlay() {
      var result = video.play();

      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          revealButton();
        });
      }
    }

    function attachSource() {
      var src = video.getAttribute('data-video');

      if (!src || attached) {
        return;
      }

      attached = true;

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(src);
        });
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          if (pendingPlay) {
            tryPlay();
          }
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && hls) {
            hls.destroy();
            hls = null;
            video.src = src;
            if (pendingPlay) {
              tryPlay();
            }
          }
        });
      } else {
        video.src = src;
      }
    }

    function start() {
      pendingPlay = true;
      hideButton();
      attachSource();

      if (!hls) {
        tryPlay();
      }
    }

    if (button) {
      button.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener('play', hideButton);
    video.addEventListener('pause', function () {
      if (!video.ended) {
        revealButton();
      }
    });
    video.addEventListener('ended', revealButton);
  });
})();
