# Capture / Labo Combat — préparation 27 octobre 2026

## Autorité
Capture conserve les équipes, règles, résultats, sauvegardes et navigation. Le laboratoire reste autonome. Aucun moteur de production n'est remplacé.

## Contrat provisoire
Le fichier assets/gensrpg/capture/battle-bridge-contract-v1.js expose snapshot(input) et result(input,original). Validation de deux camps, IDs uniques, PV bornés et résultat complet. Aucune écriture, aucun accès DOM, aucun chargement en production.

## À préparer ensuite
1. Cartographier les APIs réelles du labo et du combat Capture.
2. Enrichir le DTO : capacités, états, réserve, timers, sprites, effets et énergie.
3. Créer un adaptateur optionnel, sans dépendance inverse du laboratoire.
4. Tester le retour de résultat et les sauvegardes.
5. Preview smartphone paysage, validation utilisateur et rollback avant activation.

## Test
node tests/gens_capture_lab_bridge_contract.test.cjs
