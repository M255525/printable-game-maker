// node tools/test_engine.mjs：題材包、六種遊戲的出卡、規則、雙面鏡像、文字與 JSON 匯入
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const P = require('../data.js');
let fail = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.log('FAIL', m); } };

P.PACKS.forEach((raw) => {
  const p = P.normPack(raw);
  ok(p.items.length === raw.items.length, raw.id + ' items survive normPack');
  ok(p.cats.length >= 2 && p.cats.length <= 6, raw.id + ' cats');
  ok(p.items.every((it) => it.c >= 0 && it.c < p.cats.length && it.t && it.d), raw.id + ' item fields');
  ok(new Set(p.items.map((x) => x.t)).size === p.items.length, raw.id + ' unique terms');
  ok(p.steps.list.length >= 5, raw.id + ' steps');
  ok(p.items.every((it) => Array.from(it.t).length <= 24 && Array.from(it.d).length <= 60), raw.id + ' lengths');
  P.GAME_ORDER.forEach((g) => {
    ok(P.check(g, p, {}) === '', raw.id + ' ' + g + ' check: ' + P.check(g, p, {}));
    const out = P.build(g, p, {}, 'seed1');
    const out2 = P.build(g, p, {}, 'seed1');
    ok(JSON.stringify(out) === JSON.stringify(out2), raw.id + ' ' + g + ' reproducible');
    const R = P.rules(g, p, {});
    ok(R.play.length && R.win.length && R.debrief.length && R.title, raw.id + ' ' + g + ' rules');
    if (g === 'match') { ok(out.cards.length === Math.min(12, p.items.length) * 2, raw.id + ' match count ' + out.cards.length); const pairs = {}; out.cards.forEach((c) => { pairs[c.pair] = (pairs[c.pair] || 0) + 1; }); ok(Object.values(pairs).every((v) => v === 2), 'match pairs'); }
    if (g === 'sort') { ok(out.cards.filter((c) => c.kind === 'cat').length === p.cats.length, raw.id + ' sort cats'); ok(out.cards.filter((c) => c.kind === 'item').every((c) => c.c === -1 && /^答案：/.test(c.flip)), 'sort items hide category'); }
    if (g === 'dice') { ok(out.dice.length === 2 && out.dice[0].length === 6, raw.id + ' dice faces'); ok(out.cards.length === Math.min(24, p.items.length), raw.id + ' dice qs'); ok(out.cards.every((c) => c.big && c.flip), 'dice q text'); }
    if (g === 'order') { ok(out.cards.length === 4 * p.steps.list.length, raw.id + ' order count'); for (let s = 1; s <= 4; s++) { const nums = out.cards.filter((c) => c.set === s).map((c) => +c.flip.match(/\d+/)[0]).sort((a, b) => a - b); ok(nums.join() === p.steps.list.map((_, i) => i + 1).join(), raw.id + ' order set ' + s); } }
    if (g === 'bingo') { ok(out.boards.length === 8 && out.boards.every((b) => b.cells.length === 16 && new Set(b.cells).size === 16), raw.id + ' bingo boards'); ok(new Set(out.boards.map((b) => b.cells.join())).size > 1, raw.id + ' bingo boards differ'); ok(out.cards.length === p.items.length, 'bingo callers'); }
    if (g === 'guess') ok(out.cards.length === Math.min(24, p.items.length) && out.cards.every((c) => c.ban.length >= 1), raw.id + ' guess');
  });
  // 5×5 有免費格；3×3 沒有
  const b5 = P.build('bingo', p, { size: 5, boards: 3 }, 's');
  if (p.items.length >= 24) ok(b5.boards.every((b) => b.cells.length === 25 && b.cells[12] === '★ 免費'), raw.id + ' bingo 5x5 free');
  else ok(P.check('bingo', p, { size: 5 }) !== '', raw.id + ' bingo 5x5 too few terms flagged');
  const b3 = P.build('bingo', p, { size: 3, boards: 2 }, 's'); ok(b3.boards[0].cells.length === 9 && b3.boards[0].cells.indexOf('★ 免費') < 0, 'bingo 3x3');
  // 文字往返
  const back = P.parseText(P.toText(p), p);
  ok(JSON.stringify(back.items) === JSON.stringify(p.items) && JSON.stringify(back.cats.map((c) => c.n)) === JSON.stringify(p.cats.map((c) => c.n)) && JSON.stringify(back.steps.list) === JSON.stringify(p.steps.list), raw.id + ' text roundtrip');
});
// 骰子：類別少於 6 補特殊面；多於 6 只取前 6
const two = P.normPack({ cats: [{ n: 'A' }, { n: 'B' }], items: Array.from({ length: 8 }, (_, i) => ({ c: i % 2, t: 'x' + i, d: 'd' + i })) });
const dd = P.build('dice', two, {}, 'z').dice[0]; ok(dd.length === 6 && dd[0].n === 'A' && dd[2].n === '任選類別' && dd[3].n === '再擲一次', 'dice filler faces');
// 檢查訊息
ok(P.check('order', two, {}) !== '', 'order needs steps');
ok(P.check('match', P.normPack({ cats: [{ n: 'A' }], items: [{ c: 0, t: 'a' }] }), {}) !== '', 'match needs defs');
// 鏡像
ok(JSON.stringify(P.mirrorRow([1, 2, 3, 4, 5], 3)) === JSON.stringify([3, 2, 1, null, 5, 4]), 'mirror row with padding');
ok(P.pages(10, 'poker') === 2 && P.pages(16, 'mini') === 1 && P.pages(5, 'big') === 2, 'pages');
// 貼上文字：各種分隔、標題列、流程、沒有類別
let t = P.parseText('類別\t名詞\t說明\n水果\t蘋果\t紅色的\n水果,香蕉,黃色的\n蔬菜｜高麗菜｜綠色的｜這是什麼？｜高麗菜\n#流程：洗菜\n1. 挑選\n2) 清洗\n切段');
ok(t.cats.length === 2 && t.items.length === 3 && t.items[2].q === '這是什麼？' && t.steps.list.join() === '挑選,清洗,切段' && t.steps.title === '洗菜', 'parseText ' + JSON.stringify(t.steps));
t = P.parseText('蘋果\n香蕉'); ok(t.cats.length === 1 && t.items.length === 2 && t.items[0].c === 0, 'parseText no category');
// JSON（AI 格式）
const j = P.fromJson({ name: '水果', cats: [{ n: '紅', ic: '🍎' }, '黃'], items: [{ cat: '紅', t: '蘋果', d: '紅色' }, { cat: '黃', t: '香蕉', d: '黃色' }, { cat: '綠', t: '芭樂', d: '綠色' }], stepsTitle: '吃水果', steps: ['洗', '切', '吃'] });
ok(j.cats.length === 3 && j.items[2].c === 2 && j.steps.list.length === 3 && j.name === '水果', 'fromJson');
// 惡意輸入：長度截斷、控制字元
const bad = P.normPack({ name: 'x'.repeat(100), cats: [{ n: '<b>\u0000類別</b>' }], items: [{ c: 9, t: 'a'.repeat(99), d: 'b' }] });
ok(bad.name.length === 24 && bad.items[0].t.length === 24 && bad.items[0].c === 0 && !/\u0000/.test(bad.cats[0].n), 'normPack clamps');
ok(/繁體中文/.test(P.aiPrompt('時間管理', '', 6)) && /JSON/.test(P.aiPrompt('x')), 'aiPrompt');
console.log(fail ? fail + ' / ' + n + ' FAILED' : 'all ' + n + ' passed');
process.exit(fail ? 1 : 0);
