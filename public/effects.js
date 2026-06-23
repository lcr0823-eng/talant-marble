(function () {
  // ── 팝업 효과 ──
  function showPop(kind) {
    const isGold = kind === 'gold';
    const pop = document.createElement('section');
    pop.className = 'game-pop';
    pop.innerHTML = `<div class="game-pop-card ${isGold ? 'gold' : ''}">
      <i class="spark a">✦</i><i class="spark b">✦</i><i class="spark c">✦</i>
      <span class="game-pop-icon">${isGold ? '🗝️' : '🏠'}</span>
      <h2>${isGold ? '황금열쇠 발견!' : '새 땅을 얻었어요!'}</h2>
      <p>${isGold ? '어떤 놀라운 일이 일어날까요?' : '멋진 달란트 타운을 함께 세워 가요!'}</p>
      <button type="button">좋아요!</button>
    </div>`;
    pop.addEventListener('click', event => { if (event.target === pop || event.target.closest('button')) pop.remove(); });
    document.body.appendChild(pop);
  }

  // ── 주사위 던지기 애니메이션 ──
  function throwDice() {
    const thrower = document.createElement('div');
    thrower.className = 'dice-throw';
    thrower.innerHTML = `<div class="throw-shadow"></div><i class="big-die one"><b></b><b></b><b></b><b></b><b></b></i><i class="big-die two"><b></b><b></b><b></b><b></b><b></b><b></b></i><strong>주사위 굴러간다!</strong>`;
    document.body.appendChild(thrower);
    setTimeout(() => thrower.remove(), 920);
  }

  // ── 컨페티 폭죽 ──
  function launchConfetti(count = 90) {
    const colors = ['#ff6b4a','#ffbd2e','#72d5b6','#9b5de5','#00bbf9','#fee440','#f15bb5','#3d5a80'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const size = 8 + Math.random() * 10;
      el.style.cssText = `
        left:${Math.random()*100}vw;
        width:${size}px; height:${size * (Math.random() > 0.5 ? 1 : 2.5)}px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-delay:${Math.random()*0.8}s;
        animation-duration:${1.8 + Math.random()*1.4}s;
        transform:rotate(${Math.random()*360}deg);
        border-radius:${Math.random()>0.5?'50%':'3px'};
      `;
      container.appendChild(el);
    }
    setTimeout(() => container.remove(), 3500);
  }

  // ── 코인 날아가는 효과 ──
  function coinShower(amount) {
    const count = Math.min(Math.ceil(amount / 5), 12);
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'coin-fly';
      el.textContent = '💰';
      el.style.cssText = `left:${30+Math.random()*40}vw;animation-delay:${i*0.08}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200 + i * 80);
    }
  }

  // ── 정답 별 폭발 ──
  function starBurst() {
    const el = document.createElement('div');
    el.className = 'star-burst';
    el.innerHTML = '⭐'.repeat(5);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ── 버튼 클릭 감지 → 효과 연결 ──
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const command = button.getAttribute('onclick') || '';

    if (command.includes("'chance'")) {
      window.SFX?.chance();
      setTimeout(() => showPop('gold'), 720);
    }
    if (command.includes("'buy'")) {
      window.SFX?.buy();
      setTimeout(() => showPop('land'), 520);
      setTimeout(() => coinShower(20), 600);
    }
    if (command.includes("'roll'")) {
      window.SFX?.roll();
      throwDice();
    }
    if (command.includes("'pay'")) {
      window.SFX?.pay();
    }
    if (command.includes("'end'")) {
      window.SFX?.move();
    }
    if (command.includes("'answer'") && !command.includes('skip')) {
      // 정답 여부는 서버 응답 후 판단 (아래 pollHook에서 처리)
    }
    if (command.includes('startGame')) {
      window.SFX?.correct();
    }
  });

  // ── 서버 응답 후 효과 (poll 결과 감시) ──
  const _origRender = window.render;
  let prevLog = '';
  function checkLogChange() {
    const r = window.room;
    if (!r || !r.log || !r.log.length) return;
    const latest = r.log[0]?.message || '';
    if (latest === prevLog) return;
    prevLog = latest;

    if (latest.includes('정답') && latest.includes('10달란트')) {
      window.SFX?.correct();
      starBurst();
      coinShower(10);
    } else if (latest.includes('아쉽지만')) {
      window.SFX?.wrong();
    } else if (latest.includes('통행료')) {
      window.SFX?.pay();
    } else if (latest.includes('출발지를 지나')) {
      window.SFX?.coin();
      coinShower(20);
    } else if (latest.includes('구입했습니다')) {
      window.SFX?.buy();
    } else if (latest.includes('시상식')) {
      window.SFX?.win();
      launchConfetti(120);
    }
  }
  setInterval(checkLogChange, 800);

  // ── 음악 토글 버튼 삽입 ──
  function mountMusicBtn() {
    const top = document.querySelector('.game .top, .welcome');
    if (!top || document.querySelector('#music-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'music-btn';
    btn.type = 'button';
    btn.title = '배경음악 켜기/끄기';
    btn.className = 'music-btn';
    btn.textContent = window.SFX?.isMusicOn() ? '🎵' : '🔇';
    btn.onclick = () => {
      const on = window.SFX?.toggleMusic();
      btn.textContent = on ? '🎵' : '🔇';
    };
    top.appendChild(btn);
  }
  new MutationObserver(mountMusicBtn).observe(document.querySelector('#app'), {childList:true, subtree:true});
  mountMusicBtn();
})();
