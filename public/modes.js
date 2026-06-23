(function () {
  function mountModeChoices() {
    const card = document.querySelector('.welcome .card');
    if (!card || document.querySelector('#mode-choices')) return;
    const box = document.createElement('div');
    box.id = 'mode-choices';
    box.className = 'mode-choices';
    box.innerHTML = `<p>혼자 또는 한 기기로도 즐길 수 있어요</p>
      <button type="button" onclick="createGameMode('solo')">🤖 혼자 시뮬레이션</button>
      <button type="button" onclick="startTabletopMode()">👨‍👩‍👧‍👦 한 기기 모드</button>`;
    card.appendChild(box);
  }
  function mountNewGameButton() {
    const top = document.querySelector('.game .top');
    if (!top || document.querySelector('#new-game-btn')) return;
    const button = document.createElement('button');
    button.id = 'new-game-btn';
    button.type = 'button';
    button.textContent = '새 게임';
    button.onclick = () => returnToLobby();
    top.appendChild(button);
  }
  window.startTabletopMode = function () {
    const answer = prompt('한 기기에서 몇 팀이 할까요? (2~5)', '3');
    const count = Number(answer);
    if (count >= 2 && count <= 5) createGameMode('tabletop', count);
    else if (answer !== null) alert('2~5 사이 숫자를 입력해 주세요.');
  };
  new MutationObserver(() => { mountModeChoices(); mountNewGameButton(); }).observe(document.querySelector('#app'), {childList:true, subtree:true});
  mountModeChoices();
  mountNewGameButton();
})();
