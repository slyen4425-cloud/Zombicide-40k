# GenSrpG — Phase 9 — RED Capture138 : fuite différée du Hub après changement de module

Date : 9 octobre 2026. **Statut : TDD RED confirmé, correction GREEN uniquement en local ; aucune modification du runtime GitHub. Ne pas annoncer GREEN de chantier.**

## Gouvernance et référence

- Point de départ `50ea199c1bbb909537383bdb10337ba054d53077`, checkpoint GREEN `checkpoint/gensrpg-phase9-capture-legacy138-launch-characterization-green-2026-10-09` (CI Architecture/Browser `37981581468`, Firefox `37981581403`, Tactical Dock `37981581440`, SUCCESS).
- Checkpoint obligatoire créé : `checkpoint/gensrpg-start-phase9-capture138-delayed-hub-guard-2026-10-09`, même SHA.
- Branche TDD dédiée : `work/gensrpg-phase9-capture138-delayed-hub-guard-2026-10-09`. Production `main` inchangée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Source exacte §26 reçue de l'utilisateur `indexj.txt` : 8 165 398 octets, blob Git `18627cc0c5fc7945732c8a910504c59ef823b6ae`; index identique au checkpoint.

## Bug prouvé en RED

La vraie fonction `captureFix138` capture le contexte Capture au moment du lancement, et planifie `setTimeout(...,30)` ; elle **ne revérifie pas le contexte lors de l'exécution**. Si le contexte devient Dungeon ou Survie entre les deux, le callback historique masque la fiche, affiche le menu/Hub Capture, déclenche `renderCaptureWorldHub()` puis scroll.

La sentinelle ajoutée `tests/gens_phase9_capture138_delayed_hub_guard_v1.test.cjs` extrait/exécute le vrai wrapper via VM, vérifie le parcours normal, l'absence de timer hors Capture, le rejet du démarrage et les deux bascules Capture→Dungeon et Capture→Survie. Sa première exécution sur l'index byte-exact **échoue attendu** sur `RED: no stale Hub render after switch to Dungeon`.

**RED GitHub confirmé sur commit `684e9548a9e4a48000a5b09cc4671a76afc34b8e`** : Architecture `37992125271` FAILURE spécifiquement sur la nouvelle étape « Bloquer les callbacks historiques Capture138 apres bascule de mode ». Il s'agit de la preuve préalable au correctif et non d'une régression de production.

## Correction minimale démontrée localement, NON publiée

Ajout strictement dans le callback `captureFix138`, avant tout effet DOM :

```js
setTimeout(()=>{
  if(!isCaptureContext138())return;
  try{
    // corps historique inchangé
```

- Seulement **+40 octets** ; aucune nouvelle autorité, wrapper, intervalle, transition ou état global.
- Index local corrigé : **8 165 438 octets**, blob Git **`1a61147d5a32889fa85e6a09e846049103b9f0bf`**.
- Test local passe GREEN avec le comportement Capture normal préservé, et les deux changements de contexte sans effet secondaire.
- Rollback déterministe : retirer exactement la garde, restaure l'index 8 165 398 / blob `18627cc0c5fc7945732c8a910504c59ef823b6ae`.

## Blocage de sécurité détecté avant publication

L'audit GitHub Actions isolé `37992214542` (SUCCESS) a recherché les empreintes dans tous les tests et a identifié **108 fichiers de test** contenant l'ancienne taille `8165398` ou l'ancien blob `18627cc0c5fc7945732c8a910504c59ef823b6ae`, dont plusieurs tests de rollback/inversion des patches.

Faire seulement le changement de 40 octets dans le runtime casserait leurs assertions ; modifier mécaniquement les 108 références masquerait les vraies intentions des oracles, au risque de rompre des sentinelles Dungeon, Survie, Core ou Capture. **Ne pas faire de publication runtime ni de migration aveugle de tests.**

La branche contient actuellement uniquement le nouveau test RED, le raccord CI, le rapport/docs et un workflow isolé d'audit d'empreintes. Elle ne peut pas porter un checkpoint GREEN fonctionnel.

## Étapes sûres avant reprise de la correction

1. Créer un micro-lot séparé pour classifier les 108 pins : assertions sur l'état actif, assertions sur les bases historiques de rollback, et autres références. Stabiliser leur stratégie de rebaselining sans transformer les oracles historiques en tests de complaisance.
2. Revalider la branche source et sa compatibilité avec les chantiers parallèles, surtout le lifecycle Capture divergent.
3. Seulement ensuite, appliquer le correctif de 40 octets sur le véritable `index.html`, ajuster chaque oracle démontré impacté, et vérifier le rollback byte-exact.
4. Exécuter tous les tests de parité Phase 5/9, le navigateur réel et la triple CI sur le **même SHA final**. Exiger confirmation utilisateur ciblée smartphone avant checkpoint fonctionnel.
5. Conserver `main` gelée, ne pas fusionner sans validation.

**Interdits :** rustines sur Shell, interception globale de `setTimeout`, redéfinition de `isCaptureContext138` dans un second fichier, désactivation des tests, modification automatique des 108 assertions sans classification, assimilation du GREEN local à un GREEN GitHub.
