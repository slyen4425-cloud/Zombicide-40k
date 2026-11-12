# Checkpoint START — Capture V2 : raccordement aperçu officiel au 12 novembre 2026

## Base protégée et périmètre
- Dépôt GenSRPG : `main` exact `0ead4348cff895e1387731c9d9ee5833a68949cf`.
- Sauvegarde : `checkpoint/gensrpg-start-capture-v2-preview-repin-20261112`.
- Lot : `work/gensrpg-capture-v2-preview-repin-20261112`.
- Propriétaire : publisher GenSRPG de l'aperçu Capture V2 déjà existant, à chemin isolé `/preview/capture-v2-pr225/`.
- Modification fonctionnelle autorisée : **un seul** pin de source Capture V2 (`tools/capture_v2_pages_preview_pin.json`), vers une branche candidate validée ; aucun autre composant de gameplay n'est modifié.

## Autorités réutilisées
- Capture V2 : source candidate immuable `67193a08633f199761860d0a5eb187e7a7d42404` issue de #394, incluant le contrat vitrine de fragment à 30 % et l'éditeur unique d'objets et drops.
- Combat : `main` certifié `9b8fe770b531abf4f8191a746e0fdcc43f7abbae` (Laboratory CI `43103011400`).
- Exploration : `main` certifié `373b104100bd4aecd5da1d457bac3b45f923237f` (Exploration CI `43101416907`).
- Les données, règles et images restent détenues par leur dépôt officiel ; pas de copie intégrale d'une bibliothèque à un deuxième emplacement.

## Protections et vérifications
- Ne pas changer `index.html`, l'index production, `service-worker.js`, ni l'application Survie, Dungeon ou PvP ; conserver leur runtime et leurs sauvegardes.
- Ne pas déplacer les sources historiques de Capture vers la prévisualisation et ne pas modifier la politique d'activation de la PWA installée.
- Avant fusion : contrôles de PR, sentinelles architectures, provenance SHA, et vérification des statuts du candidat ; tout rouge bloque.
- Après fusion : CI du SHA exact de `main`, assemblage Pages, audit de taille 900 Mio, déploiement Pages, preuve HTTPS du manifeste et de la révision réellement servie, navigation mobile vers la vraie arène.
- Cette opération publie **un aperçu dans GenSRPG** ; elle ne prétend pas remplacer la route Capture du menu principal avant la réconciliation et les essais de non-régression.

## Risques / limite bloquante avant bascule du menu
- Les branches Capture V2 et le `main` actuel ont divergé depuis `900cbcba0cdd517db773ff39c9c56264c16b32ed` (794 commits en avance, 221 en retard au moment de l'audit).
- Une bascule directe du Shell ignorerait des améliorations récentes de Survie/Dungeon/PWA. Elle doit être un lot de réconciliation distinct, testé, jamais une fusion aveugle.
