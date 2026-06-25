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
    paintAdmin();
  }
  window.useAnItem = async function () { const mine=latest?.players.find(p=>p.id===localStorage.playerId); const item=prompt('사용할 아이템 이름을 입력하세요.\n'+(mine?.items||[]).join('\n')); if(!item)return; await action('useItem',{item}); };
  window.openMiniGame = function () { const games=['성경 인물 한 명을 몸으로 표현해 팀원이 맞히기','다윗처럼 수금을 연주하는 모습을 5초 동안 표현하기','팀원 전원이 서로에게 축복의 한마디 하기','아는 찬양 한 소절을 함께 부르기']; const game=games[Math.floor(Math.random()*games.length)]; const box=document.createElement('div');box.className='game-pop';box.innerHTML=`<div class="game-pop-card"><span class="game-pop-icon">🎭</span><h2>미니게임!</h2><p>${game}</p><button>성공했어요!</button></div>`;box.querySelector('button').onclick=()=>{box.remove();alert('교사가 확인한 뒤 10달란트를 주세요!');};document.body.appendChild(box); };

  // ── 교사 관리 패널 (방장만 표시) ───────────────────────────────
  function paintAdmin() {
    if(!latest?.started || latest?.finished) return;
    if(localStorage.playerId !== latest.hostId) return;
    let panel = document.querySelector('#admin-panel');
    if(!panel) {
      panel = document.createElement('section');
      panel.id = 'admin-panel';
      panel.className = 'panel';
      panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#0f3460);border:2px solid #4a6fa5;color:#e2e8f0;font-size:13px';
      document.querySelector('.side')?.appendChild(panel);
    }
    const teams = latest.players.map((p,i) => `<option value="${p.id}">${p.avatar||''} ${p.name}</option>`).join('');
    panel.innerHTML = `
      <b style="color:#90cdf4;font-size:14px">⚙️ 교사 관리 패널</b>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button onclick="adminExtend(5)" style="font-size:12px;padding:5px 10px;background:#1a3a6e;border-color:#4a6fa5;color:#90cdf4">⏱ +5분</button>
        <button onclick="adminExtend(10)" style="font-size:12px;padding:5px 10px;background:#1a3a6e;border-color:#4a6fa5;color:#90cdf4">⏱ +10분</button>
        <button onclick="adminStarGoal()" style="font-size:12px;padding:5px 10px;background:#1a3a6e;border-color:#4a6fa5;color:#90cdf4">⭐ 별 목표</button>
        <button onclick="adminForceNext()" style="font-size:12px;padding:5px 10px;background:#3a1a0a;border-color:#c06030;color:#ffa080">⏭ 강제 다음</button>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap">
        <select id="admin-team-sel" style="font-size:12px;padding:4px 6px;border-radius:8px;border:2px solid #4a6fa5;background:#0f3460;color:#e2e8f0">${teams}</select>
        <input id="admin-amt" type="number" placeholder="달란트" value="10" style="width:80px;font-size:12px;padding:4px 8px;border-radius:8px;border:2px solid #4a6fa5;background:#0f3460;color:#e2e8f0">
        <button onclick="adminBonus()" style="font-size:12px;padding:5px 10px;background:#1a4a1a;border-color:#3a9a3a;color:#90ee90">💰 지급</button>
        <button onclick="adminBonus(-1)" style="font-size:12px;padding:5px 10px;background:#4a1a1a;border-color:#9a3a3a;color:#ff9090">💸 차감</button>
      </div>`;
  }

  async function adminApi(body) {
    const r = await fetch('/api/adminSet', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({roomId:localStorage.roomId, playerId:localStorage.playerId, ...body})});
    if(!r.ok){const d=await r.json();alert(d.error);return;}
    latest = await r.json();
    paint();
  }
  window.adminExtend = function(mins) { adminApi({extendMinutes:mins}); };
  window.adminStarGoal = function() { const v=prompt('새 공동 별 목표 수를 입력하세요.',latest.sharedGoal||12); if(v!==null&&!isNaN(Number(v))) adminApi({starGoal:Number(v)}); };
  window.adminForceNext = function() { if(confirm('현재 팀의 턴을 건너뛰고 다음 팀으로 넘길까요?')) adminApi({forceNextTurn:true}); };
  window.adminBonus = function(sign=1) {
    const sel=document.querySelector('#admin-team-sel'); const amt=Number(document.querySelector('#admin-amt')?.value||10);
    if(!sel||isNaN(amt)||amt===0){alert('팀과 달란트 금액을 확인해 주세요.');return;}
    adminApi({bonusTeamId:sel.value, bonusAmount:sign*Math.abs(amt)});
  };
  async function action(type, extra={}) { const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:localStorage.roomId,playerId:localStorage.playerId,type,...extra})}); if(!r.ok){const d=await r.json();alert(d.error);return;} latest=await r.json(); paint(); }
  async function finishGame() { const r=await fetch('/api/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId:localStorage.roomId,playerId:localStorage.playerId})}); if(r.ok){latest=await r.json();award();} }
  function award() { if(document.querySelector('#award-panel'))return; const byWorth=[...latest.players].sort((a,b)=>(b.money+b.lands.length*20)-(a.money+a.lands.length*20)); const award=document.createElement('div');award.id='award-panel';award.className='game-pop';award.innerHTML=`<div class="game-pop-card gold"><span class="game-pop-icon">🏆</span><h2>달란트마블 시상식</h2><p>👑 달란트 왕: <b>${esc(byWorth[0]?.name||'')}</b><br>📖 말씀 박사상: <b>${esc([...latest.players].sort((a,b)=>(b.quizWins||0)-(a.quizWins||0))[0]?.name||'모두')}</b><br>🤝 끝까지상: <b>모든 탐험팀</b><br>⭐ 공동 목표: ${latest.sharedStars||0}/${latest.sharedGoal||12}</p><button onclick="returnToLobby()">새 게임 하기</button></div>`;document.body.appendChild(award); }
  setInterval(load, 1000); load();
})();
