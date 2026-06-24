const app=document.querySelector('#app'); let room=null, playerId=localStorage.playerId||'', roomId=localStorage.roomId||'', busy=false, rolling=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error(d.error);return d}

const AVATARS=['🦁','🐻','🦊','🐼','🐯','🐨','🐸','🦄'];
let chosenAvatar=localStorage.chosenAvatar||'🦁';

function avatarPicker(){return `<div class="avatar-picker">${AVATARS.map(a=>`<button type="button" class="av-btn${a===chosenAvatar?' av-on':''}" onclick="pickAvatar('${a}')">${a}</button>`).join('')}</div>`;}
window.pickAvatar=function(a){chosenAvatar=a;localStorage.chosenAvatar=a;document.querySelectorAll('.av-btn').forEach(b=>{b.classList.toggle('av-on',b.textContent===a)});};

function qrImg(url){return `<img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=75431f&bgcolor=fffdf6" alt="QR 코드" onerror="this.style.display='none'">`;}

function welcome(){
  const params=new URLSearchParams(location.search);
  const prefillCode=params.get('join')||'';
  app.innerHTML=`<section class="welcome">
    <h1 class="logo">🎲 달란트마블</h1>
    <p>말씀을 기억하고 함께 즐기는 실시간 보드게임</p>
    <div class="card">
      <div class="form-block">
        <label class="form-label">👤 팀 이름 또는 내 이름</label>
        <input id="name" maxlength="12" placeholder="예) 믿음팀, 소망팀" autocomplete="off">
        <label class="form-label">🐾 아바타 선택</label>
        ${avatarPicker()}
      </div>
      <div class="form-block create-block">
        <div class="row">
          <label class="form-label">⏱ 게임 시간</label>
          <input id="duration" type="number" min="5" max="60" value="25" inputmode="numeric">
          <span style="font-size:13px;color:#8a4b12">분</span>
        </div>
        <div class="row">
          <label class="form-label">💰 시작 달란트</label>
          <input id="startMoney" type="number" min="20" max="200" value="60" inputmode="numeric">
          <span style="font-size:13px;color:#8a4b12">달란트</span>
        </div>
        <button onclick="createRoom()" style="margin-top:4px;width:100%;font-size:18px;min-height:56px">🎮 새 게임 만들기</button>
      </div>
      <hr style="border:none;border-top:2px dashed #e3b65b;margin:6px 0">
      <div class="form-block" style="gap:8px">
        <label class="form-label">🔑 방 코드로 참여하기</label>
        <input id="code" maxlength="6" placeholder="방 코드 6자리" value="${esc(prefillCode)}" autocomplete="off" style="text-transform:uppercase;letter-spacing:.15em;font-size:20px;text-align:center">
        <button onclick="joinRoom()" style="width:100%;background:linear-gradient(#6ac76a,#3fae3f);border-color:#2a7a2a;min-height:52px">✅ 게임 참여</button>
      </div>
    </div>
    <p class="muted" style="font-size:12px">교사는 새 게임을 만든 뒤 방 코드를 참여자에게 알려 주세요.</p>
  </section>`;
  if(prefillCode) document.querySelector('#code').focus();
}

async function createRoom(){try{const d=await api('/api/create',{name:document.querySelector('#name').value||'방장팀',avatar:chosenAvatar,duration:Number(document.querySelector('#duration').value)||25,startMoney:Number(document.querySelector('#startMoney').value)||60});room=d.room;playerId=d.playerId;roomId=room.id;save();render()}catch(e){alert(e.message)}}
async function joinRoom(){try{const code=document.querySelector('#code').value.trim().toUpperCase(), name=document.querySelector('#name').value||'참여팀';const d=await api('/api/join',{roomId:code,name,avatar:chosenAvatar});room=d.room;playerId=d.playerId;roomId=room.id;save();if(history.replaceState)history.replaceState(null,'','/');render()}catch(e){alert(e.message)}}
function save(){localStorage.playerId=playerId;localStorage.roomId=roomId} function me(){return room?.players.find(p=>p.id===playerId)} function owner(idx){return room.players.find(p=>p.lands.some(l=>l.idx===idx))}
function die(n){const on={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]}[n]||[];return `<i class="die ${rolling?'rolling':''}">${[1,2,3,4,5,6,7,8,9].map(i=>`<span style="visibility:${on.includes(i)?'visible':'hidden'}"></span>`).join('')}</i>`}
function boardHtml(){const slots=Array(64).fill(''); const indexes=[];for(let i=0;i<8;i++)indexes.push(i);for(let i=1;i<8;i++)indexes.push(i*8+7);for(let i=6;i>=0;i--)indexes.push(56+i);for(let i=6;i>0;i--)indexes.push(i*8);room.board.forEach((s,i)=>{const o=owner(i), people=room.players.filter(p=>p.position===i); slots[indexes[i]]=`<div class="space ${s[1]}" style="--c:${o?.color||'#8ac'}" onclick="showSpaceInfo(${i})"><b>${esc(s[0])}</b>${s[1]==='chance'?'<span class="space-icon key-icon">🗝️</span>':''}<small>${s[2]?s[2]+' 달란트':esc(s[3])}</small>${o?`<small class="land-owner" style="color:${o.color}">${o.avatar||'★'} ${o.lands.find(l=>l.idx===i)?.buildings?'🏠'.repeat(o.lands.find(l=>l.idx===i).buildings):''}</small>`:''}<div>${people.map(p=>`<i class="token" title="${esc(p.name)}" style="background:${p.color}">${p.avatar||''}</i>`).join('')}</div></div>`});const heroClass=sessionStorage.getItem('talentHeroesSeen')?'':' hero-enter';sessionStorage.setItem('talentHeroesSeen','1');const town=`<div class="center-scene"><span class="cloud c1">☁️</span><span class="cloud c2">☁️</span><span class="star s1">✦</span><span class="star s2">✦</span><div class="town-sign"><small>말씀을 따라 떠나는</small><strong>달란트 타운</strong><em>♟ 함께 즐기는 믿음의 보드게임 ♟</em></div><div class="hills">⛰️ <span>🌳</span> <span>⛪</span> <span>🌳</span> ⛰️</div><div class="mascots"><img class="${heroClass}" src="/assets/bible-heroes.png" alt="달란트 타운 탐험대"></div></div>`;return town+slots.map(x=>x||'<div class="space"></div>').join('')}

window.showSpaceInfo=function(idx){
  if(!room?.board?.[idx]) return;
  const s=room.board[idx];
  const edu=s[4]||'';
  const [icon,title,desc,fact]=edu.split('|');
  const o=owner(idx);
  const land=o?.lands?.find(l=>l.idx===idx);
  const ownerInfo=o?`<div class="info-owner" style="border-color:${o.color}"><span>${o.avatar||'★'}</span> <b>${esc(o.name)}</b> 팀 소유${'🏠'.repeat(land?.buildings||0)}</div>`:'';
  const pop=document.createElement('div');
  pop.className='modal space-info-pop';
  pop.innerHTML=`<div class="card space-info-card">
    <div class="info-icon">${icon||'📌'}</div>
    <h2 class="info-title">${esc(title||s[0])}</h2>
    ${ownerInfo}
    <p class="info-desc">${esc(desc||s[3])}</p>
    ${fact?`<div class="info-fact"><span>💡 재미있는 사실</span><p>${esc(fact)}</p></div>`:''}
    <button onclick="this.closest('.space-info-pop').remove()">닫기</button>
  </div>`;
  pop.addEventListener('click',e=>{if(e.target===pop)pop.remove();});
  document.body.appendChild(pop);
};

function lobbyHtml(mine,cur) {
  const joinUrl=`${location.origin}/?join=${room.id}`;
  const isHost=playerId===room.hostId;
  return `<section class="panel lobby-panel">
    <b>방 코드</b>
    <div class="room-code-big">${room.id}</div>
    <div class="qr-wrap">${qrImg(joinUrl)}<p class="muted qr-note">휴대폰으로 QR 스캔하거나<br>방 코드를 직접 입력하세요</p></div>
    ${isHost?`<p>현재 ${room.players.length}팀이 참여했습니다.</p><button ${room.players.length<2?'disabled':''} onclick="startGame()">✅ 게임 시작</button>`:'<p>방장이 게임을 시작할 때까지 기다려 주세요.</p>'}
    <a class="spec-link" href="/spectate.html?id=${room.id}" target="_blank">📺 관전(프로젝터) 화면 열기</a>
  </section>`;
}

function render(){if(!room)return welcome();const mine=me(), cur=room.players[room.turn%room.players.length], spot=room.board[mine.position], o=owner(mine.position), isMine=cur.id===playerId; const modal=mine.question?`<div class="modal"><div class="card"><h2>성경 퀴즈</h2><p>${esc(mine.question[0])}</p><input id="answer" placeholder="정답 입력"><p><button onclick="doAction('answer',{answer:document.querySelector('#answer').value})">정답 제출</button><button onclick="doAction('answer',{answer:'__skip__'})">건너뛰기</button></p></div></div>`:'';
app.innerHTML=`${modal}<main class="game"><header class="top"><h1>🎲 달란트마블</h1><div class="dice-zone">${die(mine.lastRoll?.[0]||1)}${die(mine.lastRoll?.[1]||1)}<span class="dice-caption">${rolling?'데굴데굴!':'행운의 주사위'}</span></div><span class="room">방 코드: ${room.id}</span></header><div class="layout"><section class="board ${rolling?'board-rolling':''}">${boardHtml()}</section><aside class="side">${!room.started?lobbyHtml(mine,cur):`<section class="panel"><b>${room.started?'현재 차례: '+esc(cur.name)+' 팀':'대기 중'}</b><div class="players">${room.players.map((p,i)=>`<div class="player ${p.id===cur.id&&room.started?'turn':''}" style="border-color:${p.color}"><i class="avatar">${p.avatar||['🦁','🐻','🦊','🐼','🐯','🐨'][i]}</i><b>${esc(p.name)}</b> · ${p.money}달란트<br><small>땅 ${p.lands.length}개 · 건물 ${p.lands.reduce((a,l)=>a+l.buildings,0)}개${p.quizWins?` · 퀴즈 ${p.quizWins}회`:''}</small></div>`).join('')}</div></section><section class="panel"><div class="notice">${isMine?'내 차례입니다. <b>'+esc(spot[0])+'</b>에 있습니다.':'다른 팀이 플레이 중입니다.'}</div><div class="actions"><button ${!isMine||mine.canAct?'disabled':''} onclick="doAction('roll')">🎲 주사위 던지기</button>${spot[1]==='land'&&!o?`<button ${!isMine||!mine.canAct?'disabled':''} onclick="doAction('buy')">🏷️ 땅 구입 (${spot[2]})</button>`:''}${o&&o.id===playerId&&mine.canAct?`<button ${!isMine||!mine.canAct?'disabled':''} onclick="doAction('build')">🏠 건물 짓기 (5)</button>`:''}${o&&o.id!==playerId?`<button ${!isMine||!mine.canAct?'disabled':''} onclick="doAction('pay')">💸 통행료 내기</button>`:''}${spot[1]==='chance'?`<button ${!isMine||!mine.canAct?'disabled':''} onclick="doAction('chance')">🗝️ 황금열쇠</button>`:''}${spot[1]==='quiz'?`<button ${!isMine||!mine.canAct?'disabled':''} onclick="doAction('quiz')">📖 퀴즈 풀기</button>`:''}${spot[1]==='travel'?`<button ${!isMine||!mine.canAct?'disabled':''} onclick="travel()">✈️ 세계여행 (50)</button>`:''}<button ${!isMine||!mine.canAct?'disabled':''} onclick="doAction('end')">✔️ 턴 마치기</button></div>${mine.lastRoll?`<p class="muted">최근 주사위: ${mine.lastRoll.join(' + ')}</p>`:''}${mine.card?`<div class="notice card-notice"><b>${mine.card[0]}</b><br>${mine.card[1]}</div>`:''}</section>`}<section class="panel log"><b>게임 소식</b>${room.log.map(x=>`<p>[${x.time}] ${esc(x.message)}</p>`).join('')}</section></aside></div></main>`}
async function startGame(){try{room=await api('/api/start',{roomId,playerId});render()}catch(e){alert(e.message)}}
async function travel(){const list=room.board.map((s,i)=>`${i+1}. ${s[0]}`).join('\n');const answer=prompt('50달란트를 내고 이동할 땅 번호를 입력하세요.\n\n'+list);if(answer!==null)doAction('travel',{target:Number(answer)-1})}
async function doAction(type,more={}){if(busy)return;busy=true;const snapMe=me()?{position:me().position,color:me().color,avatar:me().avatar}:null;try{if(type==='roll'){rolling=true;render();await new Promise(resolve=>setTimeout(resolve,650));}room=await api('/api/action',{roomId,playerId,type,...more});if(type==='roll'&&snapMe&&me()&&snapMe.position!==me().position){rolling=false;render();await window.animateMove?.(snapMe.position,me().position,me().color,me().avatar);}}catch(e){alert(e.message)}finally{rolling=false;busy=false;render()}}
async function poll(){if(!roomId)return;try{room=await api('/api/room?id='+encodeURIComponent(roomId));render()}catch(e){localStorage.removeItem('roomId');localStorage.removeItem('playerId');roomId='';playerId='';welcome()}}setInterval(poll,1500);roomId?poll():welcome();

window.createGameMode=async function(mode,count){
  try {
    const name=document.querySelector('#name')?.value || (mode==='solo'?'나의 탐험팀':'1팀');
    const duration=Number(document.querySelector('#duration')?.value)||25;
    const startMoney=Number(document.querySelector('#startMoney')?.value)||60;
    const d=await api('/api/create',{name,mode,count,avatar:chosenAvatar,duration,startMoney});
    room=d.room; playerId=d.playerId; roomId=room.id; save(); render();
  } catch(e) { alert(e.message); }
};
window.returnToLobby=function(){
  localStorage.removeItem('roomId'); localStorage.removeItem('playerId');
  room=null; roomId=''; playerId=''; welcome();
};
window.useAnItem=async function(){
  const mine=room?.players.find(p=>p.id===playerId);
  if(!mine?.items?.length){alert('사용할 아이템이 없습니다.');return;}
  const list=mine.items.map((x,i)=>`${i+1}. ${x}`).join('\n');
  const answer=prompt('사용할 아이템 번호를 선택하세요.\n\n'+list);
  if(!answer)return;
  const item=mine.items[Number(answer)-1];
  if(!item){alert('올바른 번호를 입력해 주세요.');return;}
  if(item==='원하는 땅 이동권'||item==='축복의 이동권'){
    const landList=room.board.map((s,i)=>`${i+1}. ${s[0]}`).join('\n');
    const dest=prompt('이동할 땅 번호를 입력하세요.\n\n'+landList);
    if(!dest)return;
    await doAction('useItem',{item,target:Number(dest)-1});
  } else {
    await doAction('useItem',{item});
  }
};
