/* 列印即玩桌遊產生器：畫面 */
(function(){
'use strict';
var P = window.PGM, $ = function(id){ return document.getElementById(id); };
var PFX = 'pgm.';
var ONLINE = 'https://m255525.github.io/printable-game-maker/';
function lsGet(k){ try{ return localStorage.getItem(PFX + k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(PFX + k, v); }catch(e){} }
function lsDel(k){ try{ localStorage.removeItem(PFX + k); }catch(e){} }
function lsJson(k, d){ try{ var v = JSON.parse(lsGet(k)); return v == null ? d : v; }catch(e){ return d; } }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]; }); }
var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;

/* ---------- 狀態 ---------- */
var DEF_GAMES = {match:{on:true}, sort:{on:true}, dice:{on:false}, order:{on:false}, bingo:{on:false}, guess:{on:false}};
var S = Object.assign({src:'swot', pack:null, games:DEF_GAMES, style:{size:'poker', backs:false, bw:false, cut:true, rulesOn:true, score:true}, seed:'A1', tab:'pick'}, lsJson('state', {}));
S.games = Object.assign({}, P.clone(DEF_GAMES), S.games || {});
S.style = Object.assign({size:'poker', backs:false, bw:false, cut:true, rulesOn:true, score:true}, S.style || {});
if(!S.pack) S.pack = P.normPack(P.PACKS[0]); else S.pack = P.normPack(S.pack);
var MY = lsJson('mypacks', []);
function save(){ lsSet('state', JSON.stringify(S)); }

/* ---------- 共用 ---------- */
function openModal(h){ $('modalBox').innerHTML = h; $('modal').classList.add('show'); }
function closeModal(){ $('modal').classList.remove('show'); }
var toastT;
function toast(s){ var t = document.querySelector('.toast'); if(!t){ t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = s; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function(){ t.hidden = true; }, 2800); }
function copyText(s, ok){ var done = function(){ toast(ok || '已複製'); }; if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, function(){ fallbackCopy(s); done(); }); else { fallbackCopy(s); done(); } }
function fallbackCopy(s){ var t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch(e){} t.remove(); }
function colorOf(c){ return c >= 0 ? P.CAT_COLORS[c % P.CAT_COLORS.length] : '#5E6B63'; }
function lenClass(s){ var n = Array.from(String(s || '')).length; return n <= 5 ? 'l1' : n <= 10 ? 'l2' : n <= 22 ? 'l3' : 'l4'; }

/* ---------- 版面骨架 ---------- */
function render(){
  $('app').innerHTML = '<div class="top noprint"><h1>✂️ 列印即玩桌遊產生器 <small>課程題材變成紙上遊戲</small></h1>' +
    '<a class="ibtn" href="manual.html">📖 操作手冊</a><button class="ibtn" data-act="settings" aria-label="常用設定">⚙</button></div>' +
    '<p class="warn-line noprint">內建題材為教學示範，自己的題材請確認內容正確再發給學員。<button data-act="warn">⚠ 使用警語</button></p>' +
    '<div class="work"><div class="panel noprint" id="panel"></div><div class="pv"><div class="pvbar" id="pvbar"></div><div id="sheetsWrap"><div id="sheets"></div></div></div></div>' +
    footer();
  renderPanel(); renderSheets();
}
function footer(){
  return '<footer class="foot noprint">👤 創作者 Mark Tsai（蔡豐全）<a href="mailto:tsaimark@gmail.com">tsaimark@gmail.com</a><br><a href="manual.html">📖 操作手冊</a><a href="#" data-act="warn">⚠ 使用警語</a>' +
    (standalone ? '' : '<a href="#" data-act="install">📲 加入主畫面</a>') + '<a href="https://m255525.github.io/startup-island/" target="_blank" rel="noopener">🏝 創業島</a>' +
    '<br><img src="https://visitor-badge.laobi.icu/badge?page_id=m255525.printablegamemaker" alt="訪客次數" height="20" loading="lazy" style="vertical-align:middle;margin-top:.4rem"></footer>';
}

/* ---------- 左側：1 題材 ---------- */
function packCard(){
  var p = S.pack, nSteps = p.steps.list.length;
  var h = '<section class="card"><h2><span class="no">1</span>選題材</h2>' +
    '<div class="packs">' + P.PACKS.map(function(x){ return '<button class="pk" data-pack="' + x.id + '" aria-pressed="' + (S.src === x.id) + '"><b>' + x.ic + ' ' + esc(x.name) + '</b><small>' + esc(x.sub) + '</small></button>'; }).join('') +
    MY.map(function(x, i){ return '<button class="pk" data-my="' + i + '" aria-pressed="' + (S.src === 'my:' + i) + '"><b>' + esc(x.ic || '📁') + ' ' + esc(x.name) + '</b><small>我的題材</small></button>'; }).join('') + '</div>' +
    '<div class="stat"><span>' + esc(p.ic + ' ' + p.name) + '</span><span>' + p.cats.length + ' 類</span><span>' + p.items.length + ' 個名詞</span><span>流程 ' + nSteps + ' 步</span></div>' +
    '<div class="tabs" role="tablist">' + [['pick', '✏️ 編輯內容'], ['ai', '✨ 用 AI 產生'], ['save', '💾 存成我的題材']].map(function(t){ return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
  if(S.tab === 'pick'){
    h += '<p class="small">每行一個名詞：<b>類別｜名詞｜說明｜題目｜答案</b>（題目、答案可省略）。可以直接從 Excel 複製貼上。<b>#流程：</b>之後每行一個步驟。</p>' +
      '<label class="fld">題材名稱<input id="pName" maxlength="24" value="' + esc(p.name) + '"></label>' +
      '<textarea id="pText" rows="12" spellcheck="false">' + esc(P.toText(p)) + '</textarea>' +
      '<div class="row2"><label class="fld">骰子問答的題目<select id="pQmode"><option value="cat"' + (p.qmode === 'cat' ? ' selected' : '') + '>問「屬於哪一類」</option><option value="def"' + (p.qmode === 'def' ? ' selected' : '') + '>問「這是指什麼」</option></select></label></div>' +
      '<div class="go"><button class="btn" data-act="applyText">✔ 套用修改</button><button class="btn alt" data-act="resetPack">↺ 還原這個題材</button></div><p class="small" id="applyMsg"></p>';
  } else if(S.tab === 'ai'){
    var A = aiCfg();
    h += '<p class="small">輸入主題，AI 幫你列出類別、名詞、說明和流程。<b>沒有金鑰也能用</b>：複製提示詞貼到 ChatGPT、Gemini 或 Claude，再把結果貼回來。</p>' +
      '<label class="fld">主題<input id="aiTopic" maxlength="60" placeholder="例如：勞動基準法基本觀念、咖啡沖煮、時間管理" value="' + esc(lsGet('aiTopic') || '') + '"></label>' +
      '<div class="row2"><label class="fld">對象<input id="aiAud" maxlength="30" placeholder="例如：高職學生、社區長輩" value="' + esc(lsGet('aiAud') || '') + '"></label>' +
      '<label class="fld">每類幾個名詞<select id="aiN">' + [4, 6, 8].map(function(n){ return '<option' + (String(n) === (lsGet('aiN') || '6') ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="go"><button class="btn alt" data-act="aiCopy">📋 複製提示詞（免金鑰）</button><button class="btn" data-act="aiGo">✨ AI 直接產生</button></div>' +
      '<p class="small">AI 狀態：' + (aiReady() ? '✓ ' + esc(PROVIDERS[A.provider].label.replace(/（.*/, '') + '・' + aiModel(A)) : '還沒設定金鑰') + '　<a href="#" data-act="aiSettings">⚙ AI 設定</a></p><p class="small" id="aiMsg"></p>' +
      '<label class="fld">把 AI 的回答貼在這裡<textarea id="aiPaste" rows="6" placeholder="貼上 JSON，或「類別｜名詞｜說明」的表格都可以"></textarea></label>' +
      '<div class="go"><button class="btn" data-act="aiImport">⬇ 匯入成題材</button></div>' +
      '<p class="small">⚠ AI 可能寫錯，匯入後請到「✏️ 編輯內容」逐行檢查再列印。</p>';
  } else {
    h += '<p class="small">把目前的題材存在這台電腦的瀏覽器，下次直接點選。最多 30 個。</p>' +
      '<div class="go"><button class="btn" data-act="saveMy">💾 存成「' + esc(p.name) + '」</button>' + (/^my:/.test(S.src) ? '<button class="btn red" data-act="delMy">🗑 刪除這個我的題材</button>' : '') + '</div>' +
      '<div class="go"><button class="btn alt" data-act="exportPack">⬇ 下載題材檔（.json）</button><label class="btn alt" style="cursor:pointer">⬆ 開啟題材檔<input type="file" id="importFile" accept=".json,application/json,.txt,.csv,.tsv" hidden></label></div>' +
      '<p class="small">題材檔可以分享給其他老師；也可以開啟 .csv／.txt（同上面的表格格式）。</p>';
  }
  return h + '</section>';
}

/* ---------- 左側：2 遊戲 ---------- */
function optInput(g, k, lo, hi, label){ var o = P.opt(g, S.games[g].opt); return '<label>' + label + '<input type="number" data-gopt="' + g + '" data-k="' + k + '" min="' + lo + '" max="' + hi + '" value="' + o[k] + '"></label>'; }
function gamesCard(){
  var h = '<section class="card"><h2><span class="no">2</span>選遊戲（可以複選）</h2><div class="games">';
  P.GAME_ORDER.forEach(function(g){
    var G = P.GAMES[g], st = S.games[g], need = P.check(g, S.pack, st.opt), o = P.opt(g, st.opt);
    h += '<div class="gm' + (st.on ? ' on' : '') + '"><label class="hd"><input type="checkbox" data-game="' + g + '"' + (st.on ? ' checked' : '') + '><span class="gi">' + G.ic + '</span><span>' + G.n + '<span class="gs">' + G.s + '</span></span></label>';
    if(st.on){
      h += '<div class="opts">';
      if(g === 'match') h += optInput(g, 'pairs', 4, 40, '幾組');
      if(g === 'sort') h += optInput(g, 'perCat', 2, 20, '每類最多');
      if(g === 'dice') h += optInput(g, 'n', 6, 120, '題目卡') + optInput(g, 'dice', 1, 6, '骰子');
      if(g === 'order') h += optInput(g, 'sets', 1, 12, '幾組');
      if(g === 'bingo') h += '<label>大小<select data-gopt="bingo" data-k="size">' + [3, 4, 5].map(function(n){ return '<option value="' + n + '"' + (o.size === n ? ' selected' : '') + '>' + n + '×' + n + '</option>'; }).join('') + '</select></label>' + optInput(g, 'boards', 1, 60, '張數');
      if(g === 'guess') h += optInput(g, 'n', 8, 120, '張數');
      h += '</div>';
    }
    if(need) h += '<div class="need">⚠ ' + esc(need) + '</div>';
    h += '</div>';
  });
  return h + '</div></section>';
}

/* ---------- 左側：3 列印 ---------- */
function printCard(){
  var st = S.style, info = layout();
  var h = '<section class="card"><h2><span class="no">3</span>列印設定</h2>' +
    '<label class="fld">卡牌尺寸<select id="sSize">' + Object.keys(P.SIZES).map(function(k){ return '<option value="' + k + '"' + (st.size === k ? ' selected' : '') + '>' + P.SIZES[k].n + '・每頁 ' + P.SIZES[k].cols * P.SIZES[k].rows + ' 張</option>'; }).join('') + '</select></label>' +
    chk('backs', '印卡背（雙面列印用，背面自動左右對調）') + chk('bw', '黑白省墨模式') + chk('cut', '印裁切虛線') + chk('rulesOn', '每個遊戲附一頁規則與討論題') + chk('score', '附計分表') +
    '<div class="row2"><label class="fld">洗牌代碼<input id="sSeed" maxlength="8" value="' + esc(S.seed) + '"></label><div class="fld">&nbsp;<button class="btn alt" data-act="reseed" style="width:100%;margin-top:.15rem">🔀 重新洗牌</button></div></div>' +
    '<p class="small">同一個代碼＝同樣的卡牌順序與賓果排列。</p>' +
    (info.pages ? '<div class="alert ok">共 ' + info.pages + ' 頁 A4：' + info.parts.join('、') + '</div>' : '<div class="alert warn">還沒有可以列印的內容：請勾選遊戲，或補齊題材。</div>') +
    '<div class="go"><button class="btn or big" data-act="print"' + (info.pages ? '' : ' disabled') + '>🖨 列印／存成 PDF</button><button class="btn alt" data-act="printTips">📋 列印小提醒</button></div></section>';
  return h;
}
function chk(k, label){ return '<label class="chk"><input type="checkbox" data-style="' + k + '"' + (S.style[k] ? ' checked' : '') + '>' + label + '</label>'; }
function renderPanel(){ var el = $('panel'); if(el) el.innerHTML = packCard() + gamesCard() + printCard(); }

/* ---------- 版面計算 ---------- */
var LAST = null;
function layout(){
  var pack = S.pack, out = [], parts = [], st = S.style;
  P.GAME_ORDER.forEach(function(g){
    var gs = S.games[g]; if(!gs.on || P.check(g, pack, gs.opt)) return;
    var b = P.build(g, pack, gs.opt, S.seed), G = P.GAMES[g], np = 0;
    if(st.rulesOn){ out.push({t:'rules', g:g}); np++; }
    if(b.cards.length){
      var sz = P.SIZES[st.size], per = sz.cols * sz.rows;
      P.chunk(b.cards, per).forEach(function(ch){ out.push({t:'cards', g:g, cards:ch}); np++; if(st.backs){ out.push({t:'backs', g:g, cards:P.mirrorRow(ch, sz.cols)}); np++; } });
    }
    P.chunk(b.dice, 2).forEach(function(ch){ out.push({t:'dice', g:g, dice:ch}); np++; });
    P.chunk(b.boards, 2).forEach(function(ch){ out.push({t:'bingo', g:g, boards:ch}); np++; });
    parts.push(G.ic + G.n + ' ' + np + ' 頁');
  });
  if(out.length && st.score){ out.push({t:'score'}); parts.push('計分表 1 頁'); }
  LAST = out;
  return {pages:out.length, parts:parts, list:out};
}

/* ---------- 右側：預覽紙張 ---------- */
function renderSheets(){
  var info = layout(), z = +(lsGet('zoom') || 0);
  if(!z){ var ww = ($('sheetsWrap') || {}).clientWidth || 800; z = Math.max(.25, Math.min(.5, Math.floor((ww - 30) / 794 * 20) / 20)); }
  $('pvbar').innerHTML = '<b>🖨 預覽</b><span class="small" style="color:#CFE6DA">' + (info.pages ? info.pages + ' 頁 A4' : '沒有內容') + '</span><span class="sp"></span><label class="small" style="color:#fff">縮放 <input type="range" id="zoom" min=".25" max="1" step=".05" value="' + z + '"></label><button class="btn or" data-act="print"' + (info.pages ? '' : ' disabled') + '>🖨 列印</button>';
  $('sheets').style.setProperty('--z', z);
  var cls = (S.style.bw ? ' bw' : '') + (S.style.cut ? '' : ' cut-off');
  $('sheets').innerHTML = info.list.length ? info.list.map(function(pg, i){ return '<div class="sheet' + cls + '">' + sheetHtml(pg) + '<div class="sl">' + esc(S.pack.name) + (pg.g ? '・' + P.GAMES[pg.g].n : '') + (pg.t === 'backs' ? '（卡背）' : '') + '</div><div class="sr">' + (i + 1) + ' / ' + info.list.length + '</div></div>'; }).join('')
    : '<div class="sheet"><div class="rp" style="display:flex;align-items:center;justify-content:center;text-align:center;color:#888;font-size:6mm">勾選左邊的遊戲，<br>這裡就會出現可以列印的頁面。</div></div>';
}
function sheetHtml(pg){
  if(pg.t === 'rules') return rulesHtml(pg.g);
  if(pg.t === 'cards' || pg.t === 'backs') return cardsHtml(pg);
  if(pg.t === 'dice') return pg.dice.map(function(f, i){ return '<div class="die" style="top:' + (12 + i * 140) + 'mm">' + dieSvg(f) + '</div>'; }).join('') + '<div class="sl" style="bottom:4mm"></div>';
  if(pg.t === 'bingo') return pg.boards.map(function(b, i){ return bingoHtml(b, 10 + i * 141); }).join('');
  if(pg.t === 'score') return scoreHtml();
  return '';
}
function cardsHtml(pg){
  var sz = P.SIZES[S.style.size], u = sz.w / 63;
  var left = (210 - sz.cols * sz.w) / 2, top = (297 - sz.rows * sz.h) / 2 - 3;
  var h = '<div class="cgrid" style="left:' + left + 'mm;top:' + top + 'mm;grid-template-columns:repeat(' + sz.cols + ',' + sz.w + 'mm);grid-auto-rows:' + sz.h + 'mm;--u:' + u + '">';
  pg.cards.forEach(function(c){ h += pg.t === 'backs' ? backHtml(c, pg.g, sz) : frontHtml(c, sz); });
  return h + '</div>';
}
function frontHtml(c, sz){
  var st = 'width:' + sz.w + 'mm;height:' + sz.h + 'mm;--cc:' + colorOf(c.c) + ';', cat = P.catOf(S.pack, c.c);
  if(c.kind === 'cat') return '<div class="cd cat" style="' + st + '"><div class="bd"><div class="ic">' + esc(cat.ic || '🗂️') + '</div><div class="bg ' + lenClass(c.big) + '">' + esc(c.big) + '</div><div class="sm" style="color:#fff">類別卡</div></div><div class="ft" style="color:rgba(255,255,255,.8)">' + esc(S.pack.name) + '</div></div>';
  var bandTxt = c.kind === 'step' ? '🔢 ' + esc(S.pack.steps.title) : c.kind === 'item' ? '🗂️ 放到哪一類？' : c.kind === 'guess' ? '🗣️ 說給隊友猜' : c.kind === 'call' ? '🔲 主持人卡' : (cat.ic ? esc(cat.ic) + ' ' : '') + esc(cat.n || c.tag);
  var h = '<div class="cd" style="' + st + '"><div class="band">' + bandTxt + '<span class="tg">' + esc(c.kind === 'step' ? c.tag : c.kind === 'term' ? '名詞' : c.kind === 'def' ? '說明' : '') + '</span></div><div class="bd"><div class="bg ' + lenClass(c.big) + '">' + esc(c.big) + '</div>';
  if(c.small) h += '<div class="sm">' + esc(c.small) + '</div>';
  if(c.ban) h += '<div class="ban">禁語：' + c.ban.map(esc).join('、') + '</div>';
  h += '</div>';
  if(c.flip) h += '<div class="flip">' + esc(c.flip) + '</div>';
  else h += '<div class="ft">' + esc(S.pack.name) + '</div>';
  return h + '</div>';
}
function backHtml(c, g, sz){
  var st = 'width:' + sz.w + 'mm;height:' + sz.h + 'mm;';
  if(!c) return '<div class="cd empty" style="' + st + '"></div>';
  var G = P.GAMES[g];
  return '<div class="cd back" style="' + st + '--bk:' + (g === 'order' ? colorOf(c.set - 1) : '#1F5640') + '"><div class="in"><div class="ic">' + G.ic + '</div><b>' + esc(G.n) + '</b><small>' + esc(S.pack.name) + (g === 'order' ? '・第 ' + c.set + ' 組' : '') + '</small></div></div>';
}
function rulesHtml(g){
  var gs = S.games[g], R = P.rules(g, S.pack, gs.opt);
  var li = function(a){ return a.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join(''); };
  return '<div class="rp"><h2>' + esc(R.title) + '</h2><div class="small" style="color:#666">' + esc(P.GAMES[g].s) + '</div>' +
    '<div class="meta"><span>👥 ' + esc(R.players) + '</span><span>⏱ ' + esc(R.time) + '</span><span>✂️ 準備：' + R.prep.map(esc).join('；') + '</span></div>' +
    '<h3>準備</h3><ol>' + li(R.setup) + '</ol><h3>怎麼玩</h3><ol>' + li(R.play) + '</ol><h3>怎麼贏</h3><ul>' + li(R.win) + '</ul>' +
    '<h3>帶領小撇步</h3><ul>' + li(R.tips) + '</ul><h3>玩完一起討論</h3><ol>' + li(R.debrief) + '</ol>' +
    '<div class="note">倒著印在卡片下方的是答案，玩的時候用手遮住或摺起來。' + (S.style.backs ? '卡背頁請用「雙面列印、長邊翻頁」，背面已經左右對調。' : '') + '<br>' + esc(S.pack.name) + '・列印即玩桌遊產生器 ' + esc(ONLINE.replace('https://', '')) + '</div></div>';
}
function bingoHtml(b, top){
  var cell = 120 / b.size, fs = b.size === 5 ? 3.4 : b.size === 4 ? 4.2 : 5.4;
  return '<div class="bb" style="top:' + top + 'mm"><h3>🔲 ' + esc(S.pack.name) + ' 賓果</h3><table>' + P.chunk(b.cells, b.size).map(function(r){ return '<tr>' + r.map(function(x){ return '<td class="' + (x === '★ 免費' ? 'free' : '') + '" style="width:' + cell + 'mm;height:' + cell + 'mm;font-size:' + fs + 'mm">' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table><div class="no">第 ' + b.no + ' 張・姓名＿＿＿＿＿＿＿　聽到說明就圈起來，連成一線喊「賓果！」</div></div>';
}
// 骰子展開圖：橫向十字（4×3），面 38mm，加黏貼耳
function dieSvg(faces){
  var f = 38, W = 4 * f + 20, H = 3 * f + 20, o = 10;
  var pos = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]]; // 上、左、前、右、後、下
  var tabs = [[0, 1, 'top'], [2, 1, 'top'], [3, 1, 'top'], [0, 1, 'bottom'], [2, 1, 'bottom'], [3, 1, 'bottom'], [3, 1, 'right']];
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + H + 'mm" viewBox="0 0 ' + W + ' ' + H + '" font-family="Noto Sans TC,Microsoft JhengHei,sans-serif">';
  tabs.forEach(function(t){
    var x = o + t[0] * f, y = o + t[1] * f, d = 7, p;
    if(t[2] === 'top') p = [[x, y], [x + d, y - d], [x + f - d, y - d], [x + f, y]];
    else if(t[2] === 'bottom') p = [[x, y + f], [x + d, y + f + d], [x + f - d, y + f + d], [x + f, y + f]];
    else p = [[x + f, y], [x + f + d, y + d], [x + f + d, y + f - d], [x + f, y + f]];
    s += '<polygon points="' + p.map(function(q){ return q.join(','); }).join(' ') + '" fill="#EEE" stroke="#999" stroke-width=".3" stroke-dasharray="1.2 1"/>';
  });
  pos.forEach(function(q, i){
    var fc = faces[i], x = o + q[0] * f, y = o + q[1] * f, col = S.style.bw ? '#fff' : (fc.c >= 0 ? colorOf(fc.c) : '#F7F4EC'), tc = S.style.bw || fc.c < 0 ? '#222' : '#fff';
    s += '<rect x="' + x + '" y="' + y + '" width="' + f + '" height="' + f + '" fill="' + col + '" stroke="#333" stroke-width=".4"/>' +
      '<text x="' + (x + f / 2) + '" y="' + (y + f * .48) + '" font-size="13" text-anchor="middle">' + esc(fc.ic) + '</text>' +
      '<text x="' + (x + f / 2) + '" y="' + (y + f * .8) + '" font-size="' + (Array.from(fc.n).length > 5 ? 4.2 : 5.4) + '" font-weight="900" text-anchor="middle" fill="' + tc + '">' + esc(fc.n) + '</text>';
  });
  s += '<text x="' + (o + 2 * f + 4) + '" y="' + (o + 2 * f + 16) + '" font-size="3.2" fill="#888">✂ 沿實線剪下、虛線往內摺</text><text x="' + (o + 2 * f + 4) + '" y="' + (o + 2 * f + 21) + '" font-size="3.2" fill="#888">灰色耳朵塗膠水黏起來</text>';
  return s + '</svg>';
}
function scoreHtml(){
  var rows = '';
  for(var i = 0; i < 8; i++){ rows += '<tr><td style="text-align:left;padding-left:2mm"></td>' + '<td></td>'.repeat(8) + '<td></td></tr>'; }
  return '<div class="sc"><h2 style="font-size:7mm">📝 計分表・' + esc(S.pack.name) + '</h2><p style="color:#666;margin:1mm 0">日期＿＿＿＿＿＿　遊戲＿＿＿＿＿＿＿＿＿＿　班級＿＿＿＿＿＿</p><table><tr><th style="width:34mm">玩家／隊伍</th>' +
    [1, 2, 3, 4, 5, 6, 7, 8].map(function(n){ return '<th>第 ' + n + ' 輪</th>'; }).join('') + '<th style="width:20mm">總分</th></tr>' + rows + '</table>' +
    '<h2 style="font-size:5mm;margin-top:8mm">💬 我學到的一件事</h2><div style="border:.35mm solid #444;height:40mm;margin-top:2mm;border-radius:2mm"></div></div>';
}

/* ---------- AI（自備金鑰；沿用開店前置清單的寫法） ---------- */
function geminiModelFix(m){ var r = {'gemini-2.5-flash':'gemini-3.6-flash', 'gemini-2.5-flash-lite':'gemini-3.5-flash-lite', 'gemini-2.5-pro':'gemini-3.8-flash', 'gemini-2.0-flash':'gemini-3.6-flash', 'gemini-2.0-flash-001':'gemini-3.6-flash', 'gemini-2.0-flash-lite':'gemini-3.1-flash-lite', 'gemini-1.5-flash':'gemini-3.6-flash', 'gemini-1.5-pro':'gemini-3.1-pro-preview', 'gemini-3-pro':'gemini-3.1-pro-preview', 'gemini-3-pro-preview':'gemini-3.1-pro-preview', 'gemini-3.5-pro':'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview':'gemini-3.1-flash-lite'}; m = String(m || '').trim().replace(/^models\//, ''); return r[m] || m; }
var PROVIDERS = {
  gemini: {label:'Gemini（Google AI Studio）', models:[['gemini-3.5-flash', 'Gemini 3.5 Flash（均衡，推薦）'], ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro 預覽版（最強）'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite（快速省錢）']]},
  openai: {label:'OpenAI', url:'https://api.openai.com/v1/chat/completions', models:[['gpt-5-mini', 'GPT-5 mini（均衡，推薦）'], ['gpt-5', 'GPT-5（最強）'], ['gpt-4o-mini', 'GPT-4o mini（快速省錢）']]},
  claude: {label:'Claude（Anthropic）', models:[['claude-sonnet-5-5', 'Claude Sonnet 5.5（均衡，推薦）'], ['claude-opus-5-5', 'Claude Opus 5.5（最強）'], ['claude-haiku-5-5', 'Claude Haiku 5.5（快速省錢）']]},
  openrouter: {label:'OpenRouter', url:'https://openrouter.ai/api/v1/chat/completions', models:[['openai/gpt-4o-mini', 'OpenAI GPT-4o mini（推薦）'], ['google/gemini-2.5-flash', 'Google Gemini 2.5 Flash'], ['anthropic/claude-sonnet-4.5', 'Anthropic Claude Sonnet 4.5']]},
  xai: {label:'xAI Grok', url:'https://api.x.ai/v1/chat/completions', models:[['grok-4', 'Grok 4'], ['grok-3-mini', 'Grok 3 mini']]},
  deepseek: {label:'DeepSeek', url:'https://api.deepseek.com/chat/completions', models:[['deepseek-chat', 'DeepSeek Chat（推薦）'], ['deepseek-reasoner', 'DeepSeek Reasoner（推理）']]},
  custom: {label:'自訂（OpenAI 相容端點，例如 Ollama、LM Studio）', models:[]}
};
function aiCfg(){ var c = lsJson('ai', {}); if(!PROVIDERS[c.provider]) c.provider = 'gemini'; return c; }
function aiModel(c){ c = c || aiCfg(); return (c.modelCustom || '').trim() || c.model || ((PROVIDERS[c.provider].models[0]) || [''])[0]; }
function customUrl(base){ base = (base || '').trim().replace(/\/+$/, ''); return /\/chat\/completions$/.test(base) ? base : base + '/chat/completions'; }
function aiReady(){ var c = aiCfg(); return c.provider === 'custom' ? !!(c.base || '').trim() && !!aiModel(c) : !!c.key; }
async function callLLM(prompt, onStatus){
  var c = aiCfg(), provider = c.provider, model = aiModel(c), key = c.key, url, headers, body, extract;
  if(provider === 'claude'){
    url = 'https://api.anthropic.com/v1/messages';
    headers = {'content-type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true'};
    body = {model:model, max_tokens:6000, messages:[{role:'user', content:prompt}]};
    extract = function(d){ return (d.content || []).filter(function(b){ return b.type === 'text'; }).map(function(b){ return b.text; }).join(''); };
  } else if(provider !== 'gemini'){
    url = provider === 'custom' ? customUrl(c.base) : PROVIDERS[provider].url;
    headers = {'content-type':'application/json'};
    if(key) headers.authorization = 'Bearer ' + key;
    body = {model:model, messages:[{role:'user', content:prompt}]};
    extract = function(d){ return d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content; };
  } else {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(geminiModelFix(model)) + ':generateContent';
    headers = {'content-type':'application/json', 'x-goog-api-key':key};
    body = {contents:[{parts:[{text:prompt}]}], generationConfig:{responseMimeType:'application/json'}};
    extract = function(d){ var ps = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []; return ps.map(function(p){ return p.text || ''; }).join(''); };
  }
  for(var attempt = 1; attempt <= 3; attempt++){
    var resp = await fetch(url, {method:'POST', headers:headers, body:JSON.stringify(body), signal:AbortSignal.timeout(150000)});
    var raw = await resp.text();
    if(resp.ok){ var t = extract(JSON.parse(raw)); if(!t) throw new Error('回應中沒有文字內容'); return t; }
    var em = raw.slice(0, 200);
    try{ var e = JSON.parse(raw); em = (e.error && e.error.message) || e.message || em; }catch(x){}
    if({429:1, 500:1, 503:1, 529:1}[resp.status] && attempt < 3){ if(onStatus) onStatus('服務忙碌（' + resp.status + '），' + attempt * 6 + ' 秒後重試…'); await new Promise(function(r){ setTimeout(r, attempt * 6000); }); continue; }
    throw new Error('HTTP ' + resp.status + '：' + em);
  }
}
// AI 回答（JSON 或表格文字）→ 題材
function importAnswer(txt){
  txt = String(txt || '').trim(); if(!txt) throw new Error('沒有內容');
  var s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if(s >= 0 && e > s){ try{ return P.fromJson(JSON.parse(txt.slice(s, e + 1))); }catch(x){} }
  return P.parseText(txt.replace(/^```\w*|```$/gm, ''), {name:($('aiTopic') || {}).value || '我的題材'});
}
function aiSettings(){
  var c = aiCfg(), pv = PROVIDERS[c.provider];
  openModal('<h2>⚙ AI 設定（自備金鑰）</h2><p class="small">金鑰只存在這台電腦的瀏覽器，直接從瀏覽器連到你選的 AI 服務，不經過本站。公用電腦用完請按「清除金鑰」。</p>' +
    '<label class="fld">服務<select id="aP">' + Object.keys(PROVIDERS).map(function(k){ return '<option value="' + k + '"' + (k === c.provider ? ' selected' : '') + '>' + PROVIDERS[k].label + '</option>'; }).join('') + '</select></label>' +
    (pv.models.length ? '<label class="fld">模型<select id="aM">' + pv.models.map(function(m){ return '<option value="' + m[0] + '"' + (m[0] === c.model ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('') + '</select></label>' : '') +
    '<label class="fld">自訂模型名稱（選填，填了優先使用）<input id="aMC" value="' + esc(c.modelCustom || '') + '"></label>' +
    (c.provider === 'custom' ? '<label class="fld">端點網址<input id="aB" placeholder="http://localhost:11434/v1" value="' + esc(c.base || '') + '"></label>' : '') +
    '<label class="fld">API 金鑰<input id="aK" type="password" autocomplete="off" value="' + esc(c.key || '') + '"></label>' +
    '<div class="stack"><button class="btn" data-act="aiSave">儲存</button><button class="btn red" data-act="aiClear">清除金鑰</button><button class="btn alt" data-act="close">取消</button></div>');
}

/* ---------- 事件 ---------- */
var reT;
function refresh(panelToo){ save(); if(panelToo) renderPanel(); clearTimeout(reT); reT = setTimeout(renderSheets, 60); }
function setPack(p, src){ S.pack = P.normPack(p); S.src = src; refresh(true); }
document.addEventListener('click', function(e){
  var el = e.target.closest('button,a[data-act]');
  if(!el) return;
  var ds = el.dataset;
  if(ds.fontsize){ lsSet('fs', ds.fontsize); applyView(); openSettings(); return; }
  if(ds.pack){ var pk = P.PACKS.filter(function(x){ return x.id === ds.pack; })[0]; setPack(pk, pk.id); toast('已換成「' + pk.name + '」'); return; }
  if(ds.my != null){ setPack(MY[+ds.my], 'my:' + ds.my); return; }
  if(ds.tab){ S.tab = ds.tab; save(); renderPanel(); return; }
  var a = ds.act; if(!a) return;
  if(el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  if(ACT[a]) ACT[a](el);
});
document.addEventListener('change', function(e){
  var t = e.target, ds = t.dataset || {};
  if(ds.game){ S.games[ds.game].on = t.checked; refresh(true); return; }
  if(ds.gopt){ var g = S.games[ds.gopt]; g.opt = g.opt || {}; g.opt[ds.k] = +t.value; var o = P.opt(ds.gopt, g.opt); g.opt[ds.k] = Math.max(+t.min || 1, Math.min(+t.max || 99, o[ds.k])); refresh(true); return; }
  if(ds.style){ S.style[ds.style] = t.checked; refresh(true); return; }
  if(t.id === 'sSize'){ S.style.size = t.value; refresh(true); return; }
  if(t.id === 'sSeed'){ S.seed = P.clean(t.value, 8) || 'A1'; refresh(true); return; }
  if(t.id === 'pQmode'){ S.pack.qmode = t.value; refresh(true); return; }
  if(t.id === 'aiTopic' || t.id === 'aiAud' || t.id === 'aiN') lsSet(t.id, t.value);
  if(t.id === 'aP'){ var c = aiCfg(); c.provider = t.value; c.model = ''; lsSet('ai', JSON.stringify(c)); aiSettings(); return; }
  if(t.id === 'importFile' && t.files && t.files[0]){
    var f = t.files[0];
    if(f.size > 2e6){ toast('檔案太大（上限 2MB）'); return; }
    f.text().then(function(txt){ try{ var p = /\.json$/i.test(f.name) ? P.fromJson(JSON.parse(txt)) : P.parseText(txt, {name:f.name.replace(/\.\w+$/, '')}); if(!p.items.length) throw new Error('檔案裡沒有名詞'); setPack(p, 'custom'); S.tab = 'pick'; renderPanel(); toast('已開啟「' + p.name + '」'); }catch(err){ toast('開不了：' + err.message); } });
  }
});
document.addEventListener('input', function(e){ if(e.target.id === 'zoom'){ lsSet('zoom', e.target.value); $('sheets').style.setProperty('--z', e.target.value); } });
$('modal').addEventListener('click', function(e){ if(e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
var ACT = {
  close:closeModal, warn:function(){ showWarn(); }, settings:openSettings, install:function(){ closeModal(); install(); },
  applyText:function(){
    var p = P.parseText($('pText').value, {name:$('pName').value, ic:S.pack.ic, sub:S.pack.sub, qmode:$('pQmode').value, steps:S.pack.steps});
    if(!p.items.length){ $('applyMsg').textContent = '⚠ 沒有讀到任何名詞，請確認格式'; return; }
    S.pack = p; if(!/^my:/.test(S.src)) S.src = 'custom'; refresh(true); toast('已套用：' + p.cats.length + ' 類、' + p.items.length + ' 個名詞、流程 ' + p.steps.list.length + ' 步');
  },
  resetPack:function(){
    if(/^my:/.test(S.src)){ setPack(MY[+S.src.slice(3)], S.src); return; }
    var pk = P.PACKS.filter(function(x){ return x.id === S.src; })[0] || P.PACKS[0]; setPack(pk, pk.id); toast('已還原');
  },
  reseed:function(){ var s = ''; for(var i = 0; i < 4; i++) s += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]; S.seed = s; refresh(true); toast('已重新洗牌：' + s); },
  print:function(){ if(!LAST || !LAST.length) return; window.print(); },
  printTips:function(){ openModal('<h2>📋 列印小提醒</h2><ol><li>紙張選 <b>A4</b>，縮放選 <b>100%／實際大小</b>（不要「符合頁面」），卡牌尺寸才會準確。</li><li>「邊界」選<b>無</b>或<b>預設</b>都可以；請勾選<b>背景圖形</b>，類別顏色才印得出來。</li><li>要存成 PDF：印表機選「另存為 PDF」。</li><li>有印卡背時：用<b>雙面列印、長邊翻頁</b>。先印一張試試看正反面有沒有對齊，印表機不同可能偏 1～2mm，所以卡背設計留了邊。</li><li>卡牌建議印在 160～200 磅的卡紙上，比較好洗牌；也可以印一般紙後護貝。</li><li>骰子展開圖：沿實線剪下，虛線往內摺，灰色耳朵塗膠水。</li></ol><div class="stack"><button class="btn" data-act="close">知道了</button></div>'); },
  aiSettings:function(){ aiSettings(); },
  aiSave:function(){ var c = aiCfg(); c.provider = $('aP').value; if($('aM')) c.model = $('aM').value; c.modelCustom = $('aMC').value.trim(); if($('aB')) c.base = $('aB').value.trim(); c.key = $('aK').value.trim(); lsSet('ai', JSON.stringify(c)); closeModal(); renderPanel(); toast('AI 設定已儲存'); },
  aiClear:function(){ var c = aiCfg(); c.key = ''; lsSet('ai', JSON.stringify(c)); closeModal(); renderPanel(); toast('金鑰已清除'); },
  aiCopy:function(){ var t = $('aiTopic').value.trim(); if(!t){ toast('請先輸入主題'); return; } copyText(P.aiPrompt(t, $('aiAud').value, +$('aiN').value), '提示詞已複製，貼到 ChatGPT／Gemini／Claude，再把回答貼回下面'); },
  aiGo:function(){
    var t = $('aiTopic').value.trim(); if(!t){ toast('請先輸入主題'); return; }
    if(!aiReady()){ aiSettings(); return; }
    var msg = $('aiMsg'); msg.textContent = '⏳ AI 產生中，大約 10～40 秒…';
    callLLM(P.aiPrompt(t, $('aiAud').value, +$('aiN').value), function(s){ msg.textContent = '⏳ ' + s; }).then(function(txt){
      var p = importAnswer(txt); if(!p.items.length) throw new Error('AI 的回答裡沒有讀到名詞');
      setPack(p, 'custom'); S.tab = 'pick'; renderPanel(); toast('AI 產生了 ' + p.cats.length + ' 類、' + p.items.length + ' 個名詞，請檢查內容');
    }).catch(function(err){ msg.textContent = '⚠ ' + err.message + '（也可以用「複製提示詞」貼到網頁版 AI）'; });
  },
  aiImport:function(){ try{ var p = importAnswer($('aiPaste').value); if(!p.items.length) throw new Error('沒有讀到名詞'); setPack(p, 'custom'); S.tab = 'pick'; renderPanel(); toast('已匯入 ' + p.items.length + ' 個名詞，請檢查內容'); }catch(err){ $('aiMsg').textContent = '⚠ ' + err.message; } },
  saveMy:function(){
    var i = /^my:/.test(S.src) ? +S.src.slice(3) : MY.findIndex(function(x){ return x.name === S.pack.name; });
    if(i < 0){ if(MY.length >= 30){ toast('我的題材最多 30 個，請先刪掉一些'); return; } MY.push(P.clone(S.pack)); i = MY.length - 1; } else MY[i] = P.clone(S.pack);
    lsSet('mypacks', JSON.stringify(MY)); S.src = 'my:' + i; refresh(true); toast('已存成「' + S.pack.name + '」');
  },
  delMy:function(){ var i = +S.src.slice(3); openModal('<h2>刪除「' + esc(MY[i].name) + '」？</h2><p>只刪除存在這台電腦的題材，無法復原。</p><div class="stack"><button class="btn red" data-act="delMyYes">刪除</button><button class="btn alt" data-act="close">取消</button></div>'); },
  delMyYes:function(){ MY.splice(+S.src.slice(3), 1); lsSet('mypacks', JSON.stringify(MY)); closeModal(); S.src = 'custom'; refresh(true); toast('已刪除'); },
  exportPack:function(){
    var blob = new Blob([JSON.stringify(Object.assign({app:'printable-game-maker', v:1}, S.pack), null, 2)], {type:'application/json'}), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = '題材_' + S.pack.name + '.json'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  },
  wipeAll:function(){ openModal('<h2>確定嗎？</h2><p>目前的題材、我的題材、遊戲與列印設定、AI 金鑰都會刪掉，無法復原（字體設定保留）。</p><div class="stack"><button class="btn red" data-act="wipeAllYes">清除全部資料</button><button class="btn alt" data-act="close">取消</button></div>'); },
  wipeAllYes:function(){ var keep = {fs:1, fold:1, warnSeen:1, marquee:1}; try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf(PFX) === 0 && !keep[k.slice(PFX.length)]) localStorage.removeItem(k); }); }catch(e){} location.reload(); },
  foldall:function(){ var all = document.querySelectorAll('.set-sec'), any = [].some.call(all, function(d){ return !d.open; }); all.forEach(function(d){ d.open = any; }); }
};

/* ---------- 警語、設定、安裝 ---------- */
var WARN_HTML = '<h2>⚠ 使用警語</h2><ul>' +
  '<li>內建題材（SWOT、行銷 4P、財務名詞、開店流程、提示詞、防詐騙）是本工具自行撰寫的<b>教學示範</b>，內容已盡量正確，但不是法律、財務或專業建議；開店手續等實際規定請以主管機關最新公告為準。</li>' +
  '<li><b>AI 產生的題材可能有錯</b>，請逐行檢查後再印給學員。</li>' +
  '<li>使用自己的教材時，請確認你有權使用與印製（例如自己寫的講義），不要整段照抄書籍或他人的付費教材。</li>' +
  '<li>題材、設定、AI 金鑰只存在這台電腦的瀏覽器。用 AI 時，你輸入的主題會直接送到你選的 AI 服務。公用電腦用完請到 ⚙ 清除資料。</li>' +
  '<li>不同印表機的雙面列印可能有 1～2mm 的偏差，正式大量列印前請先印一張試試。</li></ul>';
function showWarn(){ openModal(WARN_HTML + '<div class="stack"><button class="btn" data-act="close">我知道了</button></div>'); }
function sec(id, title, val, body){ return '<details class="set-sec" data-sec="' + id + '"><summary><span class="sst">' + title + '</span><span class="ssv">' + esc(val) + '</span></summary><div class="set-body">' + body + '</div></details>'; }
function openSettings(){
  var h = '<div class="top"><h2 style="flex:1 1 0">⚙ 常用設定</h2><button class="btn alt" data-act="foldall">全部展開／收合</button></div>' +
    sec('view', '顯示', lsGet('fs') === 'xl' ? '大字' : '標準字', '<div class="stack"><button class="btn' + (lsGet('fs') === 'xl' ? ' alt' : '') + '" data-fontsize="m">標準字</button><button class="btn' + (lsGet('fs') === 'xl' ? '' : ' alt') + '" data-fontsize="xl">大字</button></div><p class="small">只影響操作畫面，不影響印出來的大小。</p>') +
    sec('ai', 'AI 設定', aiReady() ? aiModel() : '未設定', '<div class="stack"><button class="btn" data-act="aiSettings">⚙ 打開 AI 設定</button></div>') +
    sec('my', '我的題材', MY.length + ' 個', '<p class="small">在「1 選題材」的「💾 存成我的題材」分頁管理。</p>') +
    sec('wipe', '🧹 清除全部資料', '', '<p class="small">清掉題材、我的題材、設定與 AI 金鑰。字體設定保留。</p><div class="stack"><button class="btn red" data-act="wipeAll">清除全部資料</button></div>') +
    sec('about', '關於本工具', '', '<p>👤 創作者 Mark Tsai（蔡豐全）<br><a href="mailto:tsaimark@gmail.com">tsaimark@gmail.com</a></p><div class="stack"><a class="btn alt" href="manual.html">📖 操作手冊</a><a class="btn alt" href="manual.html#creator">👤 創作者資訊</a><button class="btn alt" data-act="warn">⚠ 使用警語</button>' +
      (standalone ? '' : '<button class="btn alt" data-act="install">📲 加入主畫面</button>') + '</div><p class="small" style="margin-top:.5rem">訪客數 <img src="https://visitor-badge.laobi.icu/badge?page_id=m255525.printablegamemaker" alt="訪客次數" height="20" loading="lazy" style="vertical-align:middle"></p>') +
    '<div class="stack"><button class="btn" data-act="close">關閉</button></div>';
  openModal(h);
  var open = lsJson('fold', []);
  document.querySelectorAll('.set-sec').forEach(function(d){ d.open = open.indexOf(d.dataset.sec) >= 0; d.addEventListener('toggle', saveFold); });
}
function saveFold(){ var o = []; document.querySelectorAll('.set-sec').forEach(function(d){ if(d.open) o.push(d.dataset.sec); }); lsSet('fold', JSON.stringify(o)); }
function applyView(){ document.documentElement.dataset.fs = lsGet('fs') === 'xl' ? 'xl' : 'm'; }
function install(){
  if(window._dp){ window._dp.prompt(); window._dp = null; return; }
  openModal('<h2>📲 加入主畫面</h2><ul><li><b>電腦（Chrome／Edge）</b>：網址列右邊的安裝圖示。</li><li><b>iPhone／iPad（Safari）</b>：「分享」→「加入主畫面」。</li><li><b>Android（Chrome）</b>：右上角「⋮」→「安裝應用程式」。</li></ul><div class="stack"><button class="btn" data-act="close">知道了</button></div>');
}

/* ---------- 跑馬燈（工作區共用公告，不可關） ---------- */
function initMarquee(){
  var URL_ = "https://script.google.com/macros/s/AKfycbwKX0DNNbY8y4nf90BFTHtxgfqJcHHcZasRrgycl4QAe52_hkjMWSkYk4xOsqU-JPCROw/exec";
  var REFRESH = 20 * 60 * 1000, bar = $('marqueeBar'), track = $('marqueeTrack'), lastKey = null;
  function appendText(c, text){ var re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, li = 0, m; while((m = re.exec(text))){ if(m.index > li) c.appendChild(document.createTextNode(text.slice(li, m.index))); var a = document.createElement('a'); a.href = m[2]; a.textContent = m[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.color = 'inherit'; a.style.textDecoration = 'underline'; c.appendChild(a); li = re.lastIndex; } if(li < text.length) c.appendChild(document.createTextNode(text.slice(li))); }
  function renderM(items){
    if(!items || !items.length) return;
    var k = JSON.stringify(items); if(k === lastKey) return; lastKey = k; track.innerHTML = '';
    var fr = document.createDocumentFragment();
    function pass(){ items.forEach(function(it, i){ if(i > 0) fr.appendChild(document.createTextNode('　★　')); appendText(fr, String(it)); }); }
    pass(); fr.appendChild(document.createTextNode('　★　')); pass(); track.appendChild(fr);
    bar.classList.add('show'); document.body.classList.add('has-marquee');
    track.style.animationDuration = Math.max(track.scrollWidth / 2 / 60, 12) + 's';
  }
  function fetchM(){ fetch(URL_, {method:'POST', body:JSON.stringify({serial:''})}).then(function(r){ return r.json(); }).then(function(d){ if(d && Array.isArray(d.marquee) && d.marquee.length){ lsSet('marquee', JSON.stringify(d.marquee)); renderM(d.marquee); } }).catch(function(){}); }
  renderM(lsJson('marquee', [])); fetchM(); setInterval(fetchM, REFRESH);
}

window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); window._dp = e; });
if('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('service-worker.js').catch(function(){});
applyView(); render(); initMarquee();
if(!lsGet('warnSeen')){ lsSet('warnSeen', '1'); showWarn(); }
window._pgm = {get S(){ return S; }, ACT:ACT, render:render, layout:layout, importAnswer:importAnswer};
})();
