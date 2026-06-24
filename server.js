const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const rooms = new Map();
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' };

// board: [이름, 타입, 가격, 짧은설명, 교육정보(이모지|제목|내용|재미있는사실)]
const board = [
  ['출발','start',0,'한 바퀴를 돌면 20달란트를 받습니다.','🏁|출발!|보드를 한 바퀴 돌 때마다 20달란트를 받아요. 힘차게 출발해 볼까요?|성경에서도 "달란트"는 실제 돈의 단위였어요. 1달란트는 약 6,000데나리온으로 노동자 20년치 임금이에요!'],
  ['노아','land',20,'당대에 완전한 의인','🚢|노아|하나님 말씀에 순종해 방주를 만들어 홍수에서 가족과 모든 동물을 구한 믿음의 사람이에요.|방주의 크기는 약 135m! 요즘 아파트 45층 높이의 배예요. 노아는 40일 밤낮 비가 내리는 동안 방주 안에 있었어요. 🌈'],
  ['모세','land',30,'출애굽의 지도자','✋|모세|하나님의 명령을 받아 이스라엘 백성 200만 명을 이집트 노예 생활에서 이끌어낸 위대한 지도자예요.|모세는 홍해를 갈라 바다 한가운데로 길을 만들었어요! 또 40년 동안 광야를 걸었는데, 시내산에서 십계명을 받았어요. ⛰️'],
  ['황금열쇠','chance',0,'예상하지 못한 은혜의 카드','🗝️|황금열쇠|어떤 카드가 나올지 두근두근! 하나님의 은혜는 언제나 예상을 뛰어넘어요.|성경에 "열쇠"는 권위와 능력을 상징해요. 예수님이 베드로에게 "천국 열쇠"를 주셨다고 했어요! (마태복음 16:19)'],
  ['다윗','land',20,'하나님 마음에 합한 사람','🎸|다윗|물맷돌 하나로 거인 골리앗을 쓰러뜨린 소년! 하나님은 외모가 아닌 마음을 보신다고 하셨어요.|다윗은 수금(하프)을 잘 연주했어요. 시편 150편 중 73편이 다윗이 지은 노래예요! 그는 양치기 소년에서 이스라엘의 왕이 됐어요. 👑'],
  ['기드온','land',20,'300 용사','🔦|기드온|미디안 13만 5천 대군을 단 300명으로 물리친 믿음의 장군! 횃불과 항아리, 나팔이 무기였어요.|기드온의 300 용사들은 한밤중에 항아리를 깨고 횃불을 들며 나팔을 불었어요. 적군이 혼비백산해 도망쳤어요! 하나님의 방법은 우리 생각과 달라요. 🎺'],
  ['광야','desert',0,'한 번 쉽니다.','🏜️|광야|광야는 메마르고 척박한 사막 같은 곳이에요. 이스라엘 백성은 40년을 광야에서 보냈어요.|광야에서도 하나님은 하늘에서 만나(빵)를 내려주시고 반석에서 물이 나오게 하셨어요! 힘든 때도 하나님은 함께하세요. ☁️'],
  ['베들레헴','land',20,'예수님이 태어나신 곳','⭐|베들레헴|히브리어로 "빵집"이라는 뜻이에요. 이스라엘 유다 지파의 작은 마을에서 예수님이 태어나셨어요.|동방박사 세 명이 별을 보고 베들레헴을 찾아왔어요. 그들은 황금, 유향, 몰약을 선물로 가져왔어요. 예수님은 말구유에 태어나셨어요! 🐑'],
  ['다메섹','land',20,'사울이 예수님을 만난 곳','💡|다메섹|오늘날 시리아의 수도 다마스쿠스예요. 크리스천을 박해하던 사울이 이 길에서 눈 먼 빛을 만나 예수님을 만났어요.|사울은 이 경험 후 바울이라는 이름으로 바뀌고, 오히려 가장 열심히 복음을 전하는 선교사가 됐어요! 신약 성경의 절반 이상을 썼어요. ✍️'],
  ['에덴동산','land',20,'인간이 최초로 살았던 곳','🌳|에덴동산|하나님이 아담과 하와를 위해 만드신 완벽하고 아름다운 동산이에요. 에덴은 "기쁨"이라는 뜻이에요.|에덴동산에는 생명나무와 선악을 알게 하는 나무가 있었어요. 뱀의 꼬임에 넘어간 하와와 아담이 선악과를 먹어 동산에서 쫓겨났어요. 🍎'],
  ['황금열쇠','chance',0,'예상하지 못한 은혜의 카드','🗝️|황금열쇠|어떤 카드가 나올지 두근두근! 하나님의 은혜는 언제나 예상을 뛰어넘어요.|성경에 "열쇠"는 권위와 능력을 상징해요. 예수님이 베드로에게 "천국 열쇠"를 주셨다고 했어요! (마태복음 16:19)'],
  ['골고다','land',30,'예수님이 십자가에 못 박히신 곳','✝️|골고다|히브리어로 "해골 곳"이라는 뜻이에요. 예루살렘 성 밖 언덕으로, 예수님이 우리 죄를 위해 십자가를 지신 곳이에요.|예수님은 우리 대신 십자가에서 돌아가셨어요. 그리고 3일 만에 다시 살아나셨어요! 이것이 기독교 신앙의 핵심이에요. ❤️'],
  ['가나안','land',20,'젖과 꿀이 흐르는 땅','🍯|가나안|하나님이 아브라함, 이삭, 야곱에게 약속하신 땅이에요. 오늘날 이스라엘 지역이에요.|"젖과 꿀이 흐른다"는 것은 매우 풍요롭다는 표현이에요. 이스라엘 백성이 40년 광야 생활 끝에 여호수아의 인도로 마침내 들어간 약속의 땅이에요! 🌻'],
  ['성경 퀴즈','quiz',0,'함께 말씀을 기억해요','📖|성경 퀴즈|성경 말씀을 얼마나 알고 있나요? 정답을 맞히면 10달란트와 공동 별⭐을 획득해요!|성경은 66권으로 구성돼 있어요. 구약 39권, 신약 27권이에요. 약 40명의 저자가 1,500년에 걸쳐 기록했어요. 세계에서 가장 많이 팔린 책이에요! 📚'],
  ['호산나','land',30,'주여, 구원하소서','🌿|호산나|히브리어로 "지금 구원해 주세요!"라는 뜻이에요. 예수님이 예루살렘에 입성하실 때 군중이 외친 말이에요.|사람들은 종려나무 가지를 들고 "호산나! 주의 이름으로 오시는 이여!"라고 외쳤어요. 지금도 교회에서 종려주일에 기억해요. 🏙️'],
  ['여호와 이레','land',20,'여호와께서 준비하심','🐑|여호와 이레|하나님이 미리 준비해 주신다는 뜻이에요. 아브라함이 이삭을 제물로 바치려 할 때 하나님이 양을 준비해 주셨어요.|하나님은 우리가 필요한 것을 미리 아시고 준비해 주세요. "나의 하나님이 그리스도 예수 안에서 영광 가운데 그 풍성한 대로 너희 모든 쓸 것을 채우시리라" (빌 4:19)'],
  ['할렐루야','land',20,'하나님을 찬양합니다','🎵|할렐루야|히브리어로 "하나님(야)을 찬양(할렐)하라!"는 뜻이에요. 전 세계 어느 나라 교회에서나 쓰는 말이에요!|헨델이 작곡한 메시아의 "할렐루야 합창"은 너무 감동적이어서 영국 왕이 일어섰고, 지금도 이 부분에서 모두 일어나는 전통이 생겼어요. 🎶'],
  ['임마누엘','land',30,'하나님이 함께하심','🤗|임마누엘|히브리어로 "하나님(엘)이 우리와 함께(임마누) 계신다"는 뜻이에요. 예수님을 부르는 또 다른 이름이에요.|이사야 선지자가 700년 전에 예언했어요: "보라 처녀가 잉태하여 아들을 낳을 것이요 그 이름을 임마누엘이라 하리라" (이사야 7:14) 예수님으로 이루어졌어요! ✨'],
  ['여호와 샬롬','land',20,'하나님의 평화','☮️|여호와 샬롬|"하나님은 평화이시다"라는 뜻이에요. 기드온이 하나님의 천사를 만난 곳에 세운 제단 이름이에요.|"샬롬"은 히브리어 인사말로 단순한 평화가 아니라 완전함, 번영, 행복, 건강을 모두 포함한 풍성한 평화예요. 이스라엘 사람들은 지금도 서로 "샬롬!"이라고 인사해요. 🕊️'],
  ['아멘','land',20,'네, 그렇습니다','🙏|아멘|히브리어로 "진실하다, 확실하다, 그렇습니다!"라는 뜻이에요. 기도 마칠 때 아멘 하는 이유가 바로 이것이에요.|예수님도 자주 "아멘 아멘 내가 너희에게 이르노니"라고 말씀하셨어요. 이것을 "진실로 진실로"라고 번역해요. 우리가 기도 끝에 아멘 하는 것은 "정말 그렇게 되기를 원해요!"라는 고백이에요. 💫'],
  ['세계여행','travel',0,'50달란트로 원하는 땅으로 이동','✈️|세계여행|50달란트를 내고 보드 위 어느 땅으로든 이동할 수 있어요! 전략적으로 사용하세요.|바울은 실제로 세 번의 선교 여행을 했어요. 소아시아, 유럽 등 약 2만 km를 여행하며 복음을 전했어요. 당시에는 배와 걸어서 이동했어요! 🗺️'],
  ['복음','land',20,'예수 그리스도의 죽으심과 부활','📣|복음|영어로 Gospel, 그리스어로 Euangelion(유앙겔리온). 모두 "기쁜 소식"이라는 뜻이에요!|복음의 핵심은 딱 4가지예요: 1) 예수님은 하나님의 아들이에요. 2) 우리 죄를 위해 죽으셨어요. 3) 무덤에 묻히셨어요. 4) 3일 만에 부활하셨어요! (고전 15:3-4) 🌟'],
  ['천국','land',30,'예수님을 믿는 사람들이 가는 곳','👑|천국|예수님을 믿는 사람들이 죽은 후 가는 영원한 기쁨의 나라예요. 눈물도 슬픔도 고통도 없어요!|요한계시록에는 천국이 황금으로 된 길, 12가지 보석으로 장식된 성벽, 언제나 환한 빛이 가득한 곳으로 묘사돼 있어요. 하나님과 영원히 함께하는 곳이에요. 🌈'],
  ['황금열쇠','chance',0,'예상하지 못한 은혜의 카드','🗝️|황금열쇠|어떤 카드가 나올지 두근두근! 하나님의 은혜는 언제나 예상을 뛰어넘어요.|성경에 "열쇠"는 권위와 능력을 상징해요. 예수님이 베드로에게 "천국 열쇠"를 주셨다고 했어요! (마태복음 16:19)'],
  ['알파와 오메가','land',20,'처음과 나중','🔤|알파와 오메가|그리스 알파벳의 첫 글자(Α)와 마지막 글자(Ω)예요. 하나님이 모든 것의 시작이자 끝이시라는 뜻이에요!|요한계시록 1장 8절에 하나님이 직접 말씀하세요: "나는 알파와 오메가라. 이제도 있고 전에도 있었고 장차 올 자요 전능한 자라." 하나님은 영원하세요. ♾️'],
  ['예수','land',30,'자기 백성을 죄에서 구원할 자','✨|예수|히브리어 이름 "여호수아"에서 온 이름이에요. "하나님(야)은 구원(샤아)이시다"라는 뜻이에요!|예수님은 약 2,000년 전 이스라엘 베들레헴에서 태어나 33년을 사셨어요. 기적을 행하시고, 죽으시고, 부활하셨어요. 오늘날 전 세계 20억 명이 예수님을 믿어요! 🌏'],
  ['그리스도','land',20,'기름 부음 받은 자','👑|그리스도|그리스어로 "기름 부음 받은 자"라는 뜻이에요. 히브리어로는 "메시아(Messiah)"예요!|옛날 이스라엘에서는 왕, 제사장, 선지자를 세울 때 머리에 기름을 부었어요. 예수님은 이 세 가지 역할을 모두 하신 완전한 분이에요. 그래서 "예수 그리스도"는 이름+칭호예요. ✝️'],
  ['성경 퀴즈','quiz',0,'함께 말씀을 기억해요','📖|성경 퀴즈|성경 말씀을 얼마나 알고 있나요? 정답을 맞히면 10달란트와 공동 별⭐을 획득해요!|성경은 66권으로 구성돼 있어요. 구약 39권, 신약 27권이에요. 약 40명의 저자가 1,500년에 걸쳐 기록했어요. 세계에서 가장 많이 팔린 책이에요! 📚'],
];

const questions = [
  ['예수님의 열두 제자 중 물 위를 걸었던 사람은 누구일까요?', '베드로'],
  ['아브라함과 사라의 아들은 누구일까요?', '이삭'],
  ['성령의 열매는 모두 몇 가지일까요?', '9'],
  ['천지 창조 둘째 날에 창조된 것은 무엇일까요?', '하늘'],
  ['이스라엘 백성을 애굽에서 이끈 지도자는 누구일까요?', '모세'],
  ['예수님이 오천 명을 먹이실 때 사용한 물고기는 몇 마리였나요?', '2'],
  ['노아의 방주에서 처음으로 내보낸 새는 무엇인가요?', '까마귀'],
  ['예수님이 세례를 받으신 강의 이름은?', '요단'],
  ['아담의 갈빗대로 만들어진 사람은 누구인가요?', '하와'],
  ['골리앗을 이긴 소년의 이름은?', '다윗'],
  ['요나가 물고기 뱃속에 있었던 날은 몇 밤인가요?', '3'],
  ['시편은 총 몇 편인가요?', '150'],
  ['창세기 1장 1절의 첫 단어는 무엇인가요?', '태초'],
  ['예수님의 어머니 이름은 무엇인가요?', '마리아'],
  ['세례 요한의 아버지 이름은?', '사가랴'],
  ['다니엘의 세 친구 중 한 명의 이름을 말해 보세요.', '사드락'],
  ['예수님이 돌아가시고 사흘 만에 일어난 일은?', '부활'],
  ['성경에서 가장 짧은 구절은 어디 있는 "예수께서 눈물을 흘리시더라"?', '요한복음'],
  ['솔로몬이 하나님께 구한 것은 무엇인가요?', '지혜'],
  ['하나님이 모세에게 불타는 떨기나무로 나타나신 산 이름은?', '호렙'],
  ['예수님의 열두 제자 중 예수님을 판 사람은 누구인가요?', '유다'],
  ['오병이어에서 오(五)는 무엇을 가리키나요?', '빵'],
];

const chanceCards = [
  ['축복의 씨앗', '10달란트를 받습니다.', p => p.money += 10],
  ['선한 이웃', '가장 적은 달란트를 가진 팀에게 5달란트를 나누고, 나도 10달란트를 받습니다.', null],
  ['광야 탈출권', '광야에 갇혔을 때 한 번 즉시 나올 수 있습니다.', p => p.items.push('광야 탈출권')],
  ['은혜의 길', '원하는 땅으로 이동할 수 있는 이동권을 받습니다.', p => p.items.push('원하는 땅 이동권')],
  ['건물 축복', '내 땅 하나의 건물을 무료로 한 단계 올립니다.', p => p.items.push('무료 건물권')],
  ['두 배 감사', '15달란트를 받습니다. 하나님의 은혜는 넘칩니다!', p => p.money += 15],
  ['통행료 면제권', '다음에 통행료를 내지 않아도 됩니다.', p => p.items.push('통행료 면제권')],
  ['한 번 더 주사위', '이번 턴 주사위를 한 번 더 굴릴 수 있습니다.', p => p.items.push('한 번 더 주사위')],
  ['공동체 기부', '나는 5달란트를 내지만, 모든 팀이 3달란트씩 받습니다.', null],
  ['말씀의 능력', '모든 팀이 공동 별표를 하나 획득합니다. 5달란트를 받습니다.', p => p.money += 5],
];

const miniGames = ['팀원 전원이 다윗의 수금을 연주하는 모습을 5초 동안 표현하세요.', '성경 인물 한 명을 몸으로 표현하고 팀원이 맞혀 보세요.', '함께 하나님은 사랑이시라를 큰 소리로 외쳐 보세요.', '팀원 모두가 서로에게 축복의 한마디를 해 주세요.', '아는 찬양 한 소절을 함께 불러 보세요.', '다 같이 성경책 한 구절을 외워 보세요.'];

function code() { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
function roomData(room) { return { ...room, board, serverTime: Date.now() }; }
function getPlayer(room, id) { return room.players.find(p => p.id === id); }
function active(room) { return room.players[room.turn % room.players.length]; }
function log(room, message) { room.log.unshift({ message, time: new Date().toLocaleTimeString('ko-KR') }); room.log = room.log.slice(0, 20); }
function newRoom(hostName, mode='online', count=1, avatar='🦁', startMoney=60) {
  const sm = Math.max(20, Math.min(200, Number(startMoney)||60));
  const room = { id: code(), started:false, finished:false, hostId:crypto.randomUUID(), players:[], turn:0, log:[], winner:null, mode, tabletop:mode==='tabletop', duration:25, endsAt:null, sharedStars:0, sharedGoal:12 };
  room.players.push({ id:room.hostId, name:hostName || '방장', avatar, money:sm, position:0, lands:[], items:[], desertTurns:0, color:'#ee6c4d', quizWins:0, miniWins:0, sharing:0 });
  const extra = mode==='solo' ? 3 : mode==='tabletop' ? Math.max(1, Math.min(4, Number(count)||3)-1) : 0;
  const colors=['#3d5a80','#2a9d8f','#e9c46a','#9b5de5'];
  const avatars=['🐻','🦊','🐼','🐯'];
  for(let i=0;i<extra;i++) room.players.push({ id:crypto.randomUUID(), name:mode==='solo'?`자동 탐험팀 ${i+1}`:`${i+2}팀`, avatar:avatars[i]||'🐨', money:sm, position:0, lands:[], items:[], desertTurns:0, color:colors[i], bot:mode==='solo' });
  log(room, '게임 방이 만들어졌습니다.'); rooms.set(room.id, room); return room;
}
function nextTurn(room) { room.turn = (room.turn + 1) % room.players.length; }
function takeBotTurns(room) {
  let safety=0;
  while(active(room)?.bot && safety++<24) {
    const bot=active(room);
    action(room,bot,'roll',{});
    if(!bot.canAct) continue;
    const space=board[bot.position]; const owner=room.players.find(p=>p.lands.some(l=>l.idx===bot.position));
    if(space[1]==='land' && !owner && bot.money>=space[2]) action(room,bot,'buy',{});
    else if(space[1]==='land' && owner && owner.id!==bot.id) action(room,bot,'pay',{});
    else if(space[1]==='chance') action(room,bot,'chance',{});
    bot.question=null;
    action(room,bot,'end',{});
  }
}
function action(room, player, type, body) {
  if (!room.started || room.winner || room.finished) throw Error('진행 중인 게임이 아닙니다.');
  if (active(room).id !== player.id) throw Error('아직 내 차례가 아닙니다.');
  if (type === 'roll') {
    if (player.desertTurns > 0) { player.desertTurns--; log(room, `${player.name} 팀은 광야에서 머뭅니다.`); nextTurn(room); return; }
    const a = 1 + Math.floor(Math.random()*6), b = 1 + Math.floor(Math.random()*6); const steps=a+b;
    const before=player.position; player.position=(before+steps)%board.length; if (player.position < before || (before===0 && steps>0 && player.position!==0)) { if(player.position<=before+steps-board.length && before+steps>=board.length){player.money += 20; log(room, `${player.name} 팀이 출발지를 지나 20달란트를 받았습니다.`);} }
    if(player.position < before) { player.money += 20; log(room, `${player.name} 팀이 출발지를 지나 20달란트를 받았습니다.`); }
    const space=board[player.position]; log(room, `${player.name} 팀이 주사위 ${a}+${b}=${steps}, ${space[0]}에 도착했습니다.`);
    player.lastRoll=[a,b]; player.canAct=true; if (space[1] === 'desert') { player.desertTurns = 2; log(room, `${player.name} 팀은 광야에서 두 턴을 쉽니다.`); } if (a===b) player.bonus=true;
  } else if (type === 'buy') {
    const idx=player.position, space=board[idx]; if(space[1] !== 'land' || room.players.some(p=>p.lands.some(l=>l.idx===idx))) throw Error('구입할 수 없는 땅입니다.');
    if(player.money<space[2]) throw Error('달란트가 부족합니다.'); player.money-=space[2]; player.lands.push({idx, buildings:0}); log(room, `${player.name} 팀이 ${space[0]}을(를) 구입했습니다.`);
  } else if (type === 'build') {
    const land=player.lands.find(l=>l.idx===player.position); if(!land || land.buildings>=3) throw Error('이 땅에는 더 지을 수 없습니다.'); if(player.money<5) throw Error('건설비 5달란트가 필요합니다.'); player.money-=5; land.buildings++; log(room, `${player.name} 팀이 ${board[land.idx][0]}에 건물을 세웠습니다.`);
  } else if (type === 'pay') {
    const idx=player.position, lowner=room.players.find(p=>p.lands.some(l=>l.idx===idx)); if(!lowner || lowner.id===player.id) throw Error('통행료 대상이 아닙니다.');
    if(player.skipFee) { player.skipFee=false; log(room, `${player.name} 팀이 통행료 면제권으로 통행료를 면제받았습니다!`); }
    else { const land=lowner.lands.find(l=>l.idx===idx), fee=5+land.buildings*5; const paid=Math.min(player.money,fee); player.money-=paid; lowner.money+=paid; log(room, `${player.name} 팀이 ${lowner.name} 팀에게 통행료 ${paid}달란트를 냈습니다.`); }
  } else if (type === 'chance') {
    const card=chanceCards[Math.floor(Math.random()*chanceCards.length)];
    if(card[2]) { card[2](player); }
    else if(card[0]==='선한 이웃') { const target=[...room.players].sort((a,b)=>a.money-b.money)[0]; if(target && target.id!==player.id && player.money>=5){player.money-=5; target.money+=5;} player.money+=10; }
    else if(card[0]==='공동체 기부') { if(player.money>=5){ player.money-=5; room.players.forEach(p=>{ if(p.id!==player.id) p.money+=3; }); player.money+=3; } }
    else if(card[0]==='말씀의 능력') { room.sharedStars=(room.sharedStars||0)+1; player.money+=5; }
    player.card=card.slice(0,2); log(room, `${player.name} 팀: ${card[0]} - ${card[1]}`);
  } else if (type === 'quiz') { const q=questions[Math.floor(Math.random()*questions.length)]; player.question=q; log(room, `${player.name} 팀이 퀴즈에 도전합니다.`); }
  else if (type === 'travel') { const target=Number(body.target); if (!Number.isInteger(target) || target < 0 || target >= board.length) throw Error('이동할 땅을 선택해 주세요.'); if (player.money < 50) throw Error('세계여행에는 50달란트가 필요합니다.'); player.money -= 50; player.position = target; log(room, `${player.name} 팀이 세계여행으로 ${board[target][0]}에 도착했습니다.`); }
  else if (type === 'answer') {
    if(!player.question) throw Error('현재 풀 퀴즈가 없습니다.');
    const ok=(body.answer||'').trim().replaceAll(' ','').includes(player.question[1].replaceAll(' ',''));
    if(ok){ player.money+=10; player.quizWins=(player.quizWins||0)+1; room.sharedStars=(room.sharedStars||0)+1; log(room, `${player.name} 팀 정답! 10달란트를 받고 ⭐공동 별을 획득했습니다.`); }
    else log(room, `${player.name} 팀 아쉽지만 다음 기회에! 정답: ${player.question[1]}`);
    player.question=null;
  }
  else if (type === 'useItem') {
    const itemName = body.item;
    const idx = player.items.indexOf(itemName);
    if(idx === -1) throw Error('해당 아이템이 없습니다.');
    if(itemName === '광야 탈출권') {
      player.items.splice(idx,1); player.desertTurns=0;
      log(room, `${player.name} 팀이 광야 탈출권을 사용해 광야에서 탈출했습니다!`);
    } else if(itemName === '원하는 땅 이동권' || itemName === '축복의 이동권') {
      const target=Number(body.target); if(!Number.isInteger(target)||target<0||target>=board.length) throw Error('이동할 땅 번호를 선택해 주세요.');
      player.items.splice(idx,1); player.position=target;
      log(room, `${player.name} 팀이 이동권으로 ${board[target][0]}에 도착했습니다.`);
    } else if(itemName === '무료 건물권') {
      const land=player.lands.find(l=>l.idx===player.position); if(!land||land.buildings>=3) throw Error('현재 위치에 건물을 더 지을 수 없습니다.');
      player.items.splice(idx,1); land.buildings++;
      log(room, `${player.name} 팀이 무료 건물권으로 ${board[land.idx][0]}에 건물을 세웠습니다!`);
    } else if(itemName === '통행료 면제권') {
      player.items.splice(idx,1); player.skipFee=true;
      log(room, `${player.name} 팀이 통행료 면제권을 준비했습니다. 다음 통행료를 면제받습니다.`);
    } else if(itemName === '한 번 더 주사위') {
      player.items.splice(idx,1); player.bonus=true;
      log(room, `${player.name} 팀이 한 번 더 주사위 아이템을 사용했습니다!`);
    } else {
      throw Error('사용 방법을 모르는 아이템입니다. 교사에게 문의하세요.');
    }
  }
  else if (type === 'end') { player.canAct=false; player.card=null; if(player.bonus){player.bonus=false; log(room, `${player.name} 팀이 더블을 던져 한 번 더 합니다.`)} else { nextTurn(room); takeBotTurns(room); } }
  else throw Error('알 수 없는 요청입니다.');
}

function send(res, status, data) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}); res.end(JSON.stringify(data)); }
const server=http.createServer((req,res)=>{
  const url=new URL(req.url, `http://${req.headers.host}`);
  if(req.method==='GET' && url.pathname==='/api/room') { const r=rooms.get(url.searchParams.get('id')); return r?send(res,200,roomData(r)):send(res,404,{error:'방을 찾을 수 없습니다.'}); }
  if(req.method==='POST' && url.pathname.startsWith('/api/')) { let raw=''; req.on('data',d=>raw+=d); req.on('end',()=>{ try { const body=raw?JSON.parse(raw):{};
    if(url.pathname==='/api/create'){ const r=newRoom(body.name, body.mode, body.count, body.avatar, body.startMoney); if(body.duration) r.duration=Math.max(5,Math.min(60,Number(body.duration))); return send(res,200,{room:roomData(r),playerId:r.hostId}); }
    const r=rooms.get(body.roomId); if(!r) return send(res,404,{error:'방을 찾을 수 없습니다.'});
    if(url.pathname==='/api/join'){ if(r.started) throw Error('이미 시작된 게임입니다.'); if(r.players.length>=6) throw Error('방이 가득 찼습니다.'); const avatarList=['🦁','🐻','🦊','🐼','🐯','🐨']; const p={id:crypto.randomUUID(),name:(body.name||'참여자').slice(0,12),avatar:body.avatar||avatarList[r.players.length]||'🐨',money:r.players[0]?.money||60,position:0,lands:[],items:[],desertTurns:0,color:['#3d5a80','#2a9d8f','#e9c46a','#9b5de5','#e76f51'][r.players.length-1],quizWins:0}; r.players.push(p); log(r,`${p.name} 팀이 참여했습니다.`); return send(res,200,{room:roomData(r),playerId:p.id}); }
    if(url.pathname==='/api/start'){ if(body.playerId!==r.hostId) throw Error('방장만 시작할 수 있습니다.'); if(r.mode==='online' && r.players.length<2) throw Error('두 팀 이상 참여해야 합니다.'); r.started=true; r.endsAt=Date.now()+r.duration*60000; log(r,'게임을 시작합니다!'); return send(res,200,roomData(r)); }
    if(url.pathname==='/api/finish'){ if(body.playerId!==r.hostId) throw Error('방장만 종료할 수 있습니다.'); r.finished=true; r.winner=[...r.players].sort((a,b)=>(b.money+b.lands.length*20)-(a.money+a.lands.length*20))[0]?.id; log(r,'게임을 마치고 시상식을 시작합니다.'); return send(res,200,roomData(r)); }
    if(url.pathname==='/api/action'){ const p=r.tabletop && body.playerId===r.hostId ? active(r) : getPlayer(r,body.playerId); if(!p) throw Error('참여자를 찾을 수 없습니다.'); action(r,p,body.type,body); return send(res,200,roomData(r)); }
    return send(res,404,{error:'요청을 찾을 수 없습니다.'});
  } catch(e){ send(res,400,{error:e.message}); }}); return; }
  let file=url.pathname==='/' ? '/index.html' : url.pathname; file=path.normalize(path.join(__dirname,'public',file)); if(!file.startsWith(path.join(__dirname,'public'))) return send(res,403,{error:'금지됨'});
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data);});
});
server.listen(PORT, '0.0.0.0', ()=>console.log(`달란트마블 실행 중: http://localhost:${PORT}`));
