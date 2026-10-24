# GenSrpG — Phase 4 — Stockage World Summary

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-world-summary-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-world-summary-2026-09-20`

Base exacte :
`5d021592867bdf83408aa6fb49e9633b4403a67c`

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Périmètre

Sous-lot unique :
`assets/gensrpg/gens-world-summary-167820.js`

Responsabilités :
- `GensStorageV1` reste l'unique service générique de lecture JSON ;
- World Summary reste consommateur Shell en lecture seule ;
- les clés et leur schéma restent des données Capture ; World Summary n'en devient pas propriétaire.

Familles lues, inchangées :
- `gensrpg_shared_entities_v1__<profileId>` ;
- `gensrpg_shared_entities_v1__family__creature`.

## Parité avant raccord

Le helper historique lisait directement `localStorage.getItem(key)`, faisait `JSON.parse` et retombait sur le fallback en cas d'absence, chaîne vide, JSON invalide ou `null`.

Le test :
`tests/gens_phase4_storage_world_summary_parity_v1.test.cjs`

verrouille :
- priorité de la clé exacte quand elle contient des créatures ;
- fallback sur la famille creature seulement si la liste exacte est vide ;
- ordre exact des deux lectures ;
- fallback `[]` ;
- absence totale d'écriture ;
- aucune migration de format.

Le premier run RED `35498906343` a révélé une erreur dans le fixture de parité : l'entrée supposée hors famille avait encore `contentFamily: "creature"`, donc le comportement historique la comptait légitimement. Le fixture a été corrigé sans toucher au runtime.

État pré-raccord exact au commit `ac09d261195e8d4b4f89766ff636f498370cf199` :
- 1 lecture directe `localStorage.getItem` ;
- 0 appel `GensStorageV1.readJson` ;
- 0 écriture.

Le garde propriétaire :
`tests/gens_phase4_storage_world_summary_owner_v1.test.cjs`

verrouille désormais l'absence d'accès direct et la délégation au Core.

## Raccord

Commit runtime :
`0ee4229dd6748e1672acdd59f77cb16d7b82200a`

Le changement fonctionnel est volontairement minimal :

`readJson(key,fallback)` délègue désormais à
`ROOT.GensStorageV1.readJson(ROOT.localStorage,key,fallback)`.

Invariants conservés :
- mêmes clés ;
- mêmes fallbacks ;
- même ordre exact/famille ;
- même format JSON ;
- même filtrage des créatures ;
- même contenu des résumés ;
- aucune écriture ;
- aucune migration ;
- aucun changement Capture, Dungeon, Tactical, Stats, Save & Quit ou `index.html` ;
- aucun nouvel observer, timer, retry, wrapper ou monkey-patch.

Le test historique :
`tests/gens_world_summary_v167820.test.cjs`

est maintenant rejoué avec le vrai `storage-v1.js` chargé avant World Summary, comme dans la composition Pages/preview.

## Cartographie Phase 2

Après retrait de l'unique accès direct World Summary :
- accès directs : `214 -> 213` ;
- accès résolus : `143` inchangés ;
- accès dynamiques/non résolus : `71 -> 70` ;
- clés/familles directes résolues : `28` inchangées ;
- domaine Shell : `4 -> 3` accès directs ;
- domaine Shell non résolu : `1 -> 0`.

Aucun accès direct Builders n'a été réintroduit.

## Validation fonctionnelle

SHA fonctionnel validé :
`a7b4da7be7b11a7b31665bdcff536fce5fb0635c`

Résultats :
- Architecture + navigateur complet : run `35499062048` — SUCCESS ;
- Firefox : run `35499062042` — SUCCESS ;
- Tactical Dock : run `35499062060` — SUCCESS.

Dans Architecture :
- parité stockage World Summary — SUCCESS ;
- autorité Core World Summary — SUCCESS ;
- test historique World Summary via Core — SUCCESS ;
- cartographie Phase 2 stockage — SUCCESS.

Le navigateur complet confirme notamment :
- Survie ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture ;
- composition Capture complète ;
- non-interférence des quatre modules ;
- preview ;
- sentinelles assets Phase 4.

## Sortie du lot

Le lot ne produit volontairement aucune différence utilisateur visible. Aucun lien de test manuel ni publication de branche n'est nécessaire.

Après validation de cette fermeture documentaire :
1. créer `checkpoint/gensrpg-phase4-storage-world-summary-green-2026-09-20` sur le SHA exact validé ;
2. ouvrir un nouveau checkpoint de départ et une nouvelle branche d'audit stockage depuis ce GREEN ;
3. sélectionner le prochain sous-périmètre minimal ;
4. ne pas attaquer `gensrpg_dungeon_runtime_v2` ni les accès dynamiques restants comme un bloc global.
