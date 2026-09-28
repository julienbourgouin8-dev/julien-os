"""Exporte la sélection de photos étalonnées (grade.py) : <nom>.webp (2000px) + <nom>-sm.webp (1000px)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from grade import grade
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
IG = "assets/instagram/cosmos_"
SC = "site-scrape/images/"
M = {
 # hero / tunnel
 "tunnel-render": IG+"DaKZ5IHDA98_3.jpg", "tunnel-render-wide": IG+"DabKnUTjGVo_1.jpg",
 "tunnel-render-b": IG+"Daq2j12DDne_5.jpg", "tunnel-reel": IG+"Dav5BN3DHrR_5.jpg",
 "tunnel-reel-2": SC+"salle/salle-tunnel.webp", "tunnel-arches": IG+"DatMeHljMFV_5.jpg",
 # atterrissage / salle
 "salle-planetes": IG+"Daq2j12DDne_3.jpg", "salle-planetes-b": IG+"DaFyy94DOR-_2.jpg",
 "salle-planetes-reel": SC+"uploads/hero-cosmos.webp", "salle-orbites": IG+"Daq2j12DDne_2.jpg",
 "salle-bleue": IG+"DatMeHljMFV_2.jpg", "salle-bleue-b": IG+"DatMeHljMFV_6.jpg",
 "salle-neons": SC+"uploads/21e7f42ee4225dd2297897e1e8820dee.webp", "salle-allee": SC+"salle/salle.webp",
 "salle-portail": IG+"DaM_JTgjKfA_4.jpg", "salle-cerisier": IG+"DaM_JTgjKfA_1.jpg",
 "salle-lanternes": IG+"DaFyy94DOR-_5.jpg", "salle-bois": IG+"DaKZ5IHDA98_4.jpg",
 "salle-bar": IG+"DaFyy94DOR-_4.jpg", "salle-bar-wide": IG+"DabKnUTjGVo_3.jpg", "salle-bar-b": IG+"Daq2j12DDne_6.jpg",
 "salle-lounge": IG+"DaKZ5IHDA98_2.jpg", "salle-tables": IG+"DaM_JTgjKfA_3.jpg", "salle-tables-wide": IG+"DabKnUTjGVo_4.jpg",
 "salle-arcade": IG+"DaKZ5IHDA98_1.jpg", "salle-vitrage": IG+"Dav5BN3DHrR_4.jpg",
 "allee-sushi-render": IG+"DaFyy94DOR-_3.jpg", "allee-sushi-render-wide": IG+"DabKnUTjGVo_2.jpg",
 "logo-mur": IG+"DaFyy94DOR-_1.jpg", "logo-constellation": IG+"Daq2j12DDne_1.jpg",
 "logo-neon": IG+"Dav5BN3DHrR_1.jpg", "facade": IG+"DatMeHljMFV_1.jpg",
 # événements
 "prive-ecran": IG+"DaM_JTgjKfA_2.jpg", "prive-table-ronde": IG+"Daq2j12DDne_4.jpg",
 "prive-reel": SC+"uploads/salles-privees.webp",
 # buffet
 "buffet-allee": IG+"Dav5BN3DHrR_2.jpg", "buffet-lanternes": IG+"Dav5BN3DHrR_3.jpg",
 "buffet-long": IG+"DatMeHljMFV_3.jpg", "buffet-long-b": IG+"DatMeHljMFV_4.jpg",
 "buffet-comptoir": SC+"salle/buffet.webp",
 "sushi-saumon": SC+"uploads/f9cb0989173933a2a2a123e16d76eb94.webp",
 "sushi-makis": SC+"salle/sushi2.webp", "sashimis": SC+"salle/sushi3.webp", "sushi-sashimis": SC+"salle/sushi4.webp",
 "wok": SC+"salle/wok.webp", "grill": SC+"salle/grill.webp", "viandes-griller": SC+"salle/brochettes-cru.webp",
 "fruits-de-mer": SC+"salle/fruits-de-mer.webp", "pizzas": SC+"salle/pizzas.webp",
 "desserts": SC+"salle/desserts.webp", "fromages": SC+"salle/fromages.webp", "fruits": SC+"salle/fruits.webp",
 "espace-bg": SC+"planetes.jpeg",
}
# Sources molles affichées plein écran : netteté légère après étalonnage + qualité WebP plus haute
SHARP = {"salle-planetes", "salle-planetes-reel"}
from PIL import ImageFilter
out = os.path.join(ROOT, "site/assets/img")
only = set(sys.argv[1:])  # ex. `python3 export-images.py salle-planetes` pour ne réexporter qu'une image
for name, src in M.items():
    if only and name not in only: continue
    im = Image.open(os.path.join(ROOT, src)).convert("RGB")
    for suf, edge in (("", 2000), ("-sm", 1000)):
        c = im.copy(); c.thumbnail((edge, edge), Image.LANCZOS)
        g = grade(c)
        if name in SHARP: g = g.filter(ImageFilter.UnsharpMask(radius=1.4, percent=70, threshold=2))
        g.save(os.path.join(out, f"{name}{suf}.webp"), "WEBP", quality=90 if name in SHARP else 80, method=6)
    print(name, im.size)
