"""
Sinh bộ nhận diện thương hiệu (logo, favicon, PWA icons, OG image) cho pdf.ltp-soft.com
từ ảnh gốc trong thư mục /asset.

Chạy:  python scripts/gen-brand-assets.py
Yêu cầu: Pillow (pip install pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC_LOGO = ROOT / "asset" / "logo nobackgroud.png"   # logo đầy đủ "LTP-Soft"
SRC_ICON = ROOT / "asset" / "fabico.ico"             # biểu tượng "LTP"
OUT = ROOT / "public"
OUT_BRAND = OUT / "brand"
OUT_BRAND.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path("C:/Windows/Fonts")


def font(name, size):
    for n in name:
        p = FONT_DIR / n
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def trim(im):
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop(bbox) if bbox else im


def square(im, size, pad_ratio=0.06, bg=(0, 0, 0, 0)):
    im = trim(im)
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad_ratio))
    scale = inner / max(im.width, im.height)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    canvas.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas


# ---------- 1. Logo header (full LTP-Soft) ----------
logo = trim(Image.open(SRC_LOGO).convert("RGBA"))
for h in (96, 192):
    w = round(logo.width * h / logo.height)
    lg = logo.resize((w, h), Image.LANCZOS)
    suffix = "" if h == 96 else "@2x"
    lg.save(OUT_BRAND / f"ltp-soft-logo{suffix}.png", optimize=True)
    lg.save(OUT_BRAND / f"ltp-soft-logo{suffix}.webp", quality=90, method=6)

# ---------- 2. Icon "LTP" ----------
# Tách phần chữ "LTP" từ logo gốc độ phân giải cao: xoá chữ "-Soft" màu bạc
# (pixel ít bão hoà màu) ở góc dưới bên phải.
icon_src = Image.open(SRC_LOGO).convert("RGBA")
px = icon_src.load()
for y in range(int(icon_src.height * 0.64), icon_src.height):
    for x in range(int(icon_src.width * 0.55), icon_src.width):
        r, g, b, a = px[x, y]
        if a and (max(r, g, b) - min(r, g, b)) < 40:
            px[x, y] = (0, 0, 0, 0)
if not SRC_LOGO.exists():  # fallback
    icon_src = Image.open(SRC_ICON).convert("RGBA")

# favicon.ico đa kích thước (nền trong suốt)
ico_base = square(icon_src, 256, pad_ratio=0.02)
ico_base.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
square(icon_src, 32, 0.02).save(OUT / "favicon-32x32.png", optimize=True)
square(icon_src, 16, 0.0).save(OUT / "favicon-16x16.png", optimize=True)

# Apple touch icon & PWA icons: nền trắng (iOS không hỗ trợ trong suốt)
WHITE = (255, 255, 255, 255)
square(icon_src, 180, 0.10, WHITE).convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
square(icon_src, 192, 0.10, WHITE).save(OUT / "icon-192.png", optimize=True)
square(icon_src, 512, 0.10, WHITE).save(OUT / "icon-512.png", optimize=True)
# maskable: vùng an toàn 80% => padding lớn hơn
square(icon_src, 512, 0.20, WHITE).save(OUT / "icon-maskable-512.png", optimize=True)

# ---------- 3. Open Graph image 1200x630 ----------
W, H = 1200, 630
og = Image.new("RGBA", (W, H), (2, 6, 23, 255))  # slate-950
d = ImageDraw.Draw(og)
# dải gradient đỏ -> xanh ở đáy theo màu logo
for x in range(W):
    t = x / (W - 1)
    r = int(190 * (1 - t) + 37 * t)
    g = int(18 * (1 - t) + 99 * t)
    b = int(60 * (1 - t) + 235 * t)
    d.line([(x, H - 14), (x, H)], fill=(r, g, b, 255))
# quầng sáng nhẹ
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse((-200, -250, 600, 450), fill=(190, 18, 60, 70))
gd.ellipse((700, 150, 1500, 850), fill=(37, 99, 235, 70))
og.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))

lg = logo.copy()
lg.thumbnail((420, 220), Image.LANCZOS)
og.alpha_composite(lg, (70, 70))

f_title = font(["segoeuib.ttf", "arialbd.ttf"], 66)
f_sub = font(["segoeui.ttf", "arial.ttf"], 34)
f_url = font(["segoeuib.ttf", "arialbd.ttf"], 34)
d = ImageDraw.Draw(og)
d.text((70, 330), "Ghép File PDF Miễn Phí", font=f_title, fill=(255, 255, 255))
d.text((70, 408), "Không cần đăng ký • Xử lý 100% trên trình duyệt", font=f_sub, fill=(203, 213, 225))
d.text((70, 470), "Nối • Tách • Nén • Xoay • PDF sang Ảnh", font=f_sub, fill=(148, 163, 184))

# minh hoạ: 2 tài liệu PDF ghép thành 1
f_doc = font(["segoeuib.ttf", "arialbd.ttf"], 30)


def doc(x, y, color, label, w=150, h=190):
    d.rounded_rectangle((x + 8, y + 10, x + w + 8, y + h + 10), radius=16, fill=(0, 0, 0, 120))
    d.rounded_rectangle((x, y, x + w, y + h), radius=16, fill=(248, 250, 252))
    d.polygon([(x + w - 40, y), (x + w, y + 40), (x + w - 40, y + 40)], fill=(203, 213, 225))
    for i in range(4):
        d.rounded_rectangle((x + 20, y + 60 + i * 22, x + w - 20 - (i % 2) * 30, y + 70 + i * 22), radius=5, fill=(203, 213, 225))
    d.rounded_rectangle((x + 18, y + h - 52, x + 98, y + h - 16), radius=8, fill=color)
    d.text((x + 30, y + h - 52), label, font=f_doc, fill=(255, 255, 255))


doc(855, 180, (190, 18, 60), "PDF", w=130, h=170)
doc(875, 365, (37, 99, 235), "PDF", w=130, h=140)
d.text((1010, 318), "→", font=font(["segoeuib.ttf", "arialbd.ttf"], 56), fill=(226, 232, 240))
doc(1065, 240, (124, 58, 237), "PDF", w=115, h=220)
# badge URL
url = "pdf.ltp-soft.com"
tw = d.textlength(url, font=f_url)
d.rounded_rectangle((W - tw - 130, 70, W - 70, 130), radius=30, fill=(190, 18, 60, 255))
d.text((W - tw - 100, 78), url, font=f_url, fill=(255, 255, 255))
og.convert("RGB").save(OUT_BRAND / "og-image.jpg", quality=88, optimize=True)

print("Done ->", OUT)
