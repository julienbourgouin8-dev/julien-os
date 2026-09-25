# Reprise Blender — hero Driving Sens

Dernière mise à jour : 2026-09-14. Ce fichier est la source de vérité pour reprendre le blocking
dans une nouvelle tâche Codex. Lire aussi `AGENTS.md` et `plan-tournage-hero.md`, mais privilégier
les corrections ci-dessous lorsqu'elles contredisent les anciens comptes rendus.

## État actuel

- Fichier Blender : `assets/blender/drivingsens_hero_blocking.blend`
- Playblast à contrôler : `assets/blender/render/hero_blocking_playblast.mp4`
- Durée actuelle : 586 images, 24 fps, environ 24,4 secondes.
- Images de contrôle : `assets/blender/exports/`.
- Aucun rendu vidéo IA ni appel Higgsfield n'a été lancé.

Le premier blocking a déjà reçu une passe de correction : coque extérieure masquée en cockpit,
habillage cockpit masqué en extérieur, dimensions de la voiture corrigées, profondeur de champ
désactivée, volant réduit, marquages de route ajoutés et apparition des quatre portiques décalée.
Ces corrections existent dans le `.blend`, mais elles ne suffisent pas.

## Contrôle visuel réel du MP4 final

Contrôle effectué sur les images 10, 60, 79, 98, 110, 192, 275, 346, 431, 510 et 586.
Conclusion : la v2 reste cassée visuellement. Ne pas reprendre la phrase des anciens logs disant
que tout est propre.

### Problèmes bloquants

1. **Les textes des quatre portiques sont occultés.** Un grand rectangle gris se trouve devant le
   centre de chaque titre et de chaque phrase. Les mesures de hauteur du texte sont donc sans
   valeur pour la lisibilité réelle. Vérifier l'ordre en profondeur, la normale et la position du
   panneau par rapport aux objets texte. Supprimer tout rectangle proxy placé devant le texte ou
   déplacer le texte légèrement vers la caméra.

2. **La piste suit le mauvais scénario.** Le blocking actuel met les quatre portiques sur une
   portion presque droite, puis ajoute le virage avant l'arrivée. La dernière consigne de Julien
   est l'inverse : donner du mouvement pendant la traversée des portiques avec des courbes légères
   et lisibles, puis sortir sur une ligne droite stable pour la ligne d'arrivée et les quatre
   choix finaux.

3. **L'entrée ciel vers cockpit ne se comprend pas.** À l'approche de la jonction, une grande face
   de la voiture remplit brutalement l'image. La caméra ne semble pas descendre du ciel puis entrer
   naturellement par le pare-brise ou l'ouverture visuelle prévue. Refaire la trajectoire
   extérieure en vue plongeante, garder la voiture identifiable pendant l'approche, aligner la
   caméra sur le pare-brise, puis masquer la bascule extérieure/cockpit sur quelques images de
   reflet et de flou directionnel.

4. **L'arrivée ne présente pas les catégories.** L'image finale contient quatre rectangles en
   quinconce sans titres visibles. Les quatre choix doivent être nommés et immédiatement
   reconnaissables : Performance & Passion, Sérénité & Confiance, Entreprise & Collectif,
   Industrie & Marques.

### Problèmes importants

5. **La route reste difficile à lire.** Les lignes existent maintenant, mais la chaussée se fond
   dans l'environnement gris et sa largeur varie visuellement. Donner une vraie silhouette à la
   piste, des bords continus et des repères latéraux simples pour que les courbes et la vitesse se
   comprennent même en rendu proxy.

6. **Le cadre cockpit est envahissant.** Les grands montants diagonaux mangent beaucoup de champ
   et concurrencent les portiques. Les conserver comme amorces d'habitacle, mais les réduire et
   vérifier leur cohérence gauche/droite depuis une position conducteur réelle.

7. **Le rythme doit être revu après le nouveau tracé.** La durée de 24,4 secondes vient d'un ancien
   arbitrage de lisibilité. Ne pas la considérer comme intouchable. Faire d'abord un playblast
   lisible, puis vérifier si chaque phrase peut être comprise sans que le hero paraisse trop long.

8. **Blender 5.2.1 plante actuellement en mode headless local** avant de charger le fichier, avec
   `ArchWarn: ARCH_CACHE_LINE_SIZE != Arch_ObtainCacheLineSize`. Utiliser Blender via l'interface
   ou le MCP s'il est disponible dans la nouvelle tâche, ou diagnostiquer ce crash avant de lancer
   des scripts CLI de rendu.

## Ordre de reprise

1. Ouvrir le `.blend` et créer une copie de travail avant modification.
2. Examiner les objets des portiques et corriger l'occlusion du texte sur le portique 1.
3. Faire un rendu fixe du portique 1 et le regarder. Ne dupliquer la correction aux trois autres
   qu'après validation visuelle.
4. Refaire `TRACK_PATH` : courbes légères pendant les quatre portiques, sortie tangentielle sur une
   ligne droite pour l'arrivée.
5. Refaire la trajectoire `CAM_EXT` et la transition vers `CAM_HERO` pour rendre l'entrée cockpit
   spatialement compréhensible.
6. Ajouter les quatre titres sur les panneaux finaux en quinconce et vérifier leur cadrage.
7. Régénérer un playblast léger, puis regarder la vidéo en continu et les images de contrôle aux
   moments clés. Vérifier le texte, la route, le sens des virages et la transition, pas seulement
   les dimensions ou les coordonnées numériques.
8. Mettre à jour `AGENTS.md` et `decisions/log.md` seulement après cette vérification.
9. Ne lancer aucune génération Higgsfield avant validation explicite de Julien sur le nouveau
   blocking.

## Prompt de reprise conseillé

> Reprends le hero Blender Driving Sens. Lis `projects/drivingsens-site/AGENTS.md`, puis considère
> `projects/drivingsens-site/REPRISE-BLENDER.md` comme la liste prioritaire des corrections. Ouvre
> le `.blend`, inspecte le MP4 et les images toi-même, corrige le blocking dans l'ordre indiqué,
> régénère un playblast, puis vérifie visuellement le résultat avant de me le présenter. Ne lance
> pas Higgsfield.
