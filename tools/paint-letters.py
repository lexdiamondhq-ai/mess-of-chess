# Makes wet-paint letters: a mask (tinted to the paint colour at runtime) and
# a shading overlay (gloss, shadow, ink outline) that sits on top.
import sys, os, random, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
FONT, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
W, H = 360, 520           # canvas per letter (room below for drips)
BASE = 330                # baseline y
font = ImageFont.truetype(FONT, 300)

def blur(a, r):
    return np.asarray(Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32)/255

def letter(ch, seed):
    rnd = random.Random(seed)
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    bb = d.textbbox((0, 0), ch, font=font)
    x0 = (W - (bb[2]-bb[0]))//2 - bb[0]; y0 = BASE - bb[3]
    d.text((x0, y0), ch, font=font, fill=255)
    a = np.asarray(m, np.float32)/255
    # lumpy blobs along the edge
    edge = (blur(a, 2) > 0.2) & (blur(a, 2) < 0.8)
    ys, xs = np.nonzero(edge)
    for _ in range(26):
        k = rnd.randrange(len(xs)); r = rnd.uniform(5, 13)
        d.ellipse([xs[k]-r, ys[k]-r, xs[k]+r, ys[k]+r], fill=255)
    # drips from the lowest points of the letter
    a = np.asarray(m, np.float32)/255
    cols = [x for x in range(W) if a[:, x].max() > 0.5]
    bottoms = {x: int(np.nonzero(a[:, x] > 0.5)[0].max()) for x in cols}
    low = [x for x in cols if bottoms[x] >= BASE - 8]
    for _ in range(rnd.choice([1, 2, 2, 3])):
        if not low: break
        x = rnd.choice(low); w = rnd.uniform(14, 24); L = rnd.uniform(40, 150)
        top = bottoms[x] - 10
        d.rounded_rectangle([x-w/2, top, x+w/2, top+L], radius=w/2, fill=255)
        d.ellipse([x-w*0.75, top+L-w*1.1, x+w*0.75, top+L+w*0.4], fill=255)
        low = [c for c in low if abs(c-x) > 50]
    # gooey merge: blur + threshold for soft rounded paint edges
    a = np.asarray(m, np.float32)/255
    g = blur(a, 7)
    mask = np.clip((g - 0.45) * 12, 0, 1)
    # height map -> lighting
    h = blur(mask, 10) * 0.6 + blur(mask, 4) * 0.4
    gy, gx = np.gradient(h)
    nz = 0.06
    n = np.sqrt(gx**2 + gy**2 + nz**2)
    nx, ny, nzz = -gx/n, -gy/n, nz/n
    L = np.array([-0.5, -0.7, 0.6]); L = L/np.linalg.norm(L)
    diff = nx*L[0] + ny*L[1] + nzz*L[2]
    Hh = L + np.array([0,0,1.0]); Hh = Hh/np.linalg.norm(Hh)
    spec = np.clip(nx*Hh[0] + ny*Hh[1] + nzz*Hh[2], 0, 1) ** 14
    shade = np.clip(0.75 - diff, 0, 1) * 0.7          # darker on the far edges
    hi = np.clip((spec - 0.15) * 1.8, 0, 0.95)
    # overlay RGBA: black shade + white spec, inside the paint only
    ov = np.zeros((H, W, 4), np.float32)
    alpha_dark = shade * mask
    alpha_white = hi * mask
    a_out = alpha_white + alpha_dark * (1 - alpha_white)
    rgb = np.where(a_out[..., None] > 0, (alpha_white[..., None] * 1.0) / np.maximum(a_out[..., None], 1e-6), 0)
    ov[..., :3] = rgb; ov[..., 3] = a_out
    # ink outline + drop shadow, outside the paint
    out = Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))
    outa = np.asarray(out, np.float32)/255
    sh = np.zeros_like(outa); sh[14:, 6:] = outa[:-14, :-6]
    ring = np.clip(np.maximum(outa, sh) - mask, 0, 1)
    ink = np.array([26, 16, 48], np.float32)/255
    ov[..., :3] = ov[..., :3] * (1 - ring[..., None]) + ink * ring[..., None]
    ov[..., 3] = np.maximum(ov[..., 3], ring)
    base = np.zeros((H, W, 4), np.float32); base[..., :3] = 1; base[..., 3] = mask
    # trim to content
    ys, xs = np.nonzero(np.maximum(ov[..., 3], mask) > 0.02)
    y0, y1, x0, x1 = 20, ys.max()+4, max(0, xs.min()-2), min(W, xs.max()+3)
    for arr, name in [(base, 'base'), (ov, 'gloss')]:
        Image.fromarray((np.clip(arr[y0:y1, x0:x1], 0, 1)*255).astype(np.uint8)).save(f'{OUT}/{ch}-{name}.png', optimize=True)
    return (x1-x0, y1-y0)

sizes = {}
for i, ch in enumerate('ABCEGHIKMNOPQRSTUW'):
    sizes[ch] = letter(ch, 1000 + i * 7)
print(sizes)
