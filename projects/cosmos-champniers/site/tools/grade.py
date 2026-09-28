"""Étalonnage commun "Nuit cosmique" : fond rendus 3D et vraies photos en une seule série.
Noirs écrasés vers bleu nuit, ombres bleu profond, hautes lumières légèrement chaudes,
saturation réduite sauf bleus (néons) et tons chauds (nourriture) qui restent l'accent.
Usage : python3 grade.py <src> <dst.webp> [max_edge=2400] [strength=1]"""
import sys
import numpy as np
from PIL import Image

def grade(im, strength=1.0):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    # saturation sélective : garder bleus/cyans et oranges/rouges, calmer le reste
    mx, mn = a.max(-1, keepdims=True), a.min(-1, keepdims=True)
    r, g, b = a[..., :1], a[..., 1:2], a[..., 2:3]
    blue = np.clip((b - np.maximum(r, g)) * 3, 0, 1)
    warm = np.clip((r - b) * 2.5, 0, 1) * np.clip((r - g) * 4 + 0.3, 0, 1)
    keep = np.clip(blue + warm, 0, 1)
    sat = 0.62 + 0.55 * keep
    a = lum + (a - lum) * (1 + (sat - 1) * strength)
    # courbe : noirs écrasés, léger S
    a = np.clip(a, 0, 1)
    a = np.clip((a - 0.06 * strength) / (1 - 0.06 * strength), 0, 1)
    a = a ** (1 + 0.28 * strength)  # expo baissée : ambiance nuit
    a = np.clip(a * (1 + 0.18 * strength) - 0.09 * strength * (1 - a), 0, 1)  # contraste
    a = a * (1 - 0.35 * strength) + a * np.array([0.9, 0.97, 1.12]) * 0.35 * strength  # mi-tons froids
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    # split-toning : ombres -> bleu nuit, hautes lumières -> chaud
    shadow = np.array([0.02, 0.06, 0.16]) ; high = np.array([1.0, 0.9, 0.74])
    ws = np.clip(1 - lum / 0.5, 0, 1) ** 1.3 * 0.7 * strength
    wh = np.clip((lum - 0.55) / 0.45, 0, 1) * 0.3 * strength
    a = a * (1 - ws) + shadow * ws
    a = a * (1 - wh) + (a * high) * wh
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    edge = int(sys.argv[3]) if len(sys.argv) > 3 else 2400
    s = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    im = Image.open(src).convert("RGB")
    im.thumbnail((edge, edge), Image.LANCZOS)
    grade(im, s).save(dst, "WEBP", quality=82, method=6)
    print(dst, im.size)
