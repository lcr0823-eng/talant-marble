(function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let ctx = null, bgGain = null, sfxGain = null, bgPlaying = false;
  let musicOn = localStorage.musicOn !== 'false';

  function getCtx() {
    if (!ctx) {
      ctx = new AC();
      bgGain = ctx.createGain(); bgGain.gain.value = 0.14; bgGain.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.52; sfxGain.connect(ctx.destination);
    }
    return ctx;
  }

  // ── 신나는 배경음악 (160 BPM, C장조) ──
  const BPM = 160;
  const B = 60 / BPM;

  // 멜로디: [Hz, 박자배수] — 신나고 경쾌한 8마디 루프
  const MELODY = [
    [784,0.5],[659,0.5],[784,0.5],[880,0.5],[784,1],[659,0.5],[523,0.5],
    [659,0.5],[587,0.5],[659,0.5],[784,0.5],[659,1],[587,1],
    [698,0.5],[587,0.5],[698,0.5],[784,0.5],[698,1],[587,0.5],[523,0.5],
    [523,0.5],[587,0.5],[659,0.5],[523,0.5],[392,2],
    [880,0.5],[784,0.5],[880,0.5],[1047,0.5],[880,1],[784,0.5],[659,0.5],
    [784,0.5],[698,0.5],[784,0.5],[880,0.5],[784,1],[698,1],
    [659,0.5],[784,0.5],[880,0.5],[784,0.5],[698,0.5],[659,0.5],[587,0.5],[523,0.5],
    [523,0.5],[659,0.5],[784,0.5],[659,0.5],[523,2],
  ];
  // 베이스: 루프 패턴
  const BASS = [130,196,165,196, 117,196,165,196, 131,196,175,196, 130,196,165,196,
                130,196,165,196, 117,196,165,196, 131,165,196,165, 130,196,131,130];
  // 화음 (멜로디보다 5도 아래)
  const HARM = [523,440,523,587,523,440,330,
                440,392,440,523,440,392,
                466,392,466,523,466,392,330,
                330,392,440,330,262,
                587,523,587,659,587,523,440,
                523,466,523,587,523,466,
                440,523,587,523,466,440,392,330,
                330,440,523,440,330];

  function osc(freq, start, dur, gainVal, type='square', dest) {
    const c = getCtx();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, start);
    g.gain.linearRampToValueAtTime(gainVal, start + 0.015);
    g.gain.setValueAtTime(gainVal, start + dur * 0.65);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.95);
    o.connect(g); g.connect(dest || bgGain);
    o.start(start); o.stop(start + dur + 0.05);
  }

  function kick(t) {
    const c = getCtx();
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(bgGain); o.start(t); o.stop(t + 0.2);
  }
  function hihat(t) {
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
    const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
    const src = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter();
    fl.type = 'highpass'; fl.frequency.value = 8000;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.buffer = buf; src.connect(fl); fl.connect(g); g.connect(bgGain); src.start(t);
  }

  function scheduleLoop(startTime) {
    if (!musicOn || !bgPlaying) return;
    const c = getCtx();
    let t = startTime;

    // 멜로디
    for (const [freq, beats] of MELODY) {
      const dur = beats * B;
      osc(freq, t, dur * 0.82, 0.9, 'square');
      t += dur;
    }
    const loopLen = t - startTime;

    // 화음
    let ht = startTime;
    for (const freq of HARM) {
      osc(freq, ht, B * 0.7, 0.35, 'triangle');
      ht += B * 0.5;
    }

    // 베이스
    let bt = startTime;
    for (let i = 0; i < Math.floor(loopLen / B); i++) {
      osc(BASS[i % BASS.length], bt, B * 0.6, 0.6, 'sawtooth');
      bt += B;
    }

    // 드럼 (4분음표 킥, 8분음표 하이햇)
    for (let i = 0; i < Math.floor(loopLen / B); i++) {
      const kt = startTime + i * B;
      if (i % 4 === 0 || i % 4 === 2) kick(kt);
      if (i % 2 === 1) hihat(kt);
      hihat(startTime + i * B + B * 0.5);
    }

    setTimeout(() => { if(bgPlaying) scheduleLoop(startTime + loopLen); }, (loopLen - 0.5) * 1000);
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
  }

  function sfx(fn) {
    try { getCtx(); if(ctx.state==='suspended') ctx.resume(); fn(ctx, sfxGain); } catch(_){}
  }

  window.SFX = {
    roll() { sfx((c,g) => {
      for(let i=0;i<7;i++){
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sawtooth'; o.frequency.value=60+Math.random()*280;
        gn.gain.setValueAtTime(0.45,c.currentTime+i*0.08);
        gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.08+0.09);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.08); o.stop(c.currentTime+i*0.08+0.1);
      }
    }); },

    step() { sfx((c,g) => {
      const o=c.createOscillator(), gn=c.createGain();
      o.type='sine'; o.frequency.setValueAtTime(520,c.currentTime); o.frequency.linearRampToValueAtTime(660,c.currentTime+0.06);
      gn.gain.setValueAtTime(0.22,c.currentTime); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.1);
      o.connect(gn); gn.connect(g); o.start(c.currentTime); o.stop(c.currentTime+0.1);
    }); },

    coin() { sfx((c,g) => {
      [523,659,784,1047,1319].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sine'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.5,c.currentTime+i*0.07); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.07+0.22);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.07); o.stop(c.currentTime+i*0.07+0.23);
      });
    }); },

    buy() { sfx((c,g) => {
      [392,523,659,784,1047,1319].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='triangle'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.6,c.currentTime+i*0.09); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.09+0.18);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.09); o.stop(c.currentTime+i*0.09+0.2);
      });
    }); },

    correct() { sfx((c,g) => {
      [523,659,784,880,1047,1319,1047,1319,1568].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='square'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.5,c.currentTime+i*0.09); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.09+0.15);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.09); o.stop(c.currentTime+i*0.09+0.16);
      });
    }); },

    wrong() { sfx((c,g) => {
      [330,294,262,220].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sawtooth'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.5,c.currentTime+i*0.13); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.13+0.22);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.13); o.stop(c.currentTime+i*0.13+0.23);
      });
    }); },

    pay() { sfx((c,g) => {
      const o=c.createOscillator(), gn=c.createGain();
      o.type='sawtooth'; o.frequency.setValueAtTime(440,c.currentTime); o.frequency.linearRampToValueAtTime(180,c.currentTime+0.35);
      gn.gain.setValueAtTime(0.5,c.currentTime); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.38);
      o.connect(gn); gn.connect(g); o.start(c.currentTime); o.stop(c.currentTime+0.4);
    }); },

    chance() { sfx((c,g) => {
      for(let i=0;i<10;i++){
        const o=c.createOscillator(), gn=c.createGain();
        o.type='sine'; o.frequency.value=330+Math.random()*1200;
        gn.gain.setValueAtTime(0.3,c.currentTime+i*0.055); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.055+0.1);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.055); o.stop(c.currentTime+i*0.055+0.11);
      }
    }); },

    win() { sfx((c,g) => {
      [523,659,784,1047,1319,1047,1319,1047,1319,1568,1568,1319,1568].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='square'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.6,c.currentTime+i*0.11); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.11+0.19);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.11); o.stop(c.currentTime+i*0.11+0.2);
      });
    }); },

    move() { sfx((c,g) => {
      const o=c.createOscillator(), gn=c.createGain();
      o.type='sine'; o.frequency.setValueAtTime(440,c.currentTime); o.frequency.linearRampToValueAtTime(660,c.currentTime+0.12);
      gn.gain.setValueAtTime(0.3,c.currentTime); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.14);
      o.connect(gn); gn.connect(g); o.start(c.currentTime); o.stop(c.currentTime+0.15);
    }); },

    // 내 차례 알림음 (밝고 경쾌한 3음)
    myTurn() { sfx((c,g) => {
      [523,784,1047].forEach((f,i) => {
        const o=c.createOscillator(), gn=c.createGain();
        o.type='triangle'; o.frequency.value=f;
        gn.gain.setValueAtTime(0.7,c.currentTime+i*0.13); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.13+0.28);
        o.connect(gn); gn.connect(g); o.start(c.currentTime+i*0.13); o.stop(c.currentTime+i*0.13+0.3);
      });
    }); },

    // 카운트다운 틱
    countTick() { sfx((c,g) => {
      const o=c.createOscillator(), gn=c.createGain();
      o.type='sine'; o.frequency.value=880;
      gn.gain.setValueAtTime(0.5,c.currentTime); gn.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.12);
      o.connect(gn); gn.connect(g); o.start(c.currentTime); o.stop(c.currentTime+0.13);
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

  document.addEventListener('click', function once() {
    if (musicOn) startBg();
  }, { once: true });
})();
