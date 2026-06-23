(function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let ctx = null, bgGain = null, sfxGain = null, bgPlaying = false, bgNodes = [];
  let musicOn = localStorage.musicOn !== 'false';

  function getCtx() {
    if (!ctx) {
      ctx = new AC();
      bgGain = ctx.createGain(); bgGain.gain.value = 0.18; bgGain.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(ctx.destination);
    }
    return ctx;
  }

  // ── 배경음악: C장조 펜타토닉 신나는 루프 ──
  const BPM = 138;
  const BEAT = 60 / BPM;
  // melody: [음높이Hz, 박자]
  const MELODY = [
    [523,1],[659,1],[784,1],[880,2],[784,1],[659,1],
    [523,1],[659,1],[784,1],[1047,2],[880,1],[784,1],
    [659,1],[523,2],[659,1],[784,1],[880,1],[784,1],
    [659,2],[523,1],[392,1],[523,2],[659,1],[784,2],
  ];
  const BASS = [130,165,196,130,165,196,130,196];

  function playNote(freq, start, dur, gain, type='square') {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.85);
    o.connect(g); g.connect(bgGain);
    o.start(start); o.stop(start + dur);
    bgNodes.push(o);
  }

  function scheduleLoop(startTime) {
    if (!musicOn || !bgPlaying) return;
    let t = startTime;
    // 멜로디
    for (const [freq, beats] of MELODY) {
      playNote(freq, t, beats * BEAT * 0.88, 1, 'square');
      t += beats * BEAT;
    }
    const loopLen = t - startTime;
    // 베이스
    let bt = startTime;
    for (let i = 0; i < Math.floor(loopLen / BEAT); i++) {
      playNote(BASS[i % BASS.length], bt, BEAT * 0.5, 0.7, 'sawtooth');
      bt += BEAT;
    }
    // 다음 루프 예약
    setTimeout(() => scheduleLoop(startTime + loopLen), (loopLen - 0.5) * 1000);
  }

  function startBg() {
    if (bgPlaying || !musicOn) return;
    bgPlaying = true;
    getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    scheduleLoop(ctx.currentTime + 0.1);
  }

  function stopBg() {
    bgPlaying = false;
    bgNodes.forEach(n => { try { n.stop(); } catch(_){} });
    bgNodes = [];
  }

  // ── 효과음 함수들 ──
  function sfx(fn) {
    try { getCtx(); if(ctx.state==='suspended') ctx.resume(); fn(ctx, sfxGain); } catch(_){}
  }

  window.SFX = {
    roll() { sfx((c,g) => {
      for (let i=0;i<6;i++) {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sawtooth'; o.frequency.value=80+Math.random()*200;
        gn.gain.setValueAtTime(0.4,c.currentTime+i*0.09);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.09+0.08);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.09); o.stop(c.currentTime+i*0.09+0.09);
      }
    }); },

    coin() { sfx((c,g) => {
      [523,659,784,1047].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sine'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.5,c.currentTime+i*0.07);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.07+0.2);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.07); o.stop(c.currentTime+i*0.07+0.2);
      });
    }); },

    buy() { sfx((c,g) => {
      [392,523,659,784,1047].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='triangle'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.6,c.currentTime+i*0.1);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.1+0.18);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.1); o.stop(c.currentTime+i*0.1+0.2);
      });
    }); },

    correct() { sfx((c,g) => {
      const fanfare=[523,659,784,1047,1319,1047,784,1047,1319];
      fanfare.forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='square'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.5,c.currentTime+i*0.08);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.14);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.08); o.stop(c.currentTime+i*0.08+0.15);
      });
    }); },

    wrong() { sfx((c,g) => {
      [220,196,174].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sawtooth'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.5,c.currentTime+i*0.15);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.15+0.25);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.15); o.stop(c.currentTime+i*0.15+0.26);
      });
    }); },

    pay() { sfx((c,g) => {
      const o=c.createOscillator(), gn=c.createGain();
      o.type='sawtooth'; o.frequency.setValueAtTime(440,c.currentTime);
      o.frequency.linearRampToValueAtTime(220,c.currentTime+0.3);
      gn.gain.setValueAtTime(0.5,c.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.35);
      o.connect(gn); gn.connect(g); o.start(c.currentTime); o.stop(c.currentTime+0.35);
    }); },

    chance() { sfx((c,g) => {
      for(let i=0;i<8;i++){
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sine'; o.frequency.value=440+Math.random()*880;
        gn.gain.setValueAtTime(0.3,c.currentTime+i*0.06);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.06+0.1);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.06); o.stop(c.currentTime+i*0.06+0.11);
      }
    }); },

    win() { sfx((c,g) => {
      const notes=[523,659,784,1047,1319,1047,1319,1047,1319,1568,1568];
      notes.forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='square'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.6,c.currentTime+i*0.12);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.2);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.22);
      });
    }); },

    move() { sfx((c,g) => {
      const o=c.createOscillator(), gn=c.createGain();
      o.type='sine'; o.frequency.setValueAtTime(440,c.currentTime);
      o.frequency.linearRampToValueAtTime(660,c.currentTime+0.12);
      gn.gain.setValueAtTime(0.35,c.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15);
      o.connect(gn); gn.connect(g); o.start(c.currentTime); o.stop(c.currentTime+0.15);
    }); },

    startBg, stopBg,
    toggleMusic() {
      musicOn = !musicOn;
      localStorage.musicOn = musicOn;
      if (musicOn) startBg(); else stopBg();
      return musicOn;
    },
    isMusicOn() { return musicOn; }
  };

  // 첫 클릭 시 배경음악 시작
  document.addEventListener('click', function startOnce() {
    if (musicOn) startBg();
    document.removeEventListener('click', startOnce);
  }, { once: true });
})();
