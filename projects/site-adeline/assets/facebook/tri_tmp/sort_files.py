import os
import shutil
from classification import classification, CATS

RAW = "/Users/julien/julien-os/projects/site-adeline/assets/facebook/raw"
OUT_ROOT = "/Users/julien/julien-os/projects/site-adeline/assets/facebook/tri"

index_path = "/Users/julien/julien-os/projects/site-adeline/assets/facebook/tri_tmp/index.txt"
files = {}
with open(index_path) as f:
    for line in f:
        i, name = line.rstrip("\n").split("\t")
        files[int(i)] = name

for cat_key, cat_label in CATS.items():
    os.makedirs(os.path.join(OUT_ROOT, cat_key), exist_ok=True)

counts = {k: 0 for k in CATS}
for idx, fname in files.items():
    cat = classification.get(idx, "autre")
    src = os.path.join(RAW, fname)
    dst = os.path.join(OUT_ROOT, cat, fname)
    shutil.copy2(src, dst)
    counts[cat] += 1

for k, v in counts.items():
    print(f"{CATS[k]} ({k}): {v}")
