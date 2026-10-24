# Phase 9 — Capture : extraction physique Monde / Exploration

10 octobre 2026 — **transfert réalisé, parité technique vérifiée le 11 octobre 2026**.

**Base GREEN** : `f193f86d1c5d09bf905540863d9f1757d86e08aa`, checkpoint `checkpoint/gensrpg-phase9-capture-physical-seed-extraction-green-2026-10-10`; Architecture + Browser 38066969716, Firefox 38066969684, Tactical 38066969705 SUCCESS. **Point de départ** : `checkpoint/gensrpg-start-phase9-capture-world-exploration-extraction-2026-10-10` sur le même SHA. Branche : `work/gensrpg-phase9-capture-world-exploration-extraction-2026-10-10`.

**Responsabilité recherchée** : extraire du HTML historique un propriétaire unique Capture pour le monde/exploration : jour/événements/état/rendu du monde, sans refonte des règles ni modification de la représentation des données sauvegardées. Réutiliser les API Capture existantes et la navigation Shell. Ne pas déplacer le moteur combat ni l'équipe avant leurs frontières et tests propres.

**Protégés** : le seed V16.162 déposé et validé, tous les profils Capture édités par l'utilisateur, Shell/navigation, Core storage, Capture Hub/entry/sessionStart, Dungeon, Survie, Tactical, PvP, CI et PWA. Pas de multi-autorité, pas de listener global/observer/heartbeat, pas de nouveau système parallèle.

**Verrou charte §26** : `index.html` exact au SHA `f193f86d1c5d09bf905540863d9f1757d86e08aa` : taille 7 975 990 octets et blob `2f2edfa5a1e229e4630889e7f0d5442199e221eb`, contrôlés via l'arbre Git. Permalink https://github.com/slyen4425-cloud/Zombicide-40k/blob/f193f86d1c5d09bf905540863d9f1757d86e08aa/index.html . Ne pas commencer l'audit de contenu avant réception et vérification du HTML ou ZIP correspondant.

**Gate** : inventaire ciblé, preuve RED ou caractérisation du point de raccord, extraction minimale réversible du propriétaire, ancienne autorité retirée, tests unitaires/rollback/parité, parcours Capture réel (Hub jour suivant, combat, victoire, Save Quit/reprise), tests des quatre modules, Architecture+Browser + Firefox + Tactical au SHA identique, checkpoint lisible et test utilisateur.

**Statut historique d'ouverture** : préparation initiale du chantier, conservée ci-dessous pour traçabilité ; transfert exécuté ensuite.

## Transfert runtime physique exécuté — 10 octobre 2026

- Base SHA / fichier validé selon charte §26 : `988d13e12ad2f7bb27acffb75217f9dafbabe803` / blob `2f2edfa5a1e229e4630889e7f0d5442199e221eb` / 7 975 990 octets, copie ZIP contrôlée.
- Transfert de quatre sections existantes sans réécriture de gameplay dans `assets/gensrpg/capture/world-exploration-v1.js` (17 511 octets, blob `ecfe276ba1a73b0a164c09f698ab17010289b7ee`). Nouveau HTML 7 958 968 octets, blob `42583858f0df0f1b3bcd65ca6a282c8ba27b1c07`.
- Commit runtime : `9420868a7c589325ff59686e8433bd96d5cac571`, branche dédiée seulement. Workflow d'application `38082335976` SUCCESS.
- Tests : restauration Git blob exacte ; conservation clés/valeurs/règles, parité VM jours/tours ; navigateur réel : Capture sans Dungeon, jour 2, victoire, recharge, reprise jour 3, Save Quit, seconde reprise/fermeture, ancienne sauvegarde Dungeon non interférente. Tous SUCCESS dans le workflow d'application.
- Frontière : monde, lieux, tours, événements et rendu Hub déplacés. Combat, XP, équipe/réserve, stockage Core, Shell, Dungeon, Survie, Tactical, PvP et PWA inchangés. Les API globales historiques restent pour leurs appelants ; leur découplage futur nécessite un lot distinct.
- Gouvernance : manifestes et sentinelles de composition réalignés sans réduction de portée. **Triple CI finale désormais validée sur un SHA identique ; validation utilisateur encore requise avant checkpoint GREEN final.** Production `main` gelée, Phase 10 interdite.

## Gate technique vérifiée — 11 octobre 2026

- **SHA gelé du runtime** : `b291cb596804963f51aab267f5a1e615a92e80e4` ; `main` demeure `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Architecture + Browser : [38083270491](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38083270491) **SUCCESS**.
- Firefox : [38083270510](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38083270510) **SUCCESS**.
- Tactical Dock : [38083270494](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38083270494) **SUCCESS**.
- **Checkpoint intermédiaire de sûreté technique** : `checkpoint/gensrpg-phase9-capture-world-exploration-technical-green-2026-10-11`, pointe sur le SHA testé ci-dessus. Il ne remplace **pas** le checkpoint GREEN final conditionné par la validation manuelle.
- **Prévisualisation smartphone / navigateur** : https://htmlpreview.github.io/?https://github.com/slyen4425-cloud/Zombicide-40k/blob/b291cb596804963f51aab267f5a1e615a92e80e4/preview.html . Vérifier l'entrée dans Capture, une journée supplémentaire, une rencontre, combat/victoire, Save & Quit, reprise et un retour sans pollution Dungeon. Aucun succès manuel utilisateur n'est déclaré à ce stade.
- **Prochain propriétaire physique prévu après gate manuel et checkpoint final** : équipe/réserve Capture, distinct du monde déjà extrait et du combat. Nouveau chantier, nouveau checkpoint de départ obligatoire ; si `index.html` doit être inspecté, fournir une copie au blob Git exact selon charte §26.
