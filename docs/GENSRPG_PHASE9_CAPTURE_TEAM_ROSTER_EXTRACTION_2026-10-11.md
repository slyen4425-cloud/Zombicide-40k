# Phase 9 — Extraction physique Équipe / Réserve Monster Capture
11 octobre 2026 — **chantier ouvert, résultat technique en cours de validation**.

## Gouvernance et provenance
- Dernier GREEN fonctionnel : `checkpoint/gensrpg-phase9-dungeon-editor-single-owner-green-2026-10-11`, SHA `b4b1a3dfad64f43265294a2485591701c38c7644`, trois CI SUCCESS (`38108512387`, `38108512336`, `38108512371`) et validation utilisateur explicite du 11 octobre.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-team-roster-extraction-2026-10-11`, sur ce même SHA.
- Branche : `work/gensrpg-phase9-capture-team-roster-extraction-2026-10-11`; `main` gelée et intacte à `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Charte §26 : archive utilisateur `indexa.zip` contenant `index.html(2).txt` ; 7 959 089 octets, SHA Git blob `e777d484ab10049650440fee04f47cf2dfdc3043`. Comparaison exacte avec arbre Git du checkpoint.
- Source canonique : https://github.com/slyen4425-cloud/Zombicide-40k/blob/b4b1a3dfad64f43265294a2485591701c38c7644/index.html

## Frontière propriétaire
- Le monde Capture est déjà extrait dans `assets/gensrpg/capture/world-exploration-v1.js` : hors périmètre.
- Combat Capture, progression/XP, objets de capture et règles de l'environnement : restent chez leurs propriétaires actuels.
- Seuls les corps historiques déjà propriétaires de la sélection dresseur/équipe, état `creatureTeam`/`creatureReserve`, normalisation, instances, sauvegarde, transfert, affichage d'équipe, vue et gestion de réserve sont transférés physiquement vers `assets/gensrpg/capture/team-roster-v1.js`. Aucun comportement nouveau ni valeur changée.
- Les noms globaux historiques des fonctions restent accessibles à leurs appelants ; leur code n'existe plus dans `index.html`. Aucune nouvelle API parallèle, aucun wrapper, timer, observer ni autorité de stockage.
- Les éléments historiques utilisés par une option créature sur un autre mode restent chargés et sémantiquement inchangés ; ne pas supprimer aveuglément les compatibilités entre profils.
- Module classique chargé de façon synchrone immédiatement après le propriétaire Monde Capture, avant le gros runtime historique ; toutes ses fonctions sont consommées ultérieurement.

## Preuves obligatoires
1. RED de la sentinelle de frontière sur `index.html` du SHA initial : le propriétaire demeure inline.
2. Extraction soustractive par `tools/gensrpg_phase9_capture_team_roster_extraction_apply.py`, avec rejet du mauvais SHA/deuxième propriétaire.
3. `--verify` reconstitue exactement 7 959 089 octets et le blob `e777d484...`.
4. Parité fonctionnelle normalisation, transferts aller/retour, sauvegarde et conservation des UID, niveaux, XP, capacités, allocations et champs créés par le joueur.
5. Tests navigateur réels : Capture équipe/réserve, combat/victoire, Save Quit/reprise ; Dungeon Builder, Survie, PvP, Core et sentinelles de sauvegarde.
6. Trois CI Architecture+Browser, Firefox et Tactical au SHA identique, puis checkpoint technique ; confirmation utilisateur avant GREEN fonctionnel.

## État à ne pas surdéclarer
Le travail préparatoire et les tests locaux ne représentent **pas** une CI verte ni un jalon fini. Le checkpoint de départ a été créé avant toute mutation runtime. Conserver les éventuels RED de diagnostic dans l'historique. Phase 9 encore ouverte ; ne pas démarrer Phase 10.
