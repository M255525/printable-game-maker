# 產生 PWA 圖示：綠色切割墊＋三張扇形散開的卡牌＋剪刀線
import os
from PIL import Image, ImageDraw
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
os.makedirs(out, exist_ok=True)

def draw(size, pad):
    s = 4 * size
    im = Image.new('RGB', (s, s), '#1F5640')
    d = ImageDraw.Draw(im)
    step = s // 10
    for i in range(0, s, step):
        d.line([(i, 0), (i, s)], fill='#2A6B50', width=max(2, s // 300))
        d.line([(0, i), (s, i)], fill='#2A6B50', width=max(2, s // 300))
    x0, x1 = pad * s, (1 - pad) * s
    w = x1 - x0
    cw, ch = w * .42, w * .58
    for ang, col, dx in ((-18, '#2E86AB', -.2), (0, '#F28C28', 0), (18, '#E4572E', .2)):
        c = Image.new('RGBA', (int(cw), int(ch)), (0, 0, 0, 0))
        cd = ImageDraw.Draw(c)
        cd.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=cw * .1, fill='#FFFFFF', outline='#1E2A24', width=int(w * .012))
        cd.rectangle([cw * .06, ch * .05, cw * .94, ch * .25], fill=col)
        cd.ellipse([cw * .3, ch * .4, cw * .7, ch * .4 + cw * .4], fill=col)
        c = c.rotate(-ang, expand=True, resample=Image.BICUBIC)
        cx = s / 2 + dx * w - c.width / 2
        cy = x0 + w * .52 - c.height / 2
        im.paste(c, (int(cx), int(cy)), c)
    return im.resize((size, size), Image.LANCZOS)

draw(192, .06).save(os.path.join(out, 'icon-192.png'))
draw(512, .06).save(os.path.join(out, 'icon-512.png'))
draw(512, .18).save(os.path.join(out, 'icon-maskable-512.png'))
print('ok')
