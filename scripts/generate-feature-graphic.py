"""
Generates a 1024x500 Google Play feature graphic for Atossa.
Composes the brand mark on a warm-rose gradient with wordmark + tagline.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "play-store" / "feature-graphic.png"
LOGO = ROOT / "assets" / "Atossa-logo.png"

W, H = 1024, 500

CREAM = (250, 246, 241)         # bordeauxMid #FAF6F1
ROSE_LIGHT = (251, 238, 241)    # cherryLighter #FBEEF1
BLUSH = (232, 165, 176)         # cherryLight #E8A5B0
ROSE = (176, 69, 90)            # cherry #B0455A
BORDEAUX = (122, 42, 61)        # cherryDark #7A2A3D
INK = (42, 31, 38)              # bordeaux #2A1F26


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_bg() -> Image.Image:
    img = Image.new("RGB", (W, H), CREAM)
    px = img.load()
    for y in range(H):
        for x in range(W):
            # diagonal interpolation: top-left = cream, bottom-right = blush via rose-light
            t = (x / W * 0.6) + (y / H * 0.4)
            if t < 0.5:
                c = lerp(CREAM, ROSE_LIGHT, t * 2)
            else:
                c = lerp(ROSE_LIGHT, BLUSH, (t - 0.5) * 2)
            px[x, y] = c
    return img


def load_font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    # Avenir Next .ttc — index 0 regular, 1 italic, 2 bold, 3 bold italic
    candidates = [
        ("/System/Library/Fonts/Avenir Next.ttc", 2 if weight == "bold" else 0),
        ("/System/Library/Fonts/Helvetica.ttc", 1 if weight == "bold" else 0),
        ("/System/Library/Fonts/HelveticaNeue.ttc", 1 if weight == "bold" else 0),
    ]
    for path, idx in candidates:
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    return ImageFont.load_default()


def compose():
    bg = gradient_bg()

    # Logo placement on left
    logo = Image.open(LOGO).convert("RGBA")
    logo_h = 400
    ratio = logo_h / logo.height
    logo_w = int(logo.width * ratio)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

    logo_x = 60
    logo_y = (H - logo_h) // 2
    bg.paste(logo, (logo_x, logo_y), logo)

    draw = ImageDraw.Draw(bg)

    # Tagline + sub on right (logo already shows "ATOSSA" so skip wordmark)
    text_x = logo_x + logo_w + 70
    tagline_font = load_font(58, "bold")
    sub_font = load_font(28, "regular")
    tiny_font = load_font(22, "regular")

    line1 = "Period &"
    line2 = "Cycle Tracker"
    sub = "Log periods, see patterns,"
    sub2 = "predict your next cycle."

    # Manual line heights (avoid bbox baseline issues)
    tagline_lh = 72
    sub_lh = 36
    total = tagline_lh * 2 + 36 + sub_lh * 2
    start_y = (H - total) // 2

    draw.text((text_x, start_y), line1, font=tagline_font, fill=BORDEAUX)
    draw.text((text_x, start_y + tagline_lh), line2, font=tagline_font, fill=BORDEAUX)
    draw.text((text_x, start_y + tagline_lh * 2 + 36), sub, font=sub_font, fill=ROSE)
    draw.text((text_x, start_y + tagline_lh * 2 + 36 + sub_lh), sub2, font=sub_font, fill=ROSE)

    # Enforce final dimensions in case earlier ops drifted
    if bg.size != (W, H):
        bg = bg.resize((W, H), Image.LANCZOS)
    bg.save(OUT, "PNG")
    from PIL import Image as _I
    check = _I.open(OUT)
    print(f"wrote {OUT} size={check.size} bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    compose()
