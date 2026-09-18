# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Dernier checkpoint vert

Phase 1 — comportement actuel Monster Capture :
`checkpoint/gensrpg-phase1-capture-current-sentinel-green-2026-09-18`

SHA :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

CI de fermeture :
- Architecture `35321622307` — SUCCESS
- Firefox `35321622222` — SUCCESS
- Tactical Dock `35321622236` — SUCCESS

## Chantier courant

**Phase 1 — non-interférence explicite des quatre modules**

Branche :
`work/gensrpg-phase1-four-module-noninterference-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-four-module-noninterference-2026-09-18`

Base exacte :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

## Périmètre déclaré

Première intention **test-only** :
- traverser les vrais points d'entrée déjà couverts de Survie, Dungeon, Capture et PvP ;
- vérifier explicitement qu'un module ne laisse pas de thème, profil, session, runtime, overlay ou autorité UI parasite dans le suivant ;
- réutiliser les propriétaires réels et les sentinelles existantes plutôt que recopier leur logique ;
- couvrir les transitions représentatives qui exposent le risque de contamination inter-module.

Interdictions :
- aucun correctif runtime dans ce lot ;
- aucune nouvelle logique de navigation ;
- aucun moteur PvP ;
- aucune restauration/réécriture Capture ;
- aucun changement gameplay Survie/Dungeon/Tactical ;
- aucun MutationObserver global, timer/retry de réparation ou monkey-patch ;
- ne pas toucher à `main`.

## Invariants à protéger

- Survie : famille `survival`, pas de mode/thème/runtime Dungeon ;
- Dungeon : famille `adventure`, profil Dungeon, autorité Dungeon active uniquement dans son contexte ;
- Capture : famille Shell `adventure`, contenu `creature`, mode V16.151 `capture`, Hub Capture sans panneau Dungeon classique ;
- PvP : placeholder seulement, aucune session/profil/runtime créé ;
- quitter/changer de module ne doit pas laisser d'overlay ou de vue d'un autre module au-dessus ;
- la clé de guard famille ne doit pas être détournée par PvP ;
- les états persistants d'un module ne doivent pas être écrasés par l'ouverture d'un autre.

## Tests prévus

1. réutiliser un harnais Shell réel commun minimal ;
2. établir un état Survie et vérifier absence d'autorité Dungeon/Capture/PvP ;
3. passer vers Adventure/Dungeon et vérifier nettoyage de l'état visuel Survie ;
4. passer vers Monster Capture et vérifier mode `capture`, Hub Capture et masquage Dungeon ;
5. revenir au Shell puis ouvrir PvP et vérifier qu'aucune session/profil/runtime parasite n'est créé ;
6. vérifier la conservation des états persistants propres aux modules lorsqu'ils ne doivent pas être modifiés ;
7. relancer toutes les sentinelles navigateur existantes ;
8. si GREEN, mettre à jour la matrice Phase 1 et vérifier le critère de sortie complet avant Phase 2.

## Risques

- les transitions de famille peuvent provoquer le reload V16.155 ;
- certains anciens états persistants peuvent légitimement rester stockés sans être actifs : le test doit distinguer persistance inactive et autorité active ;
- PvP n'appartient pas au guard Survie/Adventure et ne doit pas être forcé dedans ;
- un RED réel devra être caractérisé sans correction dans ce lot.

## Prochaine étape

Construire la sentinelle de frontières en réutilisant les blocs source exacts déjà validés par les lots Survie, Save/Resume, PvP et Capture, puis tester les transitions une par une.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
