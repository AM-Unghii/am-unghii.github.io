"""Generează iconițele aplicației din assets/logo.png.
Rulare: python3 scripts/make_icons.py  (necesită Pillow și numpy)

Logo-ul e lat (A.M. Unghii pe un rând), deci într-o iconiță pătrată textul ieșea mic.
Aici textul se separă de acuarelă și se pune pe două rânduri („A.M.” / „Unghii”), puțin
îngroșat, peste acuarelă; „MANICHIURĂ” nu se mai pune (nu se citește la mărimea iconiței).
Variante: alb-patrat (implicit), alb-rotund, transparent; plus alb-maskabil (Android)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = 'assets/logo.png'
TEXT_RGB = (58, 58, 62)


def _fill_holes(rgba: np.ndarray, hole: np.ndarray, passes: int = 40) -> np.ndarray:
    """Umple zona textului cu culorile acuarelei din jur (estompare normalizată, repetată)."""
    out = rgba.copy()
    known = (~hole).astype(float)
    for _ in range(passes):
        w = Image.fromarray((known * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
        w = np.asarray(w, float) / 255
        acc = []
        for c in range(4):
            ch = Image.fromarray((out[..., c] * known).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
            acc.append(np.asarray(ch, float))
        est = np.dstack(acc) / np.clip(w, 1e-3, None)[..., None]
        newly = (known == 0) & (w > 0.05)
        out[newly] = est[newly]
        known = np.where(newly, 1.0, known)
        if known.all():
            break
    return out


def split_logo():
    im = np.asarray(Image.open(SRC).convert('RGBA'), float)
    rgb, a = im[..., :3], im[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    dark = ((mx < 140) & (mx - mn < 40) & (a > 128)).astype(np.uint8) * 255
    hole = np.asarray(Image.fromarray(dark).filter(ImageFilter.MaxFilter(5))) > 0
    brush = _fill_holes(im, hole)
    bg = brush[..., :3]
    # cât de „închis” e pixelul față de acuarela de sub el = opacitatea textului
    den = np.clip((bg - np.array(TEXT_RGB)).sum(-1), 1, None)
    ta = np.clip((bg - rgb).sum(-1) / den, 0, 1)
    ta = np.where(brush[..., 3] < 60, np.where(mx < 160, a / 255, 0), ta) * hole
    text = np.zeros_like(im)
    text[..., :3] = TEXT_RGB
    text[..., 3] = ta * 255
    brush_img = Image.fromarray(brush.astype(np.uint8))
    return brush_img.crop(brush_img.getbbox()), text.astype(np.uint8)


def _cut(text: np.ndarray, x0: int, x1: int, y1: int) -> Image.Image:
    part = Image.fromarray(text[:y1, x0:x1])
    part = part.crop(part.getbbox())
    r, g, b, al = part.split()
    al = al.filter(ImageFilter.MaxFilter(3))  # îngroșare ușoară, să se citească mic
    return Image.merge('RGBA', (r, g, b, al))


BRUSH, TEXT = split_logo()
# coloanele/rândurile textului în assets/logo.png: „A.M.” până la x≈440, „Unghii” de la x≈480,
# scrisul de mână până la y≈236 (dedesubt e „MANICHIURĂ”)
AM = _cut(TEXT, 0, 460, 240)
UN = _cut(TEXT, 470, TEXT.shape[1], 240)
DX, DY = 40, 132  # unde începe „Unghii” față de „A.M.” (px din logo-ul sursă)

# cât din iconiță ocupă logo-ul; maskabil = zona sigură Android (cercul de 80%)
FILL = {'alb-patrat': 0.88, 'alb-rotund': 0.80, 'transparent': 0.94, 'alb-maskabil': 0.66}


def make(variant: str, size: int, fill: float | None = None, brush: bool = True) -> Image.Image:
    S = size * 4  # desenăm mare, apoi micșorăm (margini netede)
    img = Image.new('RGBA', (S, S), (255, 255, 255, 0))
    if variant in ('alb-patrat', 'alb-maskabil'):
        img.paste((255, 255, 255, 255), (0, 0, S, S))
    elif variant == 'alb-rotund':
        ImageDraw.Draw(img).ellipse((0, 0, S - 1, S - 1), fill=(255, 255, 255, 255))
    box = S * (fill or FILL[variant])
    lw, lh = max(AM.width, DX + UN.width), DY + UN.height
    k = box / lw
    ox, oy = (S - lw * k) / 2, (S - lh * k) / 2
    if brush:
        bw, bh = int(box), int(lh * k * 0.92)
        img.alpha_composite(BRUSH.resize((bw, bh), Image.LANCZOS), ((S - bw) // 2, int(oy + lh * k * 0.06)))
    for part, (x, y) in ((AM, (0, 0)), (UN, (DX, DY))):
        p = part.resize((round(part.width * k), round(part.height * k)), Image.LANCZOS)
        img.alpha_composite(p, (round(ox + x * k), round(oy + y * k)))
    return img.resize((size, size), Image.LANCZOS)


for v in ('alb-patrat', 'alb-rotund', 'transparent'):
    for s in (192, 512):
        make(v, s).save(f'public/icons/{v}-{s}.png', optimize=True)
    make(v, 512).save(f'assets/icons/{v}.png', optimize=True)
for s in (192, 512):
    make('alb-maskabil', s).convert('RGB').save(f'public/icons/alb-maskabil-{s}.png', optimize=True)

# iconițele implicite (alb, pătrat)
make('alb-patrat', 192).convert('RGB').save('public/icon-192.png', optimize=True)
make('alb-patrat', 512).convert('RGB').save('public/icon-512.png', optimize=True)
make('alb-patrat', 180).convert('RGB').save('public/apple-touch-icon.png', optimize=True)
make('alb-patrat', 1024).convert('RGB').save('assets/icon.png', optimize=True)
make('alb-patrat', 96).convert('RGB').save('assets/favicon.png', optimize=True)
# Android nativ (iconiță adaptivă): zona sigură e cercul de 66% din mijloc
make('transparent', 1024, fill=0.60).save('assets/android-icon-foreground.png', optimize=True)
mono = make('transparent', 1024, fill=0.60, brush=False)
Image.merge('RGBA', (*Image.new('RGB', mono.size, 0).split(), mono.split()[3])).save(
    'assets/android-icon-monochrome.png', optimize=True)
print('gata')


# Logo pentru fundal închis (antetul aplicației): textul închis devine alb, acuarela rămâne.
def make_light_logo(path='assets/logo-light.png', width=480):
    import colorsys
    lg = Image.open(SRC).convert('RGBA')
    px = lg.load()
    for y in range(lg.height):
        for x in range(lg.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.18 and v < 0.62:
                px[x, y] = (255, 255, 255, a)
    lg = lg.crop(lg.split()[3].point(lambda v: 255 if v > 8 else 0).getbbox())
    lg.resize((width, round(width * lg.height / lg.width)), Image.LANCZOS).save(path, optimize=True)


make_light_logo()
