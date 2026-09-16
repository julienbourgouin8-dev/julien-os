import Image from "next/image";
import VitrineArc from "@/components/VitrineArc";
import CartBadge from "@/components/CartBadge";
import MobileMenu from "@/components/MobileMenu";
import MobileHeroTagline from "@/components/MobileHeroTagline";
import Marches from "@/components/Marches";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <>
      <a
        href="#vitrine"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Aller aux créations
      </a>

      <main className="flex-1">
        {/* HERO — nav + photo + texte fusionnés dans un seul bloc. Fond blanc
            sur mobile (le bas de la photo mobile est quasi blanc, le raccord
            passe inaperçu), paper à partir de sm comme le reste du site. */}
        <section id="hero" className="relative scroll-mt-0 overflow-hidden bg-white sm:bg-paper">
          {/* Sur mobile, hauteur calée sur le contenu réel (2026-09-16),
              plus un `88vh` fixe hérité de l'ancienne image plein cadre en
              `object-cover`. En `object-contain`, le conteneur doit faire au
              moins la hauteur réelle de l'image entière, sinon le navigateur
              bascule sur une mise à l'échelle par la hauteur au lieu de la
              largeur et l'image rétrécit en laissant des bandes vides sur
              les côtés (piège rencontré avec le fichier précédent, cf.
              historique). Nouvelle photo (Nano Banana Pro, 1536×2752, même
              ratio que l'original non rogné) : sac mesuré de 20% à 70% de la
              hauteur — conteneur à `180vw` (hauteur réelle du fichier,
              2752/1536), CTA à `126vw` pour déborder sur la marge de fond
              déjà présente sous le sac plutôt que d'ajouter du vide CSS. À
              partir de sm : photo desktop recadrée (v11, 2026-09-16) —
              mesuré au pixel près (scan de la marge de fond autour du
              sac) que le produit démarre à 393px du haut sur les 2236px
              du fichier v8 d'origine ; crop à 353px (40px de marge
              conservée) pour retirer exactement le fond vide au-dessus
              des anses sans jamais toucher au sac. Les tentatives
              précédentes (bump de `max-h-screen`, `object-bottom`, crop
              fixe de 300px) rognaient soit le produit soit rendaient la
              section plus haute que l'écran — cf. retours Julien
              "dépasse de l'écran" / "beaucoup trop" / "tout est coupé".
              `object-center` reste la valeur par défaut. Pas de
              `max-h-screen` : avec seulement 40px de marge restante
              au-dessus des anses, la moindre limite de hauteur rognait
              à nouveau dedans sur un écran pas assez haut (retour
              Julien : "tu regardes bien les images, c'est coupé"). Sans
              plafond, l'image entière est TOUJOURS visible sans rognage
              ; sur un écran court ça peut demander un petit scroll pour
              voir le bas du sac, mais plus aucune coupe dans le produit.
              `sm:pb-10` ajouté le 2026-09-16 pour garantir une marge
              après le sac indépendamment de la hauteur de fenêtre, puis
              retiré le même jour : le padding est rempli en `bg-paper`
              (#f3f3ee) uni, alors que le bas réel de la photo a un léger
              dégradé plus sombre (jusqu'à ~#eae9e5 par endroits) — la
              jonction entre les deux se voyait comme une bande nette
              (retour Julien : "une bande qui essaie d'être de la même
              couleur que le fond"). Retiré : la section suivante reprend
              juste après la photo, sans espace artificiel.
              hero-v15 (2026-09-16) : marges gauche/droite égalisées SANS
              zoom — au lieu de rogner à gauche (ce qui zoome, cf. tentative
              annulée plus bas), on étend la toile à droite de 236px en
              dupliquant la dernière colonne de pixels (fond quasi plat, le
              raccord est invisible). Marge mesurée égale des deux côtés
              (468px) après coup.
              hero-v16 (2026-09-16) : ~22% de fond vide sous les sacs
              retiré (dernier pixel de produit/ombre mesuré à la ligne
              1472 sur 1883 — rien au-delà, juste du fond) : rogné à 1542
              (70px de marge gardée). Ce n'était pas une bande ajoutée par
              du CSS (celle-là, `sm:pb-10`, avait déjà été retirée) mais du
              vide propre à la photo elle-même (retour Julien : la bande
              grise juste après les sacs, avant "Nos catégories"). Nouveau
              ratio 2988/1542 — la section suivante démarre juste après
              les sacs. */}
          <div className="relative h-[calc(180vw+1rem)] w-full sm:aspect-[2988/1542] sm:h-auto">
            <div className="hero-media absolute inset-0">
              {/* Version mobile v1 (2026-09-15) : recomposition 9:16 dédiée
                  (pochettes inclinées contre le sac) plutôt que la même
                  photo desktop rognée sur les côtés — voir décision mobile
                  du 2026-09-15 dans PROGRESS.md. v9 (2026-09-16) : la photo
                  de studio d'origine, retouchée par Julien dans Canva. Elle
                  remplace la v8 générée par IA, qui n'avait servi qu'à
                  tenter de contourner le problème de barre d'état iOS et
                  reproduisait mal la plaque de logo du sac. Même ratio
                  (1536×2752), les hauteurs calculées ci-dessus restent
                  valables. */}
              <Image
                src="/brand/hero-mobile-v9.png"
                alt="Sac cabas, portefeuille et pochette assortis, en simili cuir bleu et écru, CréA'deline"
                fill
                priority
                sizes="100vw"
                className="object-contain object-top sm:hidden"
              />
              <Image
                src="/brand/hero-v16.png"
                alt="Sac cabas, portefeuille et pochette assortis, en simili cuir bleu et écru, CréA'deline"
                fill
                priority
                sizes="100vw"
                className="hidden object-cover sm:block"
              />
            </div>

            {/* logo — coin, hors zone bandoulière. Masqué sur mobile pour ce
                test (retour Julien 2026-09-15) : redondant avec le grand
                titre juste en dessous sur un écran étroit. À réintroduire
                plus tard (potentiellement seulement une fois scrollé
                au-delà du hero) selon ce que Julien décide en le voyant. */}
            <div className="absolute inset-x-0 top-0 hidden items-center px-10 py-5 sm:flex">
              <a href="#hero" className="font-script text-5xl font-bold text-ink">
                CréA&apos;deline
              </a>
            </div>

            {/* nav — 4 liens, écarts réguliers (2026-09-16). Recalculée
                après hero-v15 (toile étendue à droite, marges égalisées) :
                la bandoulière est repassée de ~50%-59% à ~46.8%-54.4% de
                la largeur (mesurée au pixel), donc toute la nav a été
                redécalée d'autant pour rester régulière et centrée sur le
                nouveau centre de l'image (~50%) — écarts de 16 à 18 points
                entre chaque lien, Créations/Marchés à gauche de la
                bandoulière, Contact/À propos à droite. Panier en icône
                seule (`hideLabel`). */}
            <nav className="absolute inset-x-0 top-[1.5rem] hidden font-display text-sm font-medium uppercase tracking-[0.18em] text-ink sm:top-[1.9rem] sm:block">
              <a href="#vitrine" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "25%" }}>
                Créations
              </a>
              <a href="#marches" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "41%" }}>
                Marchés
              </a>
              <a href="#contact" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "59%" }}>
                Contact
              </a>
              {/* TODO Julien : destination à confirmer, pas de section
                  "À propos" sur le site pour l'instant — pointe vers
                  #apropos qui n'existe pas encore. */}
              <a href="#apropos" className="absolute -translate-x-1/2 transition-colors hover:text-rust" style={{ left: "75%" }}>
                À propos
              </a>
              {/* top-[-8px] (2026-09-16) : l'icône (36px) est plus haute
                  que le texte des 4 liens (text-sm) ; sans ça, sa position
                  "statique" par défaut (aucun `top` explicite, comme les
                  liens texte) la fait paraître plus basse qu'eux (retour
                  Julien : "le bouton panier est un peu en bas"). Valeur
                  calée à l'œil pour aligner le centre optique de l'icône
                  sur le milieu de la ligne de texte des liens. */}
              <CartBadge
                hideLabel
                className="absolute right-6 top-[-8px] flex items-center gap-2 transition-colors hover:text-rust sm:right-10"
              />
            </nav>

            {/* Header mobile : hamburger + logo texte + panier (retour Julien
                2026-09-16, 2e test Canva — remplace le grand wordmark par le
                petit logo, la tagline éclatée juste en dessous fait office
                de titre à la place). `env(safe-area-inset-top)` : garantit
                que les icônes restent sous l'encoche/île dynamique quel que
                soit le modèle d'iPhone, au lieu d'un `top` fixe qui suppose
                une hauteur d'encoche donnée. */}
            <div
              className="absolute inset-x-0 top-0 flex items-center justify-between px-6 sm:hidden"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
            >
              <MobileMenu />
              {/* Décalage/taille pilotés par `MobileHeroTagline` via des
                  variables CSS (retour Julien 2026-09-16 : "il faut qu'on
                  décale aussi le logo") — les deux composants ne
                  partagent pas de props/contexte, `--tag-logo-*` est le
                  seul canal entre eux. Fallbacks = rendu d'avant (centré,
                  text-3xl) si jamais ce composant venait à disparaître. */}
              <a
                href="#hero"
                className="font-script font-bold text-ink"
                style={{
                  transform: "translateX(var(--tag-logo-x, 0vw))",
                  fontSize: "var(--tag-logo-size, 1.875rem)",
                }}
              >
                CréA&apos;deline
              </a>
              <CartBadge className="text-ink transition-colors hover:text-rust" />
            </div>

            {/* Tagline éclatée autour du sac, mobile uniquement (retour Julien
                2026-09-16). Repères mesurés sur `hero-mobile-v9.png`
                (1536×2752, en % de la hauteur = % du conteneur puisque
                celui-ci est dimensionné exactement sur le ratio de
                l'image) : bas du header ≈8%, pointe de la boucle des anses
                ≈24.5%, haut du sac ≈51.5%, bas du sac ≈76%. Valeurs par
                défaut = position/taille validées avec Julien ce jour-là
                (détail du calcul dans l'historique git de ce fichier).
                Extrait dans `MobileHeroTagline` (retour Julien : les
                allers-retours screenshot→mesure→code→déploiement étaient
                trop lents) — avec `?tune=1` dans l'URL sur le site déployé,
                Julien règle lui-même position/taille de chaque ligne via
                des curseurs, il m'envoie les valeurs copiées et je les fixe
                ici. Le bloc tagline desktop (plus bas, à droite du sac)
                reste inchangé — ceci le remplace seulement sous `sm`. */}
            <MobileHeroTagline />

            {/* wordmark desktop — posé dans la boucle des anses, effet
                d'écriture par mot (pas lettre par lettre : ça cassait les
                ligatures de l'italique). `top` en % pur de la hauteur de la
                section. Masqué sur mobile (remplacé par la tagline éclatée
                ci-dessus + le petit logo dans le header, test Canva du
                2026-09-16). */}
            <h1
              className="absolute inset-x-0 top-[max(13%,6rem)] hidden select-none text-center font-display font-black leading-[0.82] text-ink sm:top-[max(15%,6rem)] sm:block"
              style={{
                fontSize: "clamp(3.2rem, 11.5vw, 9.5rem)",
                letterSpacing: "0.01em",
                transform: "translateX(2%)",
              }}
            >
              <span className="write-on">CréA&apos;</span>
              <span className="write-on italic text-denim" style={{ animationDelay: "0.35s" }}>
                deline
              </span>
            </h1>

            {/* CTA — tagline + bouton (retour Julien 2026-09-16). Le sac
                s'arrête à 70% de la hauteur du fichier v8 (1536×2752) →
                `126vw` (0.70 × 180vw) en bas du sac. Collé juste après
                (`+1rem`), ça laissait un écart minuscule en haut du bloc
                (~1rem) contre un gros vide en bas (le conteneur doit rester
                à la pleine hauteur du fichier, 180vw, pour ne pas déclencher
                le bug de rétrécissement en `object-contain` — cf.
                décision juste au-dessus) : `+4rem` centre le bloc
                texte+bouton dans l'espace disponible sous le sac au lieu de
                le coller tout en haut de cet espace, pour un écart similaire
                en haut et en bas (retour Julien : "mal positionnés").
                `sm:right-32`/`sm:top-[42%]` (2026-09-16, étaient
                `right-10`/`58%`) : le groupe de sacs sur la photo n'est
                pas centré (marge de 468px à gauche contre 232px à droite
                sur les 2752px du fichier, mesuré au pixel — centre du
                produit décalé d'environ 118px vers la droite), donc
                coller le texte pile au bord droit accentuait le
                déséquilibre (retour Julien : "tout est un peu plus à
                droite, plus de marge à gauche qu'à droite"). À 58% (à
                hauteur de la petite pochette), la moindre marge
                supplémentaire vers la gauche fait chevaucher la pochette
                — remonté à 42% (à hauteur des anses/de l'épaule du sac,
                zone dégagée) pour avoir la place de vraiment recentrer le
                bloc sans toucher au produit. Recalculé à 51% après le
                rognage du bas de la photo (hero-v16) : même ligne
                physique de la photo qu'avant (42% de 1883px), juste
                réexprimée en % de la nouvelle hauteur, plus courte
                (1542px). */}
            <div className="absolute inset-x-0 top-[calc(126vw+4rem)] hidden px-6 text-center sm:inset-x-auto sm:right-32 sm:top-[51%] sm:block sm:max-w-[19rem] sm:-translate-y-1/2 sm:px-0 sm:text-right">
              <p
                className="hero-rise font-display text-xl font-medium italic leading-tight text-ink sm:text-3xl sm:leading-normal"
                style={{ animationDelay: "1.3s" }}
              >
                Des{" "}
                <span className="not-italic font-sans font-bold text-denim">
                  créations
                </span>{" "}
                qui vous correspondent
              </p>
              <a
                href="#vitrine"
                className="hero-pop group mt-4 items-center gap-2 rounded-full bg-denim px-8 py-3.5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(79,108,143,0.35)] transition-transform hover:-translate-y-0.5 sm:mt-5"
                style={{ animationDelay: "1.6s" }}
              >
                Voir les créations
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* VITRINE — essai socle + survol, pas final */}
        <section id="vitrine" className="scroll-mt-20 bg-paper pb-8">
          <VitrineArc />
        </section>

        <Marches />
      </main>

      <ContactSection />
    </>
  );
}
