(function () {
  const esc = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  let latest = null;
  async function load() {
    const roomId = localStorage.roomId;
    if (!roomId) return;
    try {
      const response = await fetch('/api/room?id=' + encodeURIComponent(roomId));
      if (!response.ok) return;
      latest = await response.json();
      paint();
    } catch (_) {}
  }
  function paint() {
    if (!latest || !latest.started) return;
    const mine = latest.players.find(p => p.id === localStorage.playerId);
    const top = document.querySelector('.game .top');
    if (!top) return;
    let hud = document.querySelector('#game-hud');
    if (!hud) { hud = document.createElement('div'); hud.id = 'game-hud'; top.appendChild(hud); }
    const seconds = latest.endsAt ? Math.max(0, Math.ceil((latest.endsAt - Date.now()) / 1000)) : latest.duration * 60;
    hud.innerHTML = `<b>⏱ ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}</b><span>⭐ 함께 ${latest.sharedStars||0}/${latest.sharedGoal||12}</span>`;
    if (seconds === 0 && localStorage.playerId === latest.hostId && !latest.finished) finishGame();
    let item = document.querySelector('#item-panel');
    if (!item) { item = document.createElement('section'); item.id = 'item-panel'; item.className = 'panel'; document.querySelector('.side')?.appendChild(item); }
    item.innerHTML = `<b>🎒 내 아이템</b><div>${mine?.items?.length ? mine.items.map(x => `<span class="item-chip">${esc(x)}</span>`).join('') : '<small>황금열쇠에서 아이템을 찾아보세요!</small>'}</div><button ${mine?.items?.length?'':'disabled'} onclick="useAnItem()">아이템 사용</button><button onclick="openMiniGame()">🎭 미니게임</button>`;
    if (latest.finished) award();
  }
  window.useAnItem = async function () { const mine=latest?.players.find(p=>p.id===localStorage.playerId); const item=prompt('사용할 아이템 이름을 입력하세요.\n'+(mine?.items||[]).join('\n')); if(!item)return; await action('useItem',{item}); };
  window.openMiniGame = function () { const games=['성경 인물 한 명을 몸으로 표현해 팀원이 맞히기','다윗처럼 수금을 연주하는 모습을 5초 동안 표현하기','팀원 전원이 서로에게 축복의 한마디 하기','아는 찬양 한 소절을 함께 부르기']; const game=games[Math.floor(Math.random()*games.length)]; const box=document.createElement('div');box.className='game-pop';box.innerHTML=`<div class="game-pop-card"><span class="game-pop-icon">🎭</span><h2>미니게임!</h2><p>${game}</p><button>성공했어요!</button></div>`;box.querySelector('button').onclick=()=>{box.remove();alert('교사가 확인한 뒤 10달란트를 주세요!');};document.body.appendChild(box); };
  async function action(type, extra={}) { const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:localStorage.roomId,playerId:localStorage.playerId,type,...extra})}); if(!r.ok){const d=await r.json();alert(d.error);return;} latest=await r.json(); paint(); }
  async function finishGame() { const r=await fetch('/api/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:localStorage.roomId,playerId:localStorage.playerId})}); if(r.ok){latest=await r.json();award();} }
  function award() { if(document.querySelector('#award-panel'))return; const byWorth=[...latest.players].sort((a,b)=>(b.money+b.lands.length*20)-(a.money+a.lands.length*20)); const award=document.createElement('div');award.id='award-panel';award.className='game-pop';award.innerHTML=`<div class="game-pop-card gold"><span class="game-pop-icon">🏆</span><h2>달란트마블 시상식</h2><p>👑 달란트 왕: <b>${esc(byWorth[0]?.name||'')}</b><br>📖 말씀 박사상: <b>${esc([...latest.players].sort((a,b)=>(b.quizWins||0)-(a.quizWins||0))[0]?.name||'모두')}</b><br>🤝 끝까지상: <b>모든 탐험팀</b><br>⭐ 공동 목표: ${latest.sharedStars||0}/${latest.sharedGoal||12}</p><button onclick="returnToLobby()">새 게임 하기</button></div>`;document.body.appendChild(award); }
  setInterval(load, 1000); load();
})();
