(function () {
  const BOARD_SIZE = 28;
  // 보드 28칸의 그리드 슬롯 인덱스 (8x8 격자에서의 위치)
  const GRID = [];
  for(let i=0;i<8;i++) GRID.push(i);           // 상단 0→7
  for(let i=1;i<8;i++) GRID.push(i*8+7);       // 우측 8→14
  for(let i=6;i>=0;i--) GRID.push(56+i);       // 하단 15→21
  for(let i=6;i>0;i--) GRID.push(i*8);         // 좌측 22→27

  function slotCenter(boardRect, slotIdx) {
    const col = slotIdx % 8, row = Math.floor(slotIdx / 8);
    const cw = boardRect.width / 8, ch = boardRect.height / 8;
    return { x: boardRect.left + col * cw + cw / 2, y: boardRect.top + row * ch + ch / 2 };
  }

  window.animateMove = async function (fromPos, toPos, color, avatar) {
    const boardEl = document.querySelector('.board');
    if (!boardEl) return;

    let steps = (toPos - fromPos + BOARD_SIZE) % BOARD_SIZE;
    if (steps === 0) return;

    const boardRect = boardEl.getBoundingClientRect();
    const start = slotCenter(boardRect, GRID[fromPos]);

    // 말 오버레이 생성
    const tok = document.createElement('div');
    tok.className = 'moving-token';
    tok.style.left = (start.x - 18) + 'px';
    tok.style.top  = (start.y - 18) + 'px';
    tok.style.background = color;
    tok.textContent = avatar || '★';
    document.body.appendChild(tok);

    // 첫 프레임 후 transition 활성화
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 칸마다 이동
    const delay = steps <= 6 ? 260 : steps <= 10 ? 200 : 150;
    for (let i = 1; i <= steps; i++) {
      const pos = (fromPos + i) % BOARD_SIZE;
      const center = slotCenter(boardRect, GRID[pos]);
      tok.style.left = (center.x - 18) + 'px';
      tok.style.top  = (center.y - 18) + 'px';
      window.SFX?.step();
      await new Promise(r => setTimeout(r, delay));
    }

    // 도착 바운스
    tok.classList.add('tok-land');
    await new Promise(r => setTimeout(r, 400));
    tok.style.opacity = '0';
    await new Promise(r => setTimeout(r, 200));
    tok.remove();
  };
})();
