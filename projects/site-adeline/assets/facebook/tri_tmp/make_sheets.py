import os
from PIL import Image, ImageDraw, ImageFont

RAW = "/Users/julien/julien-os/projects/site-adeline/assets/facebook/raw"
OUT = "/Users/julien/julien-os/projects/site-adeline/assets/facebook/tri_tmp"

files = sorted(os.listdir(RAW))
files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png"))]

with open(os.path.join(OUT, "index.txt"), "w") as idx:
    for i, f in enumerate(files):
        idx.write(f"{i}\t{f}\n")

THUMB = 220
COLS = 5
ROWS = 5
PER_SHEET = COLS * ROWS
PAD = 6
LABEL_H = 28

try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
except Exception:
    font = ImageFont.load_default()

sheet_w = COLS * (THUMB + PAD) + PAD
sheet_h = ROWS * (THUMB + LABEL_H + PAD) + PAD

num_sheets = (len(files) + PER_SHEET - 1) // PER_SHEET

for s in range(num_sheets):
    sheet = Image.new("RGB", (sheet_w, sheet_h), (30, 30, 30))
    draw = ImageDraw.Draw(sheet)
    chunk = files[s * PER_SHEET:(s + 1) * PER_SHEET]
    for j, fname in enumerate(chunk):
        idx_global = s * PER_SHEET + j
        col = j % COLS
        row = j // COLS
        x = PAD + col * (THUMB + PAD)
        y = PAD + row * (THUMB + LABEL_H + PAD)
        try:
            im = Image.open(os.path.join(RAW, fname)).convert("RGB")
            im.thumbnail((THUMB, THUMB))
            tw, th = im.size
            ox = x + (THUMB - tw) // 2
            oy = y + (THUMB - th) // 2
            sheet.paste(im, (ox, oy))
        except Exception as e:
            draw.rectangle([x, y, x + THUMB, y + THUMB], outline=(255, 0, 0))
        draw.rectangle([x, y, x + THUMB, y + THUMB], outline=(80, 80, 80))
        draw.rectangle([x, y + THUMB, x + THUMB, y + THUMB + LABEL_H], fill=(0, 0, 0))
        draw.text((x + 4, y + THUMB + 4), f"#{idx_global}", fill=(255, 255, 0), font=font)
    sheet.save(os.path.join(OUT, f"sheet_{s:02d}.jpg"), quality=85)

print(f"{num_sheets} sheets, {len(files)} files total")
