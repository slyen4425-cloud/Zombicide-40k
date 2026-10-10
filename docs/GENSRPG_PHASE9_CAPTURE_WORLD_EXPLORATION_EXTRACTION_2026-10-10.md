# Phase 9 — Capture : prochain transfert propriétaire Monde / Exploration

10 octobre 2026 — **chantier préparé, pas encore de changement runtime**.

**Base GREEN** : `f193f86d1c5d09bf905540863d9f1757d86e08aa`, checkpoint `checkpoint/gensrpg-phase9-capture-physical-seed-extraction-green-2026-10-10`; Architecture + Browser 38066969716, Firefox 38066969684, Tactical 38066969705 SUCCESS. **Point de départ** : `checkpoint/gensrpg-start-phase9-capture-world-exploration-extraction-2026-10-10` sur le même SHA. Branche : `work/gensrpg-phase9-capture-world-exploration-extraction-2026-10-10`.

**Responsabilité recherchée** : extraire du HTML historique un propriétaire unique Capture pour le monde/exploration : jour/événements/état/rendu du monde, sans refonte des règles ni modification de la représentation des données sauvegardées. Réutiliser les API Capture existantes et la navigation Shell. Ne pas déplacer le moteur combat ni l'équipe avant leurs frontières et tests propres.

**Protégés** : le seed V16.162 déposé et validé, tous les profils Capture édités par l'utilisateur, Shell/navigation, Core storage, Capture Hub/entry/sessionStart, Dungeon, Survie, Tactical, PvP, CI et PWA. Pas de multi-autorité, pas de listener global/observer/heartbeat, pas de nouveau système parallèle.

**Verrou charte §26** : `index.html` exact au SHA `f193f86d1c5d09bf905540863d9f1757d86e08aa` : taille 7 975 990 octets et blob `2f2edfa5a1e229e4630889e7f0d5442199e221eb`, contrôlés via l'arbre Git. Permalink https://github.com/slyen4425-cloud/Zombicide-40k/blob/f193f86d1c5d09bf905540863d9f1757d86e08aa/index.html . Ne pas commencer l'audit de contenu avant réception et vérification du HTML ou ZIP correspondant.

**Gate** : inventaire ciblé, preuve RED ou caractérisation du point de raccord, extraction minimale réversible du propriétaire, ancienne autorité retirée, tests unitaires/rollback/parité, parcours Capture réel (Hub jour suivant, combat, victoire, Save Quit/reprise), tests des quatre modules, Architecture+Browser + Firefox + Tactical au SHA identique, checkpoint lisible et test utilisateur.

**Statut** : preparation gouvernée ; pas de GREEN d'extraction monde revendiqué.
