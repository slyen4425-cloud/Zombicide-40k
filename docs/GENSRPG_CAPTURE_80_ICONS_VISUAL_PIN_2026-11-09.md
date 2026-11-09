# GenSRPG — publication des 80 icônes de compétences approuvées (9 novembre 2026)

## START et propriété unique
- Départ immutable : `main@eb50d17d4000521104247cb370600a94e2854c07`.
- START : `checkpoint/gensrpg-start-capture-80-icons-visual-pin-2026-11-09`.
- Lot : `work/gensrpg-capture-80-icons-visual-pin-2026-11-09`.
- Seul propriétaire des médias et de leur catalogue : Labo Combat `global-assets`. Ni `main` Combat ni les sources Capture V2 n'acquièrent de bibliothèque clonée.
- Pin actuel du seul publisher : `tools/capture_v2_pages_preview_pin.json` `officialVisuals.sha=f61191afb001807955bccf3c5b2b5e292c76fc52` (trop ancien pour les 80 icônes).
- Source révisée certifiée : `global-assets@64577c0620f952483825537a4bbcb2bfd952c8b7`; `Laboratory CI` SUCCESS `42586781298`.
- Manifest de provenance sur la même révision : `assets/library/capture/icons/skills/capture_future_80_icons_2026_11_09.provenance.json`, 80 WebP originaux 128×128, contrôle SHA256/Git blob; ZIPs maîtres conservés.
- Publication cible : le sous-site existant `/preview/capture-v2-pr225/` uniquement. Un seul packager Pages `tools/stage_capture_v2_encounter_bridge.mjs`; il lit le catalogue global-assets et copie seulement les ressources référencées, sans duplicata d'autorité moteur.
- Périmètre : actualiser *seulement* `officialVisuals.sha` et `certifiedCiRun`, et ajouter une sentinelle sur 80 images et IDs effectivement livrés. Pas d'attribution automatique aux capacités, pas d'altération des sauvegardes, règles, Combat main, Exploration main, ni de `index.html` de grande taille.
- Gate : navigateur du sous-site, tests unitaires du publisher, budget réel ≤900 MiB, absence de copie de moteur, provenance HTTPS du SHA exact, checkpoint GREEN puis fusion PR sur main. Ne jamais déclarer visible sur appareil avant vérification réelle.
- Indépendant de la régression du Sac après combat et de l'édition de niveaux par zone, à traiter dans leurs propriétaires respectifs.
