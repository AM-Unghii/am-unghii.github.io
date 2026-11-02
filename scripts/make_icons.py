"""Generează iconițele aplicației din assets/logo.png (logo mare, centrat).
Rulare: python3 scripts/make_icons.py  (necesită Pillow)
Variante: alb-patrat (implicit), alb-rotund, transparent."""
from PIL import Image, ImageDraw

SRC = 'assets/logo.png'
logo = Image.open(SRC).convert('RGBA')
logo = logo.crop(logo.split()[3].point(lambda v: 255 if v > 8 else 0).getbbox())

# cât din lățime ocupă logo-ul (rotund: mai mic, ca să nu iasă colțurile din cerc)
FILL = {'alb-patrat': 0.94, 'alb-rotund': 0.86, 'transparent': 0.96}


def make(variant: str, size: int) -> Image.Image:
    S = size * 4  # desenăm mare, apoi micșorăm (margini netede)
    img = Image.new('RGBA', (S, S), (255, 255, 255, 0))
    if variant == 'alb-patrat':
        img.paste((255, 255, 255, 255), (0, 0, S, S))
    elif variant == 'alb-rotund':
        ImageDraw.Draw(img).ellipse((0, 0, S - 1, S - 1), fill=(255, 255, 255, 255))
    w = int(S * FILL[variant])
    h = round(w * logo.height / logo.width)
    lg = logo.resize((w, h), Image.LANCZOS)
    img.alpha_composite(lg, ((S - w) // 2, (S - h) // 2))
    return img.resize((size, size), Image.LANCZOS)


for v in FILL:
    for s in (192, 512):
        make(v, s).save(f'public/icons/{v}-{s}.png', optimize=True)
    make(v, 512).save(f'assets/icons/{v}.png', optimize=True)

# iconițele implicite (alb, pătrat)
make('alb-patrat', 192).convert('RGB').save('public/icon-192.png', optimize=True)
make('alb-patrat', 512).convert('RGB').save('public/icon-512.png', optimize=True)
make('alb-patrat', 180).convert('RGB').save('public/apple-touch-icon.png', optimize=True)
make('alb-patrat', 1024).convert('RGB').save('assets/icon.png', optimize=True)
make('alb-patrat', 96).convert('RGB').save('assets/favicon.png', optimize=True)
print('gata')
