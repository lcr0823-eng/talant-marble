(function () {
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
  function throwDice() {
    const thrower = document.createElement('div');
    thrower.className = 'dice-throw';
    thrower.innerHTML = `<div class="throw-shadow"></div><i class="big-die one"><b></b><b></b><b></b><b></b><b></b></i><i class="big-die two"><b></b><b></b><b></b><b></b><b></b><b></b></i><strong>주사위 굴러간다!</strong>`;
    document.body.appendChild(thrower);
    setTimeout(() => thrower.remove(), 920);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const command = button.getAttribute('onclick') || '';
    if (command.includes("'chance'")) setTimeout(() => showPop('gold'), 720);
    if (command.includes("'buy'")) setTimeout(() => showPop('land'), 520);
    if (command.includes("'roll'")) throwDice();
  });
})();
