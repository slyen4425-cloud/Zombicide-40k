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

Phase 1 — Capture : protection du comportement actuel :
`checkpoint/gensrpg-phase1-capture-current-sentinel-green-2026-09-18`

SHA :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

CI de fermeture : Architecture, Firefox et Tactical Dock GREEN.

## Chantier courant

**Phase 1 — sentinelle explicite de non-interférence des quatre modules**

Branche :
`work/gensrpg-phase1-four-module-noninterference-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-four-module-noninterference-sentinel-2026-09-18`

Base exacte :
`8d6e9523e1cf9f13f9131b8f4b74f797154ebc7c`

## Périmètre déclaré

Première intention **test-only** :
- traverser plusieurs modules successivement dans un même contexte navigateur ;
- réutiliser les vrais propriétaires Shell déjà identifiés ;
- vérifier que le module quitté ne conserve pas une autorité UI/runtime sur le module suivant ;
- protéger explicitement les frontières Survie / Dungeon / Capture / PvP ;
- brancher la sentinelle à la CI si elle est stable.

Ce lot ne doit pas devenir quatre tests indépendants collés ensemble : il doit vérifier les transitions et l'absence de fuite d'autorité entre contextes.

## Invariants visés

### Survie -> Adventure/Dungeon
- le guard famille passe de `survival` à `adventure` ;
- `isDungeonMode()` reflète le profil Dungeon actif ;
- aucun runtime Dungeon ne doit être créé avant lancement réel ;
- le thème/état Survie ne doit pas reprendre l'autorité après le switch.

### Dungeon -> Survie
- le guard revient à `survival` ;
- `isDungeonMode() === false` ;
- le thème Dungeon doit être retiré ;
- aucun overlay/runtime Dungeon ne doit apparaître spontanément.

### Adventure/Dungeon -> Capture
- le changement de famille de contenu passe par le vrai mécanisme V16.155 si requis ;
- Capture reste classé aujourd'hui Shell `adventure`, contenu `creature`, mode V16.151 `capture` ;
- le Hub/pré-game Capture ne doit pas être remplacé par le panneau Dungeon classique ;
- aucune session/runtime Dungeon classique ne doit être créé artificiellement.

### Capture/Adventure -> PvP placeholder
- le placeholder PvP ne crée ni session, ni profil actif supplémentaire, ni runtime Dungeon/Capture ;
- il n'active pas un thème Dungeon/Capture ;
- il ne remplace pas le guard Survie/Adventure existant par une valeur PvP non supportée.

## Fonctions/systèmes protégés

Ne pas modifier dans ce lot :
- runtimes Survie, Dungeon, Tactical, Capture ou PvP ;
- navigation Shell ;
- guards famille/session ;
- persistance ;
- gameplay, stats, dés, combat, déplacement, spawn, capture ;
- assets ;
- PWA/cache ;
- aucun observer global, timer/retry de réparation, wrapper permanent ou monkey-patch ;
- `main`.

## Tests prévus

1. construire le harnais depuis les blocs source exacts déjà caractérisés ;
2. ouvrir Survie puis Adventure/Dungeon dans le même contexte ;
3. revenir vers Survie et vérifier le retrait de l'autorité Dungeon ;
4. basculer vers Monster Capture, y compris le reload V16.155 lorsqu'il s'applique ;
5. vérifier les prédicats Capture et l'absence de panneau/runtime Dungeon classique ;
6. ouvrir le placeholder PvP et vérifier qu'il ne crée aucune autorité/session supplémentaire ;
7. relancer toutes les sentinelles existantes ;
8. si GREEN, mettre à jour la matrice Phase 1 et décider formellement si le critère de sortie Phase 1 est atteint.

## Risques

- certaines transitions conservent volontairement des données persistantes non actives ; le test doit distinguer persistance légitime et autorité active ;
- Capture utilise encore historiquement `gameStyle="dungeon"` : cela ne doit pas être traité comme une fuite par erreur ;
- PvP ne possède pas encore de famille persistante propre : le guard existant peut rester inchangé sans que PvP prenne l'autorité ;
- un RED réel doit être caractérisé avant toute correction dédiée.

## Prochaine étape

Inspecter les propriétaires de retour vers le Shell et de changement de profil/famille afin de construire une seule sentinelle de transition réelle entre les quatre modules.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
