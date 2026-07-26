# Du design Figma au code — le workflow observé (réf. VANTA)

Analysé sur la transcription complète de la vidéo (titre : "Claude Code: How
to Create Beautiful Websites as a Designer"). Le site est designé
entièrement dans Figma d'abord, puis implémenté par Claude Code — utile pour
site-adeline si Julien veut passer par un mockup avant de coder, plutôt que
de coder direct.

## Le process, dans l'ordre

1. **Design complet dans Figma d'abord** — hero, palette, typo, toutes les
   sections, avant d'écrire une ligne de code.
2. **Figma Dev Mode → prompt copié via MCP** : Dev Mode génère un prompt
   prêt à coller dans Claude Code, qui contient un lien vers le design
   (`figma.com/design/...?node-id=...&m=dev`) — Claude a donc accès aux
   vraies valeurs (espacements, couleurs, texte exact), pas une
   interprétation d'une capture d'écran.
3. **Premier prompt, un seul système de contraintes posé d'entrée** :

   > "Make a new folder for this site called RosewoodCabins. Implement this
   > design from Figma [lien Dev Mode]. Let's start section by section,
   > starting with the hero. Let's use a 1400px max-width for wrapped
   > content. 8px spacing/sizing system. Let's use Astro for the build."

   Trois choses posées avant de commencer : le nom du dossier, le
   framework, et le système d'espacement — pas laissées à la libre
   interprétation de Claude section par section.
4. **Section par section, jamais "fais tout le site d'un coup"** — le hero
   en premier, validé (même bugué au départ — image de fond "en dur" à
   corriger), puis "continue avec le reste des sections".
5. **Le responsive mobile est venu sans design mobile dédié** — Claude a
   empilé les sections raisonnablement à partir d'un Figma desktop-only.
   Ne pas prendre ça pour acquis sur une mise en page complexe : vérifier
   quand même, ne pas supposer.

## Les prompts d'amélioration qui marchent — le pattern commun

Chaque prompt efficace observé fait trois choses : nomme la section
précise, décrit le bug/comportement actuel avec un détail concret, énonce
l'état final voulu (et une contrainte de séquencement si besoin) :

- *"Let's make our hero image max width 1600px, but fade the edges to
  black on the sides. Position it so it's always positioned at top of
  image."* — contrainte de taille + effet + positionnement, en une phrase.
- *"On the Home is where the heart is section. We have these lines on the
  left and right, I want the lines to extend to top and bottom of that
  section. Right now it's getting clipped where the padding is."* — nomme
  la section, décrit le symptôme visuel exact ("clipped"), localise la
  cause probable ("where the padding is") sans que Julien/le créateur ait
  besoin de connaître le CSS exact en cause.
- *"For the gallery in this section, make the arrow icons function to
  change the 2 images to new ones, use the images we currently have in our
  assets folder and label them appropriately. Each arrow click should
  change both images."* — précise la source des assets (pas d'invention),
  demande explicitement que les deux images changent ensemble.
- *"I want to add some tasteful animations to the page. All sections
  should appear in nicely and appropriately. I also want our hero to act
  as a kind of loader to the page. I want our hero image to appear full
  screen height and width and then scale down into its position where it
  sits currently. This triggers before all the other elements animate on
  screen."* — le prompt le plus riche : décrit l'état de départ, l'état
  d'arrivée, ET la contrainte de séquencement ("this triggers before").

**Le point commun : jamais "améliore ça", toujours une description
observable du problème ou de l'effet voulu.** Un prompt vague produit un
résultat vague.

### Deux prompts trouvés en repassant sur la vidéo complète via `video-teardown`

Absents des captures prises à la main la première fois — la passe
automatisée sur la vidéo entière est allée plus loin :

- Sur le ticker défilant en bas de page : consigne de retirer le
  comportement par défaut qui met le défilement en pause au survol — le
  ticker doit défiler **en continu, sans pouvoir être arrêté au survol**.
  Principe généralisable : un marquee/ticker décoratif n'a pas besoin
  d'affordance d'interaction ; le geste par défaut d'un framework (pause
  au hover) n'est pas toujours souhaitable et vaut la peine d'être
  explicitement désactivé si le ticker est purement ambiant.
- Sur la pilule de nav : consigne de rendre **toute la pilule cliquable**
  (pas juste le bouton "Menu") pour ouvrir un panneau listant les autres
  propriétés (miniatures + nom), et de ne fermer ce panneau **que** via un
  bouton "Close" explicite — jamais par re-clic sur la pilule ni clic à
  l'extérieur. Principe généralisable : agrandir la zone cliquable d'un
  élément de nav compact augmente le confort tactile/souris sans changer
  son apparence, et un point de sortie unique et explicite (pas de clic
  hors-zone) évite qu'un menu se ferme accidentellement pendant que
  l'utilisateur le consulte.

Aussi observé au passage : une consigne pour harmoniser la couleur de survol
entre plusieurs boutons différents (flèches de galerie, bouton "Check
Availability", pilule de nav) sur la même valeur — rappel qu'un état
d'interaction (hover, focus) mérite d'être systémisé une fois choisi, pas
redéfini section par section.

## Déploiement (mentionné, pas creusé en détail)

GitHub repo → Cloudflare Pages (hébergement gratuit) → domaine custom
connecté. Pour un vrai client qui doit éditer son propre contenu, ajouter un
CMS headless par-dessus (Sanity mentionné) plutôt que rebuild à la main à
chaque nouvelle propriété/page.

## Idée à creuser séparément, pas encore explorée pour site-adeline

Le créateur connecte un outil de transcription de réunion (Granola) à
Claude Code via MCP, donc pendant le build il peut demander "est-ce que ça
correspond à ce que le client a demandé ?" et Claude va chercher directement
dans les notes de la vraie réunion client. Idée transposable aux rendez-vous
BTP de Julien (ETS Lévesque et suivants) — à explorer comme sujet à part,
pas un réflexe visuel/animation comme le reste de ce skill.
