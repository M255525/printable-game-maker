# 端對端：六個內建題材 × 六種遊戲全開，檢查頁數、版面溢出、PDF 頁數，並把每種頁面截圖
# 用法：python tools/e2e_print.py <截圖資料夾>（需先開 http://127.0.0.1:8880）
import sys, io, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from playwright.sync_api import sync_playwright
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
BASE = os.environ.get('PGM_BASE', 'http://127.0.0.1:8880/')
errs, fails = [], []
def check(c, msg):
    print(('ok   ' if c else 'FAIL ') + msg)
    if not c: fails.append(msg)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.route('**/script.google.com/**', lambda r: r.fulfill(status=200, body='{"marquee":["測試公告"]}', headers={'content-type': 'application/json'}))
    pg.route('**/visitor-badge.laobi.icu/**', lambda r: r.fulfill(status=200, body='<svg xmlns="http://www.w3.org/2000/svg"/>', headers={'content-type': 'image/svg+xml'}))
    pg.goto(BASE); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(500)
    pg.screenshot(path=os.path.join(OUT, '00_warn.png'))
    pg.click('#modal .btn')
    for g in ['dice', 'order', 'bingo', 'guess']:
        pg.check('[data-game=%s]' % g); pg.wait_for_timeout(150)
    pg.check('[data-style=backs]'); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(OUT, '01_main.png'))
    # 每個題材：頁數、溢出（卡片文字超出卡片）、檢查訊息
    for pk in ['swot', '4p', 'finance', 'shop', 'prompt', 'scam']:
        pg.click('[data-pack="%s"]' % pk); pg.wait_for_timeout(300)
        info = pg.evaluate('''() => {
          const L = _pgm.layout(); const sheets = [...document.querySelectorAll('#sheets .sheet')];
          const over = [...document.querySelectorAll('#sheets .cd .bg')].filter(e => e.scrollHeight > e.parentElement.clientHeight + 2 || e.scrollWidth > e.parentElement.clientWidth + 2).map(e => e.textContent);
          const needs = [...document.querySelectorAll('.need')].map(e => e.textContent);
          return {pages: L.pages, sheets: sheets.length, over, needs};
        }''')
        check(info['pages'] == info['sheets'] and info['pages'] > 10, '%s pages %d' % (pk, info['pages']))
        check(not info['over'], '%s no text overflow %s' % (pk, info['over'][:3]))
        print('     needs:', info['needs'])
    # 卡片實際尺寸（1mm = 96/25.4 px，在 zoom 1 下量）
    pg.click('[data-pack=swot]'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('sheets').style.setProperty('--z', 1)")
    for size, w, h in (('poker', 63, 88), ('mini', 44, 63), ('big', 88, 126)):
        pg.select_option('#sSize', size); pg.wait_for_timeout(300); pg.evaluate("document.getElementById('sheets').style.setProperty('--z', 1)")
        r = pg.evaluate("(() => { const e = document.querySelector('#sheets .cd'); const b = e.getBoundingClientRect(); const s = document.querySelector('#sheets .sheet').getBoundingClientRect(); return [b.width, b.height, s.width, s.height]; })()")
        mm = 96 / 25.4
        check(abs(r[0] / mm - w) < .6 and abs(r[1] / mm - h) < .6, '%s card %.1f×%.1f mm' % (size, r[0] / mm, r[1] / mm))
        check(abs(r[2] / mm - 210) < .6 and abs(r[3] / mm - 297) < .6, 'sheet A4 %.1f×%.1f' % (r[2] / mm, r[3] / mm))
    pg.select_option('#sSize', 'poker'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('sheets').style.setProperty('--z', 1)")
    # 每種頁面各截一張
    kinds = pg.evaluate("_pgm.layout().list.map(x => x.t + ':' + (x.g || ''))")
    seen = {}
    sheets = pg.query_selector_all('#sheets .sheet')
    for i, k in enumerate(kinds):
        if k in seen: continue
        seen[k] = 1
        sheets[i].screenshot(path=os.path.join(OUT, 'p_%02d_%s.png' % (i, k.replace(':', '_'))))
    # 雙面：卡背每列左右對調
    mir = pg.evaluate("(() => { const L = _pgm.layout().list; const f = L.find(x => x.t === 'cards' && x.g === 'order'), bk = L[L.indexOf(f) + 1]; return [f.cards.slice(0,3).map(c => c.set), bk.t, bk.cards.length]; })()")
    check(mir[1] == 'backs' and mir[2] % 3 == 0, 'backs page follows fronts ' + json.dumps(mir))
    # 列印成 PDF：頁數相符
    pdf = os.path.join(OUT, 'swot.pdf')
    pg.emulate_media(media='print'); pg.pdf(path=pdf, prefer_css_page_size=True, print_background=True); pg.emulate_media(media='screen')
    import re
    n_pdf = len(re.findall(rb'/Type\s*/Page[^s]', open(pdf, 'rb').read()))
    check(n_pdf == len(kinds), 'pdf pages %d == layout %d' % (n_pdf, len(kinds)))
    # 貼上文字＋AI 回答匯入
    pg.click('[data-tab=pick]')
    pg.fill('#pText', '水果\t蘋果\t紅紅的\n水果\t香蕉\t黃黃的\n蔬菜\t青椒\t綠綠的\n蔬菜\t茄子\t紫色的\n#流程：做沙拉\n洗\n切\n拌\n吃')
    pg.fill('#pName', '蔬果'); pg.click('[data-act=applyText]'); pg.wait_for_timeout(300)
    st = pg.evaluate('_pgm.S.pack'); check(st['name'] == '蔬果' and len(st['items']) == 4 and len(st['steps']['list']) == 4, 'apply pasted text')
    needs = pg.evaluate("[...document.querySelectorAll('.need')].map(e => e.textContent)")
    check(any('至少' in n for n in needs), 'small pack shows needs ' + str(needs))
    pg.click('[data-tab=ai]'); pg.fill('#aiTopic', '時間管理')
    pg.fill('#aiPaste', '```json\n{"name":"時間管理","cats":[{"n":"規劃","ic":"🗓"},{"n":"執行","ic":"⚡"}],"items":[{"cat":"規劃","t":"艾森豪矩陣","d":"依重要和緊急分四類"},{"cat":"規劃","t":"週計畫","d":"每週先排重要的事"},{"cat":"執行","t":"番茄鐘","d":"專心 25 分鐘休息 5 分鐘"},{"cat":"執行","t":"批次處理","d":"同類事情一次做完"}],"stepsTitle":"規劃一週","steps":["列出待辦","排優先","放進行事曆","每天檢查"]}\n```')
    pg.click('[data-act=aiImport]'); pg.wait_for_timeout(300)
    st = pg.evaluate('_pgm.S.pack'); check(st['name'] == '時間管理' and len(st['items']) == 4 and st['cats'][0]['ic'] == '🗓', 'import AI JSON')
    pg.click('[data-tab=save]'); pg.click('[data-act=saveMy]'); pg.wait_for_timeout(200)
    check(pg.evaluate("JSON.parse(localStorage.getItem('pgm.mypacks')).length") == 1 and pg.query_selector('[data-my="0"]') is not None, 'save my pack')
    # 手機寬度
    pg.set_viewport_size({'width': 375, 'height': 800}); pg.wait_for_timeout(400)
    check(pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), '375 no horizontal overflow')
    pg.screenshot(path=os.path.join(OUT, '02_mobile.png'), full_page=False)
    b.close()
print('console errors:', errs[:8])
print('FAILS:', fails if fails else 'none')
