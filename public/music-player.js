(function () {
  const PLAYLIST = [
    { title: '어린이 주일학교 찬양 모음 36곡', desc: '신나는 율동찬양 1시간', id: 'kcKMPEon3vw' },
    { title: '어린이 찬양 모음 21곡', desc: '영·유아·초등 연속듣기', id: 'ujxT76jAoH4' },
    { title: '어린이 주일학교 찬양 33곡', desc: '신나는 율동찬양 60분', id: 'iRPT7mZdbmM' },
    { title: '주일학교 신나는 찬양 25곡', desc: '필그림교회 40분 모음', id: 'KdoYWnhnybA' },
    { title: '수련회·캠프 신나는 찬양 모음', desc: '아주 빠른 CCM 찬양', id: 'fPmzPlMZeog' },
    { title: '청년 추천 신나는 찬양', desc: '여름에 듣고 싶은 CCM', id: 'm2cJ41u2rD8' },
    { title: 'BEST CCM 찬양모음', desc: '멜론 TOP 30 모음', id: 'EIW-K7yYcHg' },
    { title: '어린이 율동찬양 4시간', desc: '신나는 어린이 찬양송', id: 'T1urhK6tscY' },
  ];

  let playerEl = null, ytPlayer = null, currentIdx = -1, panelOpen = false;

  function buildPanel() {
    if (document.querySelector('#praise-panel')) return;

    // 유튜브 IFrame API 로드
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // 플로팅 버튼
    const btn = document.createElement('button');
    btn.id = 'praise-btn';
    btn.className = 'praise-btn';
    btn.innerHTML = '🎵 찬양';
    btn.title = '찬양 플레이어 열기';
    btn.onclick = togglePanel;
    document.body.appendChild(btn);

    // 패널
    const panel = document.createElement('div');
    panel.id = 'praise-panel';
    panel.className = 'praise-panel';
    panel.innerHTML = `
      <div class="praise-header">
        <span>🎵 찬양 플레이어</span>
        <button class="praise-close" onclick="document.querySelector('#praise-panel').classList.remove('open')">✕</button>
      </div>
      <div id="yt-container"><div id="yt-player"></div></div>
      <div class="praise-list">
        ${PLAYLIST.map((s, i) => `
          <div class="praise-item" id="pi-${i}" onclick="window.playPraise(${i})">
            <span class="pi-num">${i + 1}</span>
            <div class="pi-info">
              <b>${s.title}</b>
              <small>${s.desc}</small>
            </div>
            <span class="pi-play">▶</span>
          </div>
        `).join('')}
      </div>
      <p class="praise-note">※ 찬양 재생 중에는 코드 음악이 꺼집니다</p>
    `;
    document.body.appendChild(panel);
  }

  function togglePanel() {
    const panel = document.querySelector('#praise-panel');
    if (!panel) return;
    panelOpen = !panel.classList.contains('open');
    panel.classList.toggle('open', panelOpen);
  }

  window.playPraise = function (idx) {
    const song = PLAYLIST[idx];
    if (!song) return;
    currentIdx = idx;

    // 기존 코드 음악 끄기
    window.SFX?.stopBg();
    const musicBtn = document.querySelector('#music-btn');
    if (musicBtn) musicBtn.textContent = '🔇';

    // 선택 표시
    document.querySelectorAll('.praise-item').forEach((el, i) => {
      el.classList.toggle('playing', i === idx);
    });

    if (window.YT?.Player) {
      if (ytPlayer) {
        ytPlayer.loadVideoById(song.id);
      } else {
        ytPlayer = new YT.Player('yt-player', {
          height: '0', width: '0',
          videoId: song.id,
          playerVars: { autoplay: 1, controls: 0 },
          events: { onReady: e => e.target.playVideo() }
        });
      }
    } else {
      // YT API 아직 안 로드됐으면 새 탭으로
      window.open(`https://www.youtube.com/watch?v=${song.id}`, '_blank');
    }
  };

  window.onYouTubeIframeAPIReady = function () {
    // API 준비 완료 — 이미 선택된 곡 있으면 재생
    if (currentIdx >= 0) window.playPraise(currentIdx);
  };

  // DOM 로드 후 패널 생성
  function tryBuild() {
    if (document.body) buildPanel();
    else setTimeout(tryBuild, 300);
  }
  new MutationObserver(() => { buildPanel(); }).observe(document.documentElement, { childList: true, subtree: true });
  tryBuild();
})();
