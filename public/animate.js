(function () {
  const BOARD_SIZE = 36;
  // 10×10 보드 외곽 36칸 그리드 슬롯 인덱스
  const GRID = [];
  for(let i=0;i<10;i++) GRID.push(i);          // 상단 0→9
  for(let i=1;i<10;i++) GRID.push(i*10+9);     // 우측 19,29,...,99
  for(let i=8;i>=0;i--) GRID.push(90+i);       // 하단 98,97,...,90
  for(let i=8;i>0;i--) GRID.push(i*10);        // 좌측 80,70,...,10

  function slotCenter(boardRect, slotIdx) {
    const col = slotIdx % 10, row = Math.floor(slotIdx / 10);
    const cw = boardRect.width / 10, ch = boardRect.height / 10;
    return { x: boardRect.left + col * cw + cw / 2, y: boardRect.top + row * ch + ch / 2 };
  }

  window.animateMove = async function (fromPos, toPos, color, avatarSrc, avatarEmoji) {
    const boardEl = document.querySelector('.board');
    if (!boardEl) return;

    let steps = (toPos - fromPos + BOARD_SIZE) % BOARD_SIZE;
    if (steps === 0) return;

    const boardRect = boardEl.getBoundingClientRect();
    const start = slotCenter(boardRect, GRID[fromPos]);

    // 체스말처럼 서 있는 토큰 생성
    const tok = document.createElement('div');
    tok.className = 'moving-token';
    tok.style.background = color;
    tok.style.left = (start.x - 20) + 'px';
    tok.style.top  = (start.y - 30) + 'px';

    if (avatarSrc) {
      const img = document.createElement('img');
      img.src = avatarSrc;
      img.alt = '';
      tok.appendChild(img);
    } else {
      tok.textContent = avatarEmoji || '★';
    }
    document.body.appendChild(tok);

    // 첫 프레임 대기 (transition 적용을 위해)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    tok.classList.add('moving-token-active');

    // 이동 속도: 칸 수에 따라 조절 (조금 느리게)
    const delay = steps <= 5 ? 420 : steps <= 8 ? 360 : steps <= 11 ? 300 : 260;

    for (let i = 1; i <= steps; i++) {
      const pos = (fromPos + i) % BOARD_SIZE;
      const center = slotCenter(boardRect, GRID[pos]);
      tok.style.left = (center.x - 20) + 'px';
      tok.style.top  = (center.y - 30) + 'px';

      // 이동 중 통통 튀는 효과
      tok.classList.remove('tok-hop');
      void tok.offsetWidth; // reflow
      tok.classList.add('tok-hop');

      window.SFX?.step?.();
      await new Promise(r => setTimeout(r, delay));
    }

    // 도착 강조 바운스
    tok.classList.add('tok-land');
    await new Promise(r => setTimeout(r, 500));
    tok.style.opacity = '0';
    tok.style.transform = 'translateY(-12px) scale(1.2)';
    await new Promise(r => setTimeout(r, 250));
    tok.remove();
  };
})();
