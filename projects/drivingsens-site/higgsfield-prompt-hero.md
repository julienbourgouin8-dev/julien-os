# Prompt Higgsfield — hero Driving Sens (version 2026-09-17)

Prompt de génération vidéo prêt à l'emploi, adapté par Julien + Sonnet à partir du prompt qui a
produit le premier rendu (`hf_20260917_145312_...mp4`). Remplace ce premier prompt — ne pas
reprendre l'ancien.

**Statut : pas encore envoyé à Higgsfield.** En attente de l'upload de la nouvelle vidéo de
référence Blender (celle qui inclut les corrections caméra du 2026-09-17, voir `AGENTS.md`) sous le
tag `@videoreference`, puis de la validation finale de Julien.

## Ce qui a changé par rapport au premier prompt

1. **Tags renommés** (Julien a renommé ces références dans Higgsfield) :
   - `@face-avant` → `@face-avant-drivingsens`
   - `@face-arriere` → `@face-arrier-driving-sens`
   - `@video-reference` → `@videoreference` (nouvel asset, nouvelle vidéo — pas juste un renommage)
2. **Pédales** : `@[interieur]` et `@[personnages]` précisent maintenant deux pédales distinctes
   (frein à gauche, accélérateur à droite), jamais une pédale unique/fusionnée. Règle 8 ajoutée.
   Corrige le défaut visible sur le premier rendu (les 2 pieds appuyaient au centre d'une seule
   pédale).
3. **Cohérence des portiques** : règle 9 ajoutée — rien ne doit jamais être visible derrière le
   portique d'arrivée (`@[arrivé]`), plus une précision sur le plan 20 (portique 4). Corrige
   l'incohérence du premier rendu (un portique supplémentaire visible au loin derrière l'arrivée).
4. **Gravier** : `@[circuit]` et la section COLOR décrivent maintenant un calcaire blanc propre,
   fines traces, uniforme sur tout le circuit (au lieu du gravier brun/terreux du premier rendu).
5. **Compteur de vitesse** : règle 10 + plan 21 — le compteur affiche toujours une vitesse réelle
   (110-130 km/h), jamais 0 pendant que la voiture roule. Corrige le "0 km/h" vu en cockpit sur le
   premier rendu.
6. **Voiture qui continue de rouler** : section PHYSICS + plan 22 — la voiture ne s'arrête jamais
   net, elle roule en continu jusqu'à sortir naturellement du cadre. Corrige l'arrêt brutal du
   premier rendu.
7. **4 raffinements cinématographiques** demandés par Julien pour que l'ensemble du film soit aussi
   émotif que la séquence des plans 15-19 (portique 3 → chase → drone arc) :
   - un flare de lentille récurrent à chaque passage de portique (plans 9, 13, 17, 20) ;
   - un heat-shimmer dont l'intensité suit la vitesse réelle du plan (quasi nul à l'arrêt, maximal
     sur les arcs à haute vitesse) ;
   - une note de rythme émotionnel explicite en 5 mouvements (tension → lâcher → maîtrise →
     ouverture → apaisement) ;
   - un léger souffle de caméra organique (pas du tremblement) sur les inserts de roue récurrents
     (plans 5, 11, 14) et le chase arrière (plan 18).

**Limite assumée** : le prompt ne peut pas, à lui seul, ajouter de vrais mouvements de caméra
(virages/arcs) qui n'existent pas dans `@videoreference` — la règle n°1 du prompt donne la
priorité absolue à la vidéo de référence sur le texte. Le vrai levier pour plus de dynamisme caméra
reste le travail sur la previz Blender elle-même (voir `AGENTS.md`, section du 2026-09-17).

## Prompt complet

**ACTIVE REFERENCES**

@videoreference = Blender blocking previz (30s, 24fps) — the MASTER for everything that moves and everything that stands. It defines the FULL edit one-to-one: every cut point, every camera position, angle, move and framing, the car's state of motion at every moment — its exact pace from held stillness on the line to a hard launch to steady high-speed cornering — screen direction, hand and foot motion in every cockpit insert, all action timing, AND the geometry of the world: every kerb, gravel strip, guardrail, road curve and gate position visible in the previz exists in the output in the same place, at the same scale, in the same position in frame. FRAME BY FRAME: each generated shot is a one-to-one re-render of its @videoreference counterpart — the same footage re-dressed, never re-imagined; no invented shots, no invented camera angles, no invented actions or beats exist anywhere. In THIS dressing, the previz's road and terrain masses keep the world of the approved generation: the track, kerbs, gravel, fencing and background exactly as @[circuit](ba983743-3092-4751-a808-fbd245cd34bb) stages it — a sunlit Mediterranean circuit, pine tree line, distant mountains — NOT a night scene, NOT a city street, NOT any other location. Every generated shot replicates the corresponding @videoreference shot exactly — same composition, same blocking, same camera behavior, same motion state, same duration. NOTHING happens on screen that does not happen in @videoreference: the car moves only when and as fast as the previz car moves; if only the camera moves, only the camera moves. Nothing in @videoreference is skipped, shortened or reordered. The edit contains EXACTLY the cuts of @videoreference: no extra shots inserted, no neighboring shots merged. If any text in this prompt appears to disagree with @videoreference on camera, framing, direction, motion, timing or object placement, @videoreference wins. The reference's untextured grey-box surfaces, flat colors and viewport grid are NOT inherited — every grey proxy is dressed into a real photoreal object in the exact position the previz puts it. Where the previz uses stand-in proxy shapes (the car body's front/rear, the driver's blocky hand and leg, the pedal cluster), this prompt's descriptions define the real object — proxies give position, angle, scale and motion only, never surface, shape detail or design.

@[circuit](ba983743-3092-4751-a808-fbd245cd34bb) = ENVIRONMENT MASTER — NOT a keyframe, NOT a camera angle to reproduce. It defines ONLY the track surface, the red-and-white kerb paint, the gravel run-off, the chain-link fencing, the pine tree line, the mountain backdrop and the hard sunlit midday atmosphere. The gravel run-off is clean bright limestone-white gravel, fine grain, minimal tire marks, kept pristine and visually consistent across the ENTIRE circuit — never dark, muddy, patchy, or heavily scarred in one section and clean in another. Every shot of the film — whatever geometry @videoreference stages in it — is lit, colored and graded exactly in this regime for all 30 seconds. The car and any gate are NOT inherited from it.

@[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072) = the car's FRONT identity only — headlight shape, grille, splitter, hood vents, the front badge/plate area. 100% matches the reference at every distance and angle. Its white studio background and lighting are NOT inherited.

@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral = the car's SIDE identity only — body proportions, rear wing, side skirts, door line, wheel and rim design. Background not inherited.

@[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) = the car's REAR identity only — taillight shape, diffuser, exhaust tips, rear wing, the rear badge/plate area. Background not inherited.

@[interieur](67d84928-e5c7-473b-901b-36e795b73f36) = COCKPIT identity only — steering wheel design, dashboard (with a legible speed readout), center console and shifter position, seat, and the pedal cluster: TWO distinct, physically separate pedals side by side — a brake pedal on the left, an accelerator pedal on the right — never a single fused, shared or central pedal shape, and never a pedal shape that could read as one wide surface. Lighting not inherited.

@[personnages](833fb14f-573e-493e-a599-f2dc7cfad234) = DRIVER identity only — the closed full-face helmet (visor ALWAYS down, face NEVER visible), the white/black racesuit with its thin red-orange chest stripe, the real full-finger racing gloves. Pose is NOT inherited — his pose in every shot comes from @videoreference's proxy hand/leg, timed exactly as staged there, with this correction: only the RIGHT foot ever touches a pedal (the right-hand accelerator pedal of @[interieur](67d84928-e5c7-473b-901b-36e795b73f36)); the LEFT foot always rests flat on the footrest to the left of the pedals, never on or overlapping either pedal.

@[portique-2](d4a089a5-995a-4e44-be82-8e8546003a38) = GATE 2, complete and exact — its white steel structure, its dark anthracite panel with the red-orange top/bottom accent stripe, and its finished text "RETROUVEZ DE LA SÉRÉNITÉ DERRIÈRE UN VOLANT." "02". Used directly, unchanged, wherever gate 2 appears.

@[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0) = the gate STRUCTURE ALONE, isolated, white steel truss — defines the physical gantry shared by gates 1, 3 and 4, same family as @[portique-2](d4a089a5-995a-4e44-be82-8e8546003a38)'s structure. Ignore any text baked into this reference; each use below carries its OWN new text as specified in the timeline.

@[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252) = the FINISH gate, complete and exact — its structure and its four category panels, in this exact left-to-right order: "INDUSTRIE & MARQUES" · "ENTREPRISE & COLLECTIF" · "SÉRÉNITÉ & CONFIANCE" · "PERFORMANCE & PASSION". It is the LAST structure on the track. Used directly, unchanged, wherever it appears.

**STYLE**
Live-action photoreal automotive cinematography, the polish of a premium car manufacturer's hero film: clean deep contrast, natural 35mm-equivalent grain, no CGI gloss, no video-game sheen. Real asphalt grain, real reflections moving across the paint and glass. Heat-shimmer air is a felt indicator of speed, not a fixed backdrop: barely perceptible while the car is still (shot 1), building through the launch, and at its most alive during the high-speed arcs (shots 7, 10, 19) — the faster the car, the more the air itself seems to move. A brief, clean horizontal lens flare streaks across frame every time the car passes directly beneath a gate's steel structure catching the sun (shots 9, 13, 17, 20) — a recurring visual "pulse," the flare's own rhyme alongside the wheel-insert beats.

**LIGHTING**
One continuous sunlit midday for all 30 seconds, exactly the regime of @[circuit](ba983743-3092-4751-a808-fbd245cd34bb): hard clean Mediterranean sun, short-edged shadows pinned tight under the car, a pale-blue sky with soft haze where the mountains dissolve at the horizon. No dawn, no dusk, no clouds rolling in, no change in the light between cuts — the final second is lit exactly as hard and clean as the first. Inside the cockpit inserts, light is real cabin light: sun raking across the dash, a bright hot highlight sliding on the helmet visor.

**COLOR**
Warm sun-bleached asphalt grey, the red-and-white kerb paint as the only saturated accent on the ground, clean white limestone gravel — fine, bright, only light and occasional tire marks, never dark or muddy, consistent across every run-off on the circuit — deep green pine tree line, soft blue-grey mountains. @[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072)/@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral/@[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) stays the brightest, cleanest mass in every frame — white paintwork catching the sun hard on its curves, black accents and the red-orange splitter line reading crisp against the track. The gate panels are the only deep-dark masses in the film — anthracite with the thin red-orange stripe — small punctuation against all that open daylight.

**PACING — THE EMOTIONAL ARC**
The film breathes in five movements, and every shot should read as part of its movement, not in isolation: coiled tension (0–4s, stillness holding violence in check) → aggressive release (4–9s, the launch and the first sprint) → controlled mastery (9–17s, precision at speed, the car exactly where it means to be) → open expansiveness (17–26s, the drive feels shared and wide rather than solitary) → resolved stillness (26–30s, the engine settling, the question answered). Each shot's mood should sit naturally inside its movement — the aggression of shot 4 and the quiet authority of shot 15 are the same film at two different moments of the same held breath.

**CAMERA**
Duration 30s, one continuous drive, 22 shots. All framing, angles, lens feel, cuts, moves and screen direction are governed by @videoreference one-to-one, frame by frame. Where a timeline line below names a camera position or move, it is a restatement of what @videoreference already does at that timestamp — a disambiguation, never a new instruction. Natural shutter; motion blur only where @videoreference actually moves fast. On the recurring wheel-insert shots (5, 11, 14) and the low rear chase (18), the camera carries a faint, organic settle — the sense of a rig mounted on the car absorbing the texture of the tarmac — never a shake, never a wobble, just a rig that feels physically attached to a moving object rather than clinically locked off.

**PHYSICS**
The car's pace always matches the previz exactly: a held, coiled stillness on the line, then a hard decisive launch — real wheelspin biting into grip, weight slamming onto the rear axle, NOT a smoky drift burnout — then a fluid, precise, fully-gripped drive through every corner: no sliding, no drift angle, the car holds its line like a scalpel. Suspension compresses under braking and load, body leans naturally into corners, tires stay planted, dust lifts faintly off the gravel edge where the car runs close to it. The car never halts or freezes mid-track once launched — every deceleration is a smooth, physical roll-off of speed, never an instant stop.

**RULES**
1. @videoreference is the single source of truth for action, editing, motion state and world geometry — frame by frame, the previz re-dressed, never re-imagined. Every shot replicates its @videoreference counterpart one-to-one — no added events, no removed events, no invented camera moves, no invented shots, no extra passes or vehicles beyond those the previz stages. The car moves only when and as fast as it moves in @videoreference. The cut count and cut points match @videoreference exactly — exactly 22 shots.
2. Exactly one hero car for the full timeline, identity locked from @[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072)/@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral/@[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) at every distance and angle — same white paint, same wheels, same wing, never a different generation or trim.
3. LICENSE PLATE / BADGE TEXT — wherever the car's front or rear identification area is legible, the text reads exactly "DRIVING SENS" — never "GT3RS", never any real manufacturer name or model badge, never blank or garbled. Sharp and correctly spelled in both front and rear views.
4. Exactly one driver, identity locked from @[personnages](833fb14f-573e-493e-a599-f2dc7cfad234) in every cockpit insert — helmet visor CLOSED at all times, face never visible, same suit, same real racing gloves. Right hand only on the shifter, right foot only on the pedal, timed exactly as @videoreference stages it.
5. The track and environment match @[circuit](ba983743-3092-4751-a808-fbd245cd34bb) in every shot that is not a gate close-up: same asphalt, same kerbs, same tree line and mountains, same hard sunlight — one continuous location, never a different circuit.
6. Four numbered gates plus the finish gate, each appearing exactly where @videoreference stages it, each built from the same white steel truss family (@[portique-2](d4a089a5-995a-4e44-be82-8e8546003a38)/@[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0)/@[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252)). Gate text is exact, sharp and fully legible, never blurred, never misspelled, never a different phrase than specified below. No fifth numbered gate, no duplicate gate, no gate out of order.
7. No real brand logos or sponsor names anywhere except the "DRIVING SENS" plate text. No other cars, no pedestrians, no crowd, no marshals. No subtitles, no watermark, no on-screen graphics beyond the gates' own signage and the dashboard's own speed readout.
8. PEDAL GEOMETRY — the pedal cluster always shows two separate, distinct pedals side by side (brake left, accelerator right), matching @[interieur](67d84928-e5c7-473b-901b-36e795b73f36). The driver's left foot stays planted on the footrest to the left at all times; only the right foot ever touches a pedal, pressing the rightmost pedal (accelerator) — never both feet together on one central pedal, never a single merged pedal shape.
9. HORIZON COHERENCE BEYOND THE FINISH GATE — @[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252) is the LAST structure on the track. In every shot, nothing — no gate, gantry, sign, or structure of any kind — is ever visible beyond or behind the finish gate; its background horizon stays clear and open (track, kerbs, tree line, mountains only). Where an earlier gate shows the next gate ahead in the distance, at most ONE structure is visible in that background — never two stacked structures in the same shot.
10. DASHBOARD SPEED READOUT — wherever the dashboard is legible (cockpit shots), its digital speed display always shows a plausible moving speed consistent with the car's current pace in @videoreference — never "0" while the car is in motion.

**ACTING TASKS**
All hand and foot actions below already exist in @videoreference — perform them exactly as staged there, with these qualities.
2.5–3.17s: the driver's gloved RIGHT hand (@[personnages](833fb14f-573e-493e-a599-f2dc7cfad234)) finds the shifter without hesitation and slams it home — tactile, surgical, one clean motion.
3.17–4.0s: the driver's booted RIGHT foot (@[personnages](833fb14f-573e-493e-a599-f2dc7cfad234)) presses the RIGHT-hand accelerator pedal of the two-pedal cluster (@[interieur](67d84928-e5c7-473b-901b-36e795b73f36)) flat and holds it — a small, decisive verdict, no hesitation; the left foot stays on the footrest throughout.

**ACTION TIMING**
Shot boundaries, framing, camera, ALL motion states and ALL world geometry come from @videoreference one-to-one, frame by frame. Every line below is ONE shot ending in a hard cut at its last timestamp; it dresses the previz's grey shapes into real objects in their exact positions — it never adds motion, objects, shots or events.

0.00–2.50s — SHOT 1 — Straight down from directly above, exactly as @videoreference opens: the car (@[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072)/@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral/@[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e)) sits dead still on the white line, hard sun flattening onto the roof and hood, its shadow pinned tight beneath it on the track (@[circuit](ba983743-3092-4751-a808-fbd245cd34bb)); the air above the tarmac lies completely calm, not a ripple of heat yet. Held breath before release — stillness with the engine's violence coiled inside it. Hard cut at 2.5s.

2.50–3.17s — SHOT 2 — Extreme close-up on the shifter, @[interieur](67d84928-e5c7-473b-901b-36e795b73f36) console: the driver's gloved right hand (@[personnages](833fb14f-573e-493e-a599-f2dc7cfad234)) finds the knob without hesitation and slams it home — tactile, surgical, muscle memory over thought. Hard cut at 3.17s.

3.17–4.00s — SHOT 3 — Extreme close-up on the pedal cluster, @[interieur](67d84928-e5c7-473b-901b-36e795b73f36): two clearly separate pedals visible side by side, the left brake pedal untouched and the driver's booted right foot (@[personnages](833fb14f-573e-493e-a599-f2dc7cfad234)) pressing the right-hand accelerator pedal flat and holding it — a small, decisive verdict; the left foot stays planted on the footrest, never overlapping either pedal. Hard cut at 4.0s.

4.00–4.83s — SHOT 4 — Low rear three-quarter launch, @[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) identity, rear plate reading "DRIVING SENS" crisp: the car snaps out of stillness, rear tires biting hard into grip, weight slamming back onto the rear axle, the wing and diffuser cutting the frame, the first faint shimmer of heat lifting off the tarmac behind it. The world stops being still. Hard cut at 4.83s.

4.83–5.67s — SHOT 5 — Close on the front wheel/rim (@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral), just off the line, the camera carrying a faint organic settle as if mounted on the car itself: the wheel finding traction, brake caliper and spoke pattern sharp, a beat of raw mechanical detail before the world blurs. Hard cut at 5.67s.

5.67–6.50s — SHOT 6 — Front three-quarter sweep, @[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072) identity, front plate reading "DRIVING SENS": the car surges toward camera, gate 1's white truss (@[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0)) already a small dark mark on the horizon — the sprint has begun, the track opening up ahead. Hard cut at 6.5s.

6.50–7.38s — SHOT 7 — Elevated three-quarter arc over the car's roofline as the road bends away, track per @[circuit](ba983743-3092-4751-a808-fbd245cd34bb), heat-shimmer now visibly alive over the tarmac: the world starts to move past rather than sit still — the first real sensation of speed. Hard cut at 7.38s.

7.38–8.58s — SHOT 8 — Rear three-quarter, gate 1's white truss (@[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0)) growing in frame ahead, its edge of text just catching legibility: the gate looms like a dare, sun flaring hard off the steel. Hard cut at 8.58s.

8.58–9.92s — SHOT 9 — Frontal, gate 1 fully overhead, structure from @[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0), text sharp and complete: "VOUS ÊTES EN QUÊTE DE SENSATIONS FORTES." "01" — a clean flare streaks across frame as the car passes directly beneath, threshold crossed clean. Hard cut at 9.92s.

9.92–10.92s — SHOT 10 — High wide drone-style arc over a kerbed bend, @[circuit](ba983743-3092-4751-a808-fbd245cd34bb), heat-shimmer at its most alive here: the car reads small and precise against the track's full curve — control at a distance, the line drawn without hesitation. Hard cut at 10.92s.

10.92–11.83s — SHOT 11 — Very low, close on the front sill/wheel (@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral) skimming past, the same faint organic camera settle as shot 5: the ground rushing close, a felt sense of speed at eye-level with the tarmac. Hard cut at 11.83s.

11.83–13.17s — SHOT 12 — Straight top-down, the car centered symmetrically between the red-and-white kerbs, @[circuit](ba983743-3092-4751-a808-fbd245cd34bb): a clean, geometric beat — precision on display, the car exactly where it means to be. Hard cut at 13.17s.

13.17–14.50s — SHOT 13 — Frontal, GATE 2 complete exactly as @[portique-2](d4a089a5-995a-4e44-be82-8e8546003a38) — text "RETROUVEZ DE LA SÉRÉNITÉ DERRIÈRE UN VOLANT." "02" — a clean flare crosses frame as the car passes beneath, gate 3 a small dark shape far beyond it: the pace exhales for a beat, light feels softer here, the car glides rather than fights. Hard cut at 14.5s.

14.50–15.63s — SHOT 14 — Close on the front wheel/rim again (@[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072)/@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral), the same faint organic camera settle, same mechanical intimacy as shots 5/11 — a recurring heartbeat of detail between the wider drama. Hard cut at 15.63s.

15.63–16.75s — SHOT 15 — Dead-on low front face, @[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072) identity, front plate reading "DRIVING SENS," a gate structure soft and out of focus behind: the car fills the frame with quiet authority, nothing wasted. Hard cut at 16.75s.

16.75–17.88s — SHOT 16 — Rear three-quarter, @[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) identity with rear plate reading "DRIVING SENS," gate 3's text edge rising into frame (@[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0)), gate 4 a distant mark beyond it — and nothing else past that, clear open track behind: the tone sharpens back toward purpose. Hard cut at 17.88s.

17.88–19.20s — SHOT 17 — Frontal, GATE 3 built from @[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0), text sharp: "UNE EXPÉRIENCE AUTOMOBILE PENSÉE POUR RASSEMBLER." "03" — a clean flare crosses frame as the car passes beneath: a sense of openness in the framing, the track feels shared rather than solitary. Hard cut at 19.2s.

19.20–20.50s — SHOT 18 — Low rear chase, @[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) identity, diffuser and exhaust in hard detail, rear plate reading "DRIVING SENS," the same faint organic camera settle riding with the car: the car pulling away with an exhaust note you can almost hear in the shot itself. Hard cut at 20.5s.

20.50–22.20s — SHOT 19 — Elevated three-quarter drone arc on a curving section, @[circuit](ba983743-3092-4751-a808-fbd245cd34bb) kerbs, heat-shimmer at its most alive here alongside shot 10: one more wide breath before the final approach, the car small and certain against the whole track. Hard cut at 22.2s.

22.20–23.54s — SHOT 20 — Frontal, GATE 4 built from @[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0), text sharp: "UN SERVICE AUTOMOBILE TAILLÉ POUR LES PROFESSIONNELS." "04" — a clean flare crosses frame as the car passes beneath — and beyond it, small but unmistakable, the finish gate (@[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252)) already waiting on the horizon, with nothing else visible past it — clear open track and sky behind, no third structure of any kind. Hard cut at 23.54s.

23.54–25.83s — SHOT 21 — Cockpit POV through the wheel, @[interieur](67d84928-e5c7-473b-901b-36e795b73f36) + @[personnages](833fb14f-573e-493e-a599-f2dc7cfad234) hands steady on the rim, the dashboard's digital speed readout legible and reading a real cruising speed (around 110–130 km/h, never zero), the heat-shimmer settling as the pace steadies: the noise of the drive falls away, replaced by the driver's own quiet control — breathing even, eyes level behind the closed visor — the finish gate (@[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252)) dead ahead, its four category panels already legible through the windscreen. Not a finish line arriving — a horizon of choices opening up. Hard cut at 25.83s.

25.83–30.00s — SHOT 22 (final) — One continuous move with no internal cut: the car passes beneath the finish gate at a smooth, unbroken roll — never halting or vanishing — @[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e) identity with rear plate reading "DRIVING SENS," the structure of @[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252) framing the shot from above as the car clears it and continues rolling naturally out of frame; the camera settles into a hold on the panel itself: "INDUSTRIE & MARQUES" · "ENTREPRISE & COLLECTIF" · "SÉRÉNITÉ & CONFIANCE" · "PERFORMANCE & PASSION." The engine's pitch falls smoothly toward idle as the car recedes and the frame holds, the air finally still again — the same calm the film opened on. Not a slogan shouted — a question answered.

**AUDIO**
[Sound design] 0–2.5s: engine idling low and tight, held like a breath, faint ambient wind off the gravel, no other track noise. 2.5–4.0s: mechanical shifter clack, then a decisive throttle press. 4.0s: engine snapping to a hard roar, rear tires biting with a short sharp chirp. From 4.83s a continuous driving bed matched to @videoreference's pace: engine note rising and falling with speed, tires rolling and gripping through every corner, wind building around the cabin at speed. Shot 21 (cockpit) acoustics go warm and slightly muffled, as if heard from inside a closed helmet.
[SFX / Timed accents] 2.5s shifter clack · 3.17s throttle stomp · 4.0s launch bark, tires biting · 8.58s / 13.17s / 17.88s / 22.2s a short clean "whoosh" of air as the car passes beneath each gate, synced to the flare · on the wheel/rim close-ups (shots 5, 11, 14) the mix drops everything else back for a beat and lets the rim/spoke resonance and tire-on-asphalt texture ring out on its own, distinct and close, before the driving bed swells back in · 20.5s exhaust crackle on lift · 25.83s engine note easing as the car clears the finish gate, continuing to roll · 28.0–30.0s engine settling to idle, wind tail, then near silence on the hold.
[Dialogue] None. [Music] None.

**HOLD FOR THE FULL TIMELINE**
@videoreference is the master of every cut, camera move, timing and blocking — 22 shots, frame-accurate, nothing invented, nothing reordered, nothing skipped. One hero car (@[face-avant-drivingsens](a8cb6614-8270-4fa8-8104-06cd4a029072)/@[face-lat-ral](125b8759-ed74-4b98-af89-d0c37c03536e)éral/@[face-arrier-driving-sens](d9412f99-ea32-41d4-bbd1-b1dfe5f6412e)) throughout, plates reading "DRIVING SENS" front and rear wherever visible, never "GT3RS." The pedal cluster is always two separate pedals, right foot only on the right-hand accelerator, left foot always on the footrest. One driver (@[personnages](833fb14f-573e-493e-a599-f2dc7cfad234)), helmet visor closed at all times, face never shown. One track (@[circuit](ba983743-3092-4751-a808-fbd245cd34bb)), one unbroken sunlit midday, clean white limestone gravel throughout, no time-of-day change. Heat-shimmer breathes with the car's speed and a clean flare punctuates every gate passage — the film's two recurring physical signatures, alongside the wheel-insert heartbeat. Four numbered gates plus the finish gate (@[portique-2](d4a089a5-995a-4e44-be82-8e8546003a38)/@[portique-blanc-1_3_4](1bb6dc7d-25b5-47e2-899e-b9b48f0e04e0)/@[arrivé](b8dfa794-e1a0-472d-bdce-dba3dcdb1252)), all from the same white-steel-truss family, each with its exact, sharp, unaltered text — no fifth gate, no duplicate, no misspelling, and absolutely nothing visible beyond the finish gate. The dashboard speed readout is always legible and never reads zero while the car moves. The car never freezes or vanishes — it rolls smoothly to the very last frame. No real logos, no other vehicles, no people beyond the driver. SFX only, no music, no dialogue, no subtitles, no watermark.
</content>
