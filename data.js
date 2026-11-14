/* 列印即玩桌遊產生器：題材包＋引擎（瀏覽器掛在 window.PGM，node 可 require）
   題材包內容由本工具自行撰寫，僅供教學練習。 */
(function(root){
'use strict';

/* ---------- 內建題材包 ----------
   cats：類別（最多 9 個）；items：{c:類別索引, t:名詞, d:說明, q:題目(選填), a:答案(選填)}；steps：流程（依正確順序）
   qmode：'cat' 骰子問答自動出「屬於哪一類」，'def' 自動出「什麼是…」 */
var PACKS = [
  {id:'swot', ic:'🧭', name:'SWOT 分析', sub:'以「社區咖啡店」為例', qmode:'cat',
   cats:[{n:'優勢 S', ic:'💪'}, {n:'劣勢 W', ic:'🩹'}, {n:'機會 O', ic:'🌱'}, {n:'威脅 T', ic:'⚡'}],
   items:[
    {c:0, t:'老闆自己烘豆', d:'內部、有利：品質能自己掌控'}, {c:0, t:'熟客多、口碑好', d:'內部、有利：穩定的回頭客'}, {c:0, t:'店面租約還有五年', d:'內部、有利：成本可預期'}, {c:0, t:'有咖啡師證照', d:'內部、有利：專業可信'}, {c:0, t:'自家烘焙甜點', d:'內部、有利：別家買不到'}, {c:0, t:'空間有插座和大桌', d:'內部、有利：適合久坐工作'},
    {c:1, t:'只有一位咖啡師', d:'內部、不利：請假就難營業'}, {c:1, t:'沒有官網和社群', d:'內部、不利：新客找不到你'}, {c:1, t:'座位只有 12 席', d:'內部、不利：尖峰容納不下'}, {c:1, t:'不會看財務報表', d:'內部、不利：賺賠不清楚'}, {c:1, t:'店在巷子裡沒招牌', d:'內部、不利：路過的人看不到'}, {c:1, t:'沒有外帶杯包裝', d:'內部、不利：外帶生意做不了'},
    {c:2, t:'附近新蓋辦公大樓', d:'外部、有利：上班族客群增加'}, {c:2, t:'外送平台普及', d:'外部、有利：不用增加座位也能賣'}, {c:2, t:'精品咖啡越來越流行', d:'外部、有利：願意付高價的人變多'}, {c:2, t:'區公所辦市集', d:'外部、有利：免費曝光機會'}, {c:2, t:'遠距工作的人變多', d:'外部、有利：平日白天有人來'}, {c:2, t:'咖啡豆禮盒送禮風氣', d:'外部、有利：節日多一條收入'},
    {c:3, t:'咖啡豆國際價格上漲', d:'外部、不利：成本變高'}, {c:3, t:'對面開了連鎖咖啡', d:'外部、不利：客人被分走'}, {c:3, t:'房東考慮賣房子', d:'外部、不利：可能被迫搬家'}, {c:3, t:'超商咖啡越來越好喝', d:'外部、不利：便宜的替代品'}, {c:3, t:'基本工資調漲', d:'外部、不利：人事成本增加'}, {c:3, t:'颱風季來客驟減', d:'外部、不利：營收不穩定'}
   ],
   steps:{title:'做一份 SWOT', list:['決定要分析的對象與目的', '盤點內部的優勢與劣勢', '掃描外部的機會與威脅', '交叉配對出 SO／WO／ST／WT 策略', '排出最先執行的策略', '每季回頭檢查是否要更新']}},

  {id:'4p', ic:'🛍️', name:'行銷 4P', sub:'產品、價格、通路、推廣', qmode:'cat',
   cats:[{n:'產品', ic:'🎁'}, {n:'價格', ic:'🏷️'}, {n:'通路', ic:'🚚'}, {n:'推廣', ic:'📣'}],
   items:[
    {c:0, t:'包裝設計', d:'產品給人的第一印象'}, {c:0, t:'品質保固', d:'讓客人買得安心'}, {c:0, t:'產品線長短', d:'要賣幾種款式、口味'}, {c:0, t:'品牌名稱', d:'讓人記得住、說得出口'}, {c:0, t:'售後服務', d:'買完之後的照顧'}, {c:0, t:'規格尺寸', d:'大中小杯、容量重量'},
    {c:1, t:'早鳥優惠', d:'提早買的人比較便宜'}, {c:1, t:'組合價', d:'一起買比分開買划算'}, {c:1, t:'尾數定價', d:'訂 199 而不是 200'}, {c:1, t:'會員價', d:'加入會員才有的價格'}, {c:1, t:'分期付款', d:'降低一次付清的壓力'}, {c:1, t:'第二件半價', d:'鼓勵一次多買'},
    {c:2, t:'實體門市', d:'客人可以摸得到、試得到'}, {c:2, t:'電商平台', d:'全台都買得到'}, {c:2, t:'經銷商', d:'請別人幫你鋪貨'}, {c:2, t:'外送平台', d:'送到客人家門口'}, {c:2, t:'自動販賣機', d:'24 小時無人銷售'}, {c:2, t:'品牌官網', d:'自己的店，不用被抽成'},
    {c:3, t:'社群貼文', d:'經營粉絲、天天曝光'}, {c:3, t:'網紅業配', d:'借別人的粉絲說話'}, {c:3, t:'試吃活動', d:'先嚐再買，降低門檻'}, {c:3, t:'集點卡', d:'讓客人一直回來'}, {c:3, t:'新聞稿', d:'讓媒體幫你報導'}, {c:3, t:'關鍵字廣告', d:'有人搜尋就出現'}
   ],
   steps:{title:'寫一份行銷企劃', list:['設定這次的行銷目標', '找出目標客群', '決定產品賣點', '訂出價格策略', '選擇銷售通路', '規劃推廣活動與預算', '執行並追蹤成效']}},

  {id:'finance', ic:'💰', name:'創業財務名詞', sub:'看懂損益與現金', qmode:'def',
   cats:[{n:'收入', ic:'🧾'}, {n:'成本', ic:'💸'}, {n:'獲利', ic:'📈'}, {n:'現金', ic:'💰'}],
   items:[
    {c:0, t:'營業收入', d:'賣東西收到的總金額'}, {c:0, t:'客單價', d:'平均每位客人花多少錢'}, {c:0, t:'來客數', d:'一段時間有多少客人上門'}, {c:0, t:'回購率', d:'買過的人再回來買的比例'},
    {c:1, t:'固定成本', d:'不管賣多少都要付，例如房租'}, {c:1, t:'變動成本', d:'賣越多花越多，例如食材'}, {c:1, t:'人事成本', d:'薪水加上勞健保等雇主負擔'}, {c:1, t:'開辦費', d:'開店前一次花掉的錢'},
    {c:2, t:'毛利', d:'營收減掉商品成本'}, {c:2, t:'毛利率', d:'毛利占營收的百分比'}, {c:2, t:'淨利', d:'扣掉所有費用後真正賺的'}, {c:2, t:'損益兩平點', d:'剛好不賺不賠的營業額'},
    {c:3, t:'現金流量', d:'一段時間實際進出的現金'}, {c:3, t:'應收帳款', d:'東西賣了、錢還沒收到'}, {c:3, t:'預備金', d:'撐過淡季的安全存款'}, {c:3, t:'投資回收期', d:'多久才能把本錢賺回來'}
   ],
   steps:{title:'每個月結一次帳', list:['整理這個月的發票與收據', '加總營業收入', '分出固定成本與變動成本', '算出毛利與淨利', '對照銀行帳戶的現金', '和上個月、去年同月比較', '決定下個月要調整什麼']}},

  {id:'shop', ic:'🏪', name:'開一家店的流程', sub:'從想法到開幕', qmode:'cat',
   cats:[{n:'規劃', ic:'📝'}, {n:'手續', ic:'📋'}, {n:'店面', ic:'🔨'}, {n:'開幕', ic:'🎉'}],
   items:[
    {c:0, t:'市場調查', d:'看附近有誰、缺什麼'}, {c:0, t:'估算開店預算', d:'裝潢、設備、周轉金'}, {c:0, t:'損益試算', d:'每月要賣多少才不賠'}, {c:0, t:'決定店型與定位', d:'賣什麼、賣給誰'},
    {c:1, t:'公司或行號登記', d:'選擇組織型態並登記'}, {c:1, t:'稅籍登記', d:'向國稅局辦理'}, {c:1, t:'員工加保', d:'請人就要辦勞健保'}, {c:1, t:'行業特殊許可', d:'例如食品業者登錄'},
    {c:2, t:'簽租約', d:'看清楚租期與修繕責任'}, {c:2, t:'裝潢施工', d:'注意消防與建築法規'}, {c:2, t:'採購設備', d:'比價、保固、交貨時間'}, {c:2, t:'招牌與門面', d:'讓路人一眼看懂'},
    {c:3, t:'試營運', d:'先找親友練習流程'}, {c:3, t:'開幕活動', d:'吸引第一波客人'}, {c:3, t:'社群開張公告', d:'讓大家知道你開了'}, {c:3, t:'記帳與檢討', d:'開幕後每天看數字'}
   ],
   steps:{title:'開店時間軸', list:['想清楚賣什麼、賣給誰', '做市場調查與損益試算', '準備資金或申請貸款', '找店面、簽租約', '辦理登記與稅籍', '裝潢與採購設備', '招募與訓練員工', '試營運', '正式開幕', '每月檢討數字']}},

  {id:'prompt', ic:'🤖', name:'AI 提示詞六要素', sub:'寫出好用的提示詞', qmode:'cat',
   cats:[{n:'角色', ic:'🎭'}, {n:'任務', ic:'🎯'}, {n:'背景', ic:'📚'}, {n:'格式', ic:'📐'}, {n:'限制', ic:'🚧'}, {n:'範例', ic:'🧩'}],
   items:[
    {c:0, t:'你是資深行銷顧問', d:'讓 AI 用專家的角度回答'}, {c:0, t:'請扮演挑剔的評審', d:'讓 AI 幫你找缺點'}, {c:0, t:'你是國小老師', d:'用簡單的話解釋'},
    {c:1, t:'幫我寫三則貼文', d:'說清楚要做什麼'}, {c:1, t:'比較兩個方案的優缺點', d:'明確的動作'}, {c:1, t:'把這段話改得更口語', d:'要 AI 改寫'},
    {c:2, t:'我們是社區咖啡店', d:'提供 AI 不知道的資訊'}, {c:2, t:'客人多是附近上班族', d:'說明對象是誰'}, {c:2, t:'下週要辦週年慶', d:'說明時間與情境'},
    {c:3, t:'用表格呈現', d:'規定輸出的樣子'}, {c:3, t:'條列五點', d:'規定數量與形式'}, {c:3, t:'每則不超過 100 字', d:'規定長度'},
    {c:4, t:'不要使用專有名詞', d:'告訴 AI 不能做什麼'}, {c:4, t:'不可以誇大療效', d:'避免違法或不實'}, {c:4, t:'只用繁體中文', d:'限定語言'},
    {c:5, t:'參考這篇貼文的語氣', d:'給 AI 一個樣本'}, {c:5, t:'像這樣：早安！今天…', d:'示範開頭'}, {c:5, t:'這是我們上次的好評文', d:'讓 AI 模仿成功案例'}
   ],
   steps:{title:'寫一段提示詞', list:['先想清楚要 AI 幫你完成什麼', '指定 AI 扮演的角色', '交代背景與對象', '說明輸出格式與長度', '加上不能做的限制', '附上範例', '看結果，再補充修改']}},

  {id:'scam', ic:'🛡️', name:'防詐騙辨識', sub:'適合長輩與社區課程', qmode:'cat',
   cats:[{n:'假投資', ic:'📉'}, {n:'假網購', ic:'📦'}, {n:'假冒親友', ic:'👪'}, {n:'假客服', ic:'☎️'}],
   items:[
    {c:0, t:'老師帶你穩賺不賠', d:'保證獲利一定是詐騙'}, {c:0, t:'加入投資群組領飆股', d:'陌生群組報明牌'}, {c:0, t:'先匯保證金才能出金', d:'要你一直匯錢'}, {c:0, t:'名人推薦的投資 App', d:'冒用名人照片'},
    {c:1, t:'超低價名牌包', d:'便宜得不合理'}, {c:1, t:'請你私下 LINE 交易', d:'離開平台就沒有保障'}, {c:1, t:'貨到付款的不明包裹', d:'沒訂過就不要簽收付款'}, {c:1, t:'只收轉帳不能面交', d:'拿了錢就消失'},
    {c:2, t:'媽，我換新號碼了', d:'先打舊號碼確認'}, {c:2, t:'孫子出車禍急需錢', d:'情急要你保密匯款'}, {c:2, t:'朋友借錢只傳文字', d:'帳號可能被盜'}, {c:2, t:'自稱檢察官要監管帳戶', d:'公務機關不會這樣做'},
    {c:3, t:'設定錯誤要解除分期', d:'ATM 不能解除設定'}, {c:3, t:'點連結更新帳戶資料', d:'不明連結不要點'}, {c:3, t:'包裹地址錯誤請補運費', d:'假物流簡訊'}, {c:3, t:'銀行要你說驗證碼', d:'驗證碼不能給任何人'}
   ],
   steps:{title:'收到可疑訊息怎麼辦', list:['先停下來，不要馬上回覆', '不點連結、不給驗證碼', '打電話給本人或官方確認', '問家人或朋友的意見', '撥打 165 反詐騙專線', '提醒身邊的人']}}
];

/* ---------- 遊戲機制 ---------- */
var GAMES = {
  match:{ic:'🃏', n:'配對記憶', s:'翻牌找出名詞和說明', need:'至少 4 組「名詞＋說明」'},
  sort:{ic:'🗂️', n:'分類大挑戰', s:'把卡牌放到正確的類別', need:'至少 2 個類別，每類至少 2 張'},
  dice:{ic:'🎲', n:'骰子問答', s:'擲骰子決定類別、抽題目卡作答', need:'至少 2 個類別，至少 6 題'},
  order:{ic:'🔢', n:'流程排序', s:'把步驟卡排成正確順序', need:'至少 4 個步驟'},
  bingo:{ic:'🔲', n:'名詞賓果', s:'聽說明、圈名詞，連線就喊賓果', need:'名詞數量至少要等於格子數'},
  guess:{ic:'🗣️', n:'說給隊友猜', s:'不能說出卡上的字，讓隊友猜到名詞', need:'至少 8 個名詞'}
};
var GAME_ORDER = ['match', 'sort', 'dice', 'order', 'bingo', 'guess'];
var CAT_COLORS = ['#E4572E', '#2E86AB', '#3BA55C', '#F2A541', '#8E5DB2', '#17A398', '#D4477C', '#6B7A1F', '#5B6C8F'];
var SIZES = {poker:{n:'撲克牌（63×88mm）', w:63, h:88, cols:3, rows:3}, mini:{n:'小卡（44×63mm）', w:44, h:63, cols:4, rows:4}, big:{n:'大卡（88×126mm）', w:88, h:126, cols:2, rows:2}};

/* ---------- 工具 ---------- */
function hash(s){ var h = 2166136261 >>> 0; s = String(s); for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function rng(seed){ var a = hash(seed); return function(){ a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(a, r){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function clean(s, n){ return Array.from(String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, n || 80).join(''); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function clamp(v, lo, hi){ v = Math.round(+v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; }

// 題材包整理：去空白、截長度、類別索引合法、刪掉空項目
function normPack(p){
  p = p || {};
  var cats = (Array.isArray(p.cats) ? p.cats : []).map(function(c){ return {n:clean(c && c.n, 12), ic:clean(c && c.ic, 4)}; }).filter(function(c){ return c.n; }).slice(0, 9);
  var items = (Array.isArray(p.items) ? p.items : []).map(function(it){
    var c = +it.c; if(!(c >= 0 && c < cats.length)) c = cats.length ? 0 : -1;
    return {c:c, t:clean(it.t, 24), d:clean(it.d, 60), q:clean(it.q, 70), a:clean(it.a, 50)};
  }).filter(function(it){ return it.t; }).slice(0, 200);
  var st = p.steps && Array.isArray(p.steps.list) ? p.steps.list.map(function(s){ return clean(s, 40); }).filter(Boolean).slice(0, 20) : [];
  return {id:clean(p.id, 30) || 'custom', ic:clean(p.ic, 4) || '🎯', name:clean(p.name, 24) || '我的題材', sub:clean(p.sub, 30), qmode:p.qmode === 'def' ? 'def' : 'cat', cats:cats, items:items, steps:{title:clean(p.steps && p.steps.title, 24) || '流程', list:st}};
}
function catOf(pack, c){ return pack.cats[c] || {n:'', ic:''}; }
function questions(pack){
  return pack.items.map(function(it){
    if(it.q) return {c:it.c, q:it.q, a:it.a || it.t};
    var cat = catOf(pack, it.c);
    if(pack.qmode === 'cat' && cat.n) return {c:it.c, q:'「' + it.t + '」屬於哪一類？', a:cat.n + (it.d ? '：' + it.d : '')};
    return {c:it.c, q:it.d ? '「' + it.d + '」是指什麼？' : '說明「' + it.t + '」是什麼。', a:it.d ? it.t : '（請老師判斷）'};
  });
}

/* ---------- 每種遊戲：檢查＋做卡 ---------- */
var DEF = {match:{pairs:12}, sort:{perCat:6}, dice:{n:24, dice:2}, order:{sets:4}, bingo:{size:4, boards:8}, guess:{n:24}};
function opt(g, o){ var d = DEF[g], r = {}; Object.keys(d).forEach(function(k){ r[k] = o && o[k] != null ? +o[k] : d[k]; }); return r; }
function check(g, pack, o){
  o = opt(g, o);
  var withDef = pack.items.filter(function(it){ return it.d; }).length, nc = pack.cats.length;
  var perCat = pack.cats.map(function(_, i){ return pack.items.filter(function(it){ return it.c === i; }).length; });
  if(g === 'match') return withDef >= 4 ? '' : '需要至少 4 組有「說明」的名詞（目前 ' + withDef + '）';
  if(g === 'sort') return nc >= 2 && perCat.filter(function(n){ return n >= 2; }).length >= 2 ? '' : '需要至少 2 個類別、每類至少 2 張';
  if(g === 'dice') return nc >= 2 && pack.items.length >= 6 ? '' : '需要至少 2 個類別、6 題';
  if(g === 'order') return pack.steps.list.length >= 4 ? '' : '需要至少 4 個流程步驟（目前 ' + pack.steps.list.length + '）';
  if(g === 'bingo'){ var cells = o.size * o.size - (o.size === 5 ? 1 : 0); return pack.items.length >= cells ? '' : o.size + '×' + o.size + ' 賓果需要至少 ' + cells + ' 個名詞（目前 ' + pack.items.length + '）'; }
  if(g === 'guess') return pack.items.length >= 8 ? '' : '需要至少 8 個名詞';
  return '';
}
// 回傳 {cards:[...], dice:[...], boards:[...]}；卡片 {g, kind, c(類別或 -1), big, small, flip(倒著印的答案), tag, back}
function build(g, pack, o, seed){
  o = opt(g, o);
  var r = rng(seed + ':' + g), out = {cards:[], dice:[], boards:[]};
  var it = pack.items;
  if(g === 'match'){
    var ps = shuffle(it.filter(function(x){ return x.d; }), r).slice(0, clamp(o.pairs, 4, 40));
    ps.forEach(function(x, i){
      out.cards.push({g:g, kind:'term', c:x.c, big:x.t, small:'', tag:'名詞', pair:i + 1});
      out.cards.push({g:g, kind:'def', c:x.c, big:x.d, small:'', tag:'說明', pair:i + 1});
    });
  } else if(g === 'sort'){
    var used = [];
    pack.cats.forEach(function(cat, ci){
      var mine = shuffle(it.filter(function(x){ return x.c === ci; }), r).slice(0, clamp(o.perCat, 2, 20));
      if(mine.length < 1) return;
      used.push(ci);
      out.cards.push({g:g, kind:'cat', c:ci, big:cat.n, small:'類別卡', tag:'類別'});
      mine.forEach(function(x){ out.cards.push({g:g, kind:'item', c:-1, ac:ci, big:x.t, small:'', flip:'答案：' + cat.n, tag:'卡牌'}); });
    });
  } else if(g === 'dice'){
    var qs = shuffle(questions(pack), r).slice(0, clamp(o.n, 6, 120));
    qs.forEach(function(q){ out.cards.push({g:g, kind:'q', c:q.c, big:q.q, small:'', flip:'答案：' + q.a, tag:catOf(pack, q.c).n || '題目'}); });
    var faces = pack.cats.slice(0, 6).map(function(c, i){ return {ic:c.ic || '●', n:c.n, c:i}; });
    var extra = [{ic:'⭐', n:'任選類別', c:-1}, {ic:'🔁', n:'再擲一次', c:-1}, {ic:'🎁', n:'送分題', c:-1}, {ic:'⭐', n:'任選類別', c:-1}];
    while(faces.length < 6) faces.push(extra[(faces.length - pack.cats.length) % extra.length]);
    for(var d = 0; d < clamp(o.dice, 1, 6); d++) out.dice.push(faces);
  } else if(g === 'order'){
    var L = pack.steps.list;
    for(var s = 0; s < clamp(o.sets, 1, 12); s++){
      shuffle(L.map(function(t, i){ return i; }), r).forEach(function(i){ out.cards.push({g:g, kind:'step', c:-1, set:s + 1, big:L[i], small:'', flip:'第 ' + (i + 1) + ' 步', tag:'第 ' + (s + 1) + ' 組'}); });
    }
  } else if(g === 'bingo'){
    var size = clamp(o.size, 3, 5), cells = size * size, free = size === 5;
    var pool = it.map(function(x){ return x.t; });
    for(var b = 0; b < clamp(o.boards, 1, 60); b++){
      var pick = shuffle(pool, rng(seed + ':bingo:' + b)).slice(0, cells - (free ? 1 : 0));
      if(free) pick.splice(Math.floor(cells / 2), 0, '★ 免費');
      out.boards.push({size:size, cells:pick, no:b + 1});
    }
    shuffle(it, r).forEach(function(x){ out.cards.push({g:g, kind:'call', c:x.c, big:x.d || ('「' + x.t + '」'), small:'', flip:'答案：' + x.t, tag:'主持人卡'}); });
  } else if(g === 'guess'){
    shuffle(it, r).slice(0, clamp(o.n, 8, 120)).forEach(function(x){
      var bans = [catOf(pack, x.c).n].concat(Array.from(x.t).filter(function(ch){ return /[一-鿿]/.test(ch); }).slice(0, 2).map(function(ch){ return '「' + ch + '」字'; })).filter(Boolean);
      out.cards.push({g:g, kind:'guess', c:x.c, big:x.t, small:x.d, ban:bans, tag:'說給隊友猜'});
    });
  }
  return out;
}

/* ---------- 規則說明 ---------- */
function rules(g, pack, o){
  o = opt(g, o);
  var P = pack.name, nc = pack.cats.length;
  var R = {
    match:{players:'2～5 人', time:'15 分鐘', prep:['配對記憶卡 ' + (o.pairs * 2) + ' 張（名詞卡與說明卡各半）'],
      setup:['把卡牌洗勻，背面朝上排成方陣。'],
      play:['輪到的人翻開兩張卡。', '如果是「名詞」和它的「說明」，就收下這兩張，並再玩一次。', '不是一對就翻回去，換下一個人。', '翻到一對時，要先大聲唸出名詞和說明，其他人同意才算。'],
      win:['卡牌收完時，收最多對的人獲勝。'],
      tips:['程度較好的班級：配對成功後要再舉一個生活中的例子才能收牌。'],
      debrief:['哪一組名詞最容易搞混？為什麼？', '你最想在工作上用到的是哪一個？']},
    sort:{players:'2～6 人，或分組', time:'15～20 分鐘', prep:['類別卡 ' + nc + ' 張、卡牌若干（答案倒印在卡片下方）'],
      setup:['類別卡排成一列放在桌子中間。', '其他卡牌洗勻，平均發給每個人，答案那一面朝自己看不到的方向。'],
      play:['輪到的人出一張牌，放到他認為正確的類別下面，並說明理由。', '其他人可以喊「質疑！」，把卡片轉過來看倒印的答案。', '放對：出牌的人得 1 分；質疑的人錯了扣 1 分。放錯：牌收回手上。'],
      win:['最先出完手上卡牌的人獲勝；或時間到時分數最高者獲勝。'],
      tips:['同一張卡可能有爭議時，讓雙方各說 30 秒，由全班舉手決定，比答案更有學習效果。'],
      debrief:['哪一張卡最多人放錯？它為什麼容易被誤會？', '如果要你自己再寫一張卡，你會寫什麼？']},
    dice:{players:'2～6 人，或 2～6 隊', time:'20 分鐘', prep:['類別骰子 ' + o.dice + ' 顆（剪下摺好、用膠水黏）', '題目卡 ' + o.n + ' 張（答案倒印在下方）', '計分表'],
      setup:['題目卡依類別分堆（卡片上方有類別），背面朝上。'],
      play:['擲骰子，擲到哪一類，就由右手邊的人從那一堆抽一張唸題目。', '答對得 2 分；答錯的話，其他人可以搶答，搶對得 1 分。', '擲到「⭐ 任選類別」自己選一類；「🔁 再擲一次」重擲；「🎁 送分題」直接得 1 分。'],
      win:['題目抽完或時間到，分數最高的人（隊）獲勝。'],
      tips:['唸題目的人可以把答案用手遮住；答案倒著印，就是為了不小心被看到。'],
      debrief:['哪一類題目最難？', '有沒有哪一題答案你不同意？說說看。']},
    order:{players:'每組 3～5 人', time:'10 分鐘', prep:['流程卡 ' + o.sets + ' 組（每組 ' + pack.steps.list.length + ' 張，卡片右上角有組別）'],
      setup:['每組拿一疊同組別的流程卡，洗亂後背面朝上。'],
      play:['老師喊開始，各組把卡片翻開，排成正確的順序。', '排好就舉手，老師或其他組來檢查：把卡片翻過來看倒印的步驟編號。'],
      win:['最快全部排對的組獲勝；排錯一張加罰 10 秒。'],
      tips:['第二輪可以拿掉一張卡，讓各組猜「少了哪一步」。'],
      debrief:['哪兩個步驟最常被排反？', '真實情況下，有哪些步驟可以同時進行？']},
    bingo:{players:'全班（每人或每組一張）', time:'15 分鐘', prep:['賓果卡 ' + o.boards + ' 張（' + o.size + '×' + o.size + '，每張排列都不同）', '主持人卡 ' + pack.items.length + ' 張', '筆或小紙片'],
      setup:['每人拿一張賓果卡。主持人把主持人卡洗勻。'],
      play:['主持人抽一張卡，唸出上面的「說明」（不要唸答案）。', '大家想想是哪一個名詞，有的話就圈起來。', '主持人可以請一位同學說出答案，再公布正確答案（倒印在卡片下方）。'],
      win:['橫、直、斜任一條連成一線就喊「賓果！」，主持人核對後獲勝。可以繼續玩到兩條線、全滿。'],
      tips:['名詞越多、說明越精準，遊戲越有挑戰。主持人也可以讓學生輪流當。'],
      debrief:['哪一個說明最難聯想到名詞？', '有沒有兩個名詞很像，容易圈錯？']},
    guess:{players:'4 人以上，分兩隊', time:'15 分鐘', prep:['猜詞卡 ' + o.n + ' 張', '計時器（1 分鐘）'],
      setup:['兩隊各派一位「說明者」輪流上場。卡牌洗勻放中間。'],
      play:['說明者抽卡，只能自己看，用說的讓隊友猜出卡上的大字名詞。', '不可以說出名詞裡的字，也不能說卡片下方列出的「禁語」。', '猜對拿下這張牌，再抽下一張；可以喊「跳過」，但這張給對方隊。', '一分鐘到換對方上場。'],
      win:['卡牌用完時，拿到最多張的隊獲勝。'],
      tips:['卡片小字是說明，說明者卡住時可以參考，但不能照唸。'],
      debrief:['哪一個名詞最難說明？你怎麼換句話說？', '用自己的話解釋，跟背定義有什麼不同？']}
  }[g];
  R.title = GAMES[g].ic + ' ' + GAMES[g].n + '・' + P;
  return R;
}

/* ---------- 版面：每張 A4 放幾張卡 ---------- */
function pages(n, size){ var s = SIZES[size] || SIZES.poker, per = s.cols * s.rows; return Math.ceil(n / per); }
function chunk(a, n){ var o = []; for(var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
// 雙面列印（長邊翻頁）：背面每一列左右對調
function mirrorRow(cards, cols){ var out = []; chunk(cards, cols).forEach(function(row){ while(row.length < cols) row.push(null); out = out.concat(row.reverse()); }); return out; }

/* ---------- 貼上的文字 → 題材 ---------- */
// 每行：類別｜名詞｜說明｜題目｜答案（分隔可用 tab、|、｜、逗號）；「#流程」之後每行一步
function parseText(text, base){
  var lines = String(text || '').split(/\r?\n/), cats = [], items = [], steps = [], inSteps = false, title = '';
  lines.forEach(function(raw){
    var l = raw.trim(); if(!l) return;
    var m = /^#\s*(流程|步驟|steps?)\s*[:：]?\s*(.*)$/i.exec(l);
    if(m){ inSteps = true; title = m[2] || ''; return; }
    if(/^#/.test(l)) return;
    if(inSteps){ steps.push(l.replace(/^\d+[.、)）]\s*/, '')); return; }
    var p = l.split(/\t|｜|\|/); if(p.length < 2) p = l.split(/[,，]/);
    p = p.map(function(x){ return x.trim(); });
    if(/^(類別|分類|category)$/i.test(p[0]) && /^(名詞|項目|term)$/i.test(p[1] || '')) return; // 標題列
    var cn = p.length >= 2 ? p[0] : '', t = p.length >= 2 ? p[1] : p[0];
    if(!t) return;
    var ci = -1;
    if(cn){ ci = cats.findIndex(function(c){ return c.n === cn; }); if(ci < 0){ cats.push({n:cn, ic:''}); ci = cats.length - 1; } }
    items.push({c:ci, t:t, d:p[2] || '', q:p[3] || '', a:p[4] || ''});
  });
  if(!cats.length){ cats.push({n:'一般', ic:''}); items.forEach(function(x){ x.c = 0; }); }
  items.forEach(function(x){ if(x.c < 0) x.c = 0; });
  var b = base || {};
  return normPack({id:'custom', ic:b.ic, name:b.name, sub:b.sub, qmode:b.qmode, cats:cats, items:items, steps:{title:title || (b.steps && b.steps.title) || '流程', list:steps}});
}
function toText(pack){
  var L = ['類別｜名詞｜說明｜題目（選填）｜答案（選填）'];
  pack.items.forEach(function(it){ L.push([catOf(pack, it.c).n, it.t, it.d, it.q, it.a].join('｜').replace(/｜+$/, '')); });
  if(pack.steps.list.length){ L.push('', '#流程：' + pack.steps.title); pack.steps.list.forEach(function(s, i){ L.push((i + 1) + '. ' + s); }); }
  return L.join('\n');
}
// AI 回傳的 JSON → 題材（類別可用名稱或索引）
function fromJson(j){
  j = j || {};
  var cats = (j.cats || j.categories || []).map(function(c){ return typeof c === 'string' ? {n:c, ic:''} : {n:c.n || c.name, ic:c.ic || c.icon || ''}; });
  var items = (j.items || []).map(function(x){
    var c = x.c; if(typeof c !== 'number'){ var nm = x.c || x.cat || x.category; c = cats.findIndex(function(k){ return k.n === nm; }); if(c < 0 && nm){ cats.push({n:nm, ic:''}); c = cats.length - 1; } }
    return {c:c, t:x.t || x.term, d:x.d || x.def || x.desc, q:x.q || x.question, a:x.a || x.answer};
  });
  var st = j.steps; if(Array.isArray(st)) st = {title:j.stepsTitle || '流程', list:st};
  return normPack({id:'custom', ic:j.ic || j.icon, name:j.name || j.title, sub:j.sub, qmode:j.qmode, cats:cats, items:items, steps:st});
}
function aiPrompt(topic, aud, n){
  return '請幫我做一套課堂桌遊的題材，主題是「' + clean(topic, 60) + '」，對象是「' + (clean(aud, 30) || '一般成人學員') + '」。\n' +
    '要求：\n1. 分成 3～6 個類別（每個類別名稱 6 個字以內，附一個 emoji）。\n2. 每個類別 ' + (n || 6) + ' 個「名詞」（12 個字以內）＋一句「說明」（25 個字以內，用學員聽得懂的話）。\n3. 另外列出這個主題的 5～8 個「流程步驟」（依正確順序，每步 20 字以內）。\n4. 內容要正確，不要編造數據、法規條號或人名；不確定的就不要寫。\n5. 使用繁體中文（台灣用語）。\n' +
    '只輸出 JSON，不要其他文字，格式：\n{"name":"題材名稱","cats":[{"n":"類別","ic":"emoji"}],"items":[{"cat":"類別","t":"名詞","d":"說明"}],"stepsTitle":"流程名稱","steps":["第一步","第二步"]}';
}

var API = {PACKS:PACKS, GAMES:GAMES, GAME_ORDER:GAME_ORDER, CAT_COLORS:CAT_COLORS, SIZES:SIZES, DEF:DEF,
  hash:hash, rng:rng, shuffle:shuffle, clean:clean, clone:clone, clamp:clamp, normPack:normPack, catOf:catOf, questions:questions,
  opt:opt, check:check, build:build, rules:rules, pages:pages, chunk:chunk, mirrorRow:mirrorRow, parseText:parseText, toText:toText, fromJson:fromJson, aiPrompt:aiPrompt};
if(typeof module !== 'undefined' && module.exports) module.exports = API; else root.PGM = API;
})(typeof window !== 'undefined' ? window : globalThis);
