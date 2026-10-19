"""Generates the installable-app images (apple-touch-icon, maskable icon, iOS start screens).

Run: python scripts/make-app-images.py  (needs Pillow and Georgia, present on Windows).
"""
import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SPLASH = PUBLIC / "splash"
BG = (7, 14, 31)
GOLD = (240, 168, 50)
LINE = (31, 48, 84)
CYAN = (45, 212, 255)
FONT = pathlib.Path("C:/Windows/Fonts/georgiaz.ttf")

# Portrait screens of current iPhones: pixel width, pixel height, CSS width, CSS height, pixel ratio.
SCREENS = [
    (1320, 2868, 440, 956, 3),
    (1206, 2622, 402, 874, 3),
    (1290, 2796, 430, 932, 3),
    (1179, 2556, 393, 852, 3),
    (1284, 2778, 428, 926, 3),
    (1170, 2532, 390, 844, 3),
    (1125, 2436, 375, 812, 3),
    (1242, 2688, 414, 896, 3),
    (828, 1792, 414, 896, 2),
    (750, 1334, 375, 667, 2),
]


def mark(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float):
    """The FINE monogram: an italic gold F above a short cyan rule, centred on (cx, cy)."""
    font = ImageFont.truetype(str(FONT), int(size))
    box = draw.textbbox((0, 0), "F", font=font)
    width = box[2] - box[0]
    height = box[3] - box[1]
    draw.text((cx - width / 2 - box[0], cy - height / 2 - box[1] - size * 0.06), "F", font=font, fill=GOLD)
    rule_w = size * 0.78
    rule_h = max(2, size * 0.037)
    top = cy + height / 2 + size * 0.05
    draw.rounded_rectangle((cx - rule_w / 2, top, cx + rule_w / 2, top + rule_h), radius=rule_h / 2, fill=CYAN)


def icon(size: int, safe: float, path: pathlib.Path):
    image = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(image)
    inset = size * (1 - safe) / 2 + size * 0.03
    draw.rounded_rectangle((inset, inset, size - inset, size - inset), radius=size * 0.16, outline=LINE, width=max(2, size // 128))
    mark(draw, size / 2, size / 2, size * 0.52 * safe)
    image.save(path, optimize=True)


def splash(width: int, height: int, path: pathlib.Path):
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    base = min(width, height)
    cx, cy = width / 2, height * 0.44
    tile = base * 0.34
    draw.rounded_rectangle((cx - tile / 2, cy - tile / 2, cx + tile / 2, cy + tile / 2), radius=tile * 0.22, outline=LINE, width=max(2, int(base / 220)))
    mark(draw, cx, cy, tile * 0.56)
    font = ImageFont.truetype(str(FONT), int(base * 0.1))
    box = draw.textbbox((0, 0), "FINE", font=font)
    draw.text((cx - (box[2] - box[0]) / 2 - box[0], cy + tile * 0.75), "FINE", font=font, fill=GOLD)
    image.quantize(colors=32).save(path, optimize=True)


def main():
    SPLASH.mkdir(exist_ok=True)
    icon(180, 0.86, PUBLIC / "apple-touch-icon.png")
    icon(512, 0.62, PUBLIC / "icon-maskable-512.png")
    icon(192, 0.62, PUBLIC / "icon-maskable-192.png")
    entries = []
    for width, height, css_w, css_h, ratio in SCREENS:
        name = f"splash-{width}x{height}.png"
        splash(width, height, SPLASH / name)
        entries.append({
            "url": f"/splash/{name}",
            "media": f"(device-width: {css_w}px) and (device-height: {css_h}px) and (-webkit-device-pixel-ratio: {ratio}) and (orientation: portrait)",
        })
    (ROOT / "src" / "app" / "startup-images.json").write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
