# Checkpoint — marchand Capture V2 : compteurs contextualisés et stocks natifs (23 novembre 2026)

## Source et propriété
- Base : candidat Capture V2 immuable `848fb3201df200c53b756ef8004eee6712558faf` (après Exploration #540), sans nouvelle autorité de catalogue.
- Lot isolé : `fix/capture-merchant-stock-count-20261123`; cible source : `work/capture-v2-source-stairs-authoring-20261123`.
- Demande : issue #629 et charte #594. Ne touche ni Exploration, ni Combat, ni service worker, ni drops.

## Contrat conservé et évolution
- `AdventureRules.economy.merchants[].itemIds` reste la seule sélection d'articles et conserve les pourcentages de vente/rachat.
- Nouveau champ **facultatif** `itemStocks` sur ce même marchand : `itemId → entier 0..100000000`. Absence = stock illimité ; zéro = épuisé.
- Le stock restant persiste exclusivement dans `AdventureSession.merchantStocks` lors d'un achat. Aucun nouvel inventaire, compteur monétaire, catalogue ni couche de stockage.
- Marchands historiques `offers[].stock` inchangés ; l'édition après confirmation de conversion reprend les limites de stock par article quand elles existent.
- Le compteur de sélection est calculé sur la catégorie et la recherche visibles ; le total sur les autres catégories est affiché séparément.

## Portée et validation
- `adventure-economy-v1.mjs` normalise les caps et applique la limite au moteur de transaction existant.
- `adventure-economy-editor-v1.mjs` modifie le contrôle existant et offre un champ stock pour chaque article sélectionné.
- `adventure-merchant-play-v1.mjs` affiche le vrai reste et non un stock illimité fictif.
- `gens_capture_v2_merchant_percent_20261121.test.mjs` vérifie normalisation, achats, refus épuisé, répétition idempotente et rétrocompatibilité.
- Avant fusion : CI exact SHA GREEN, contrôle de la PR sur base source. Pas de publication PWA automatique depuis cette branche.
- Restent hors du lot : absence de potions dans les anciens univers, interaction PNJ silencieuse, migration opt-in des templates, vérification Android/PC du parcours entier.
