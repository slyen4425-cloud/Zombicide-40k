# Agent 1 — Correctif Survie : Fouiller + arts disparus

Date : 2026-09-20

Branche obligatoire :
`work/gensrpg-survival-search-art-repair-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-survival-search-art-repair-2026-09-20`

Base exacte :
`151e714c1373748ee6a42a03a8ec7fb44aded8c9`

Production `main` reste gelée sur V16.78.114.11 :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission unique

Diagnostiquer puis corriger, seulement au vrai propriétaire, deux régressions du mode Survie :

1. le bouton / l'action **Fouiller** a disparu ;
2. des **arts/images du mode Survie** ont disparu ou ne sont plus liés.

Ces deux symptômes appartiennent au même lot seulement tant qu'ils restent strictement Survie. S'ils ont des propriétaires indépendants, faire deux commits/tests distincts sur cette branche, sans mêler d'autre fonctionnalité.

## Avant toute modification

Lire obligatoirement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `docs/GENSRPG_CURRENT_WORK.md`
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

Ne jamais travailler sur `main`.

## Règles de diagnostic

### Fouiller

- passer par le vrai Shell -> Survie ;
- prouver si l'action existe encore dans le moteur et a seulement disparu de l'UI, ou si son propriétaire/runtime ne l'expose plus ;
- vérifier les conditions réelles d'affichage/activation ;
- vérifier conflits de couches, `display`, `visibility`, `pointer-events`, classes d'état et éventuel recouvrement avant de modifier la logique métier ;
- ne pas recréer un second bouton ou une seconde action si le propriétaire existe déjà ;
- ne pas recopier une implémentation Dungeon.

### Arts Survie

- identifier les IDs/chemins réellement attendus par Survie ;
- vérifier si le défaut vient du catalogue, du resolver/chemin, du rendu ou d'un asset absent ;
- conserver la frontière de module : aucun fallback Dungeon/Capture/PvP pour réparer Survie ;
- ne pas déplacer physiquement les assets dans ce lot ;
- ne pas modifier le resolver Core commun sans preuve que son contrat Survie est réellement le propriétaire requis.

## Interdits

- aucun nouveau MutationObserver global ;
- aucun timer/retry/heartbeat de réparation ;
- aucun monkey-patch global pour réafficher Fouiller ou les images ;
- aucun changement Dungeon, Tactical, Capture, PvP, stockage/migrations ou Builders ;
- aucun merge sur `main` ;
- aucune publication sans demande du coordinateur/utilisateur.

## index.html — règle 26

Si le diagnostic exige le contenu exact du gros `index.html`, utiliser cette base exacte :

https://github.com/slyen4425-cloud/Zombicide-40k/blob/151e714c1373748ee6a42a03a8ec7fb44aded8c9/index.html

Demander à l'utilisateur de télécharger ce fichier précis et de l'envoyer en ZIP avant toute modification du gros HTML.

## Tests requis

Avant GREEN, au minimum :
- reproduction RED du bouton Fouiller sur le vrai chemin Survie ;
- test GREEN prouvant que Fouiller réapparaît et reste fonctionnel ;
- test des arts Survie affectés via leur vrai renderer ;
- absence de fallback inter-module ;
- scénario Survie existant ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;
- vérification que Dungeon/Capture/PvP n'ont pas été modifiés.

## Sortie attendue

À la fin :
- cause exacte pour Fouiller ;
- cause exacte pour les arts ;
- fichiers/propriétaires modifiés ;
- tests ajoutés ;
- SHA fonctionnel ;
- runs CI ;
- checkpoint GREEN dédié ;
- aucun merge sur `main`.


## Résultat final du lot

### Fouiller — diagnostic clos sans correctif runtime

Le vrai chemin navigateur a été exercé :
`Shell -> Survie -> partie Survie -> fiche héros`.

Sur la base exacte `151e714c1373748ee6a42a03a8ec7fb44aded8c9`, avec l’`index.html` vérifié (blob `ff11682d74be7921a591a9b76080eaf337c071be`) :
- `#searchItemBtn` existe ;
- le bouton est visible dans la fiche héros Survie ;
- une seule action Fouiller est exposée ;
- `onclick="searchItem()"` reste raccordé ;
- un clic réel modifie bien `state.found` et affiche l’objet tiré ;
- aucune couche Dungeon/Tactical/Capture ne masque le bouton dans ce scénario.

Conclusion :
- la disparition de Fouiller signalée n’est pas reproductible sur cette base exacte ;
- aucun second bouton, wrapper, observer, timer/retry ou patch CSS n’a été ajouté ;
- aucun runtime ni `index.html` n’a été modifié pour Fouiller.

### Arts Survie — cause et correction

Cause exacte :
- le catalogue historique Survie référence toujours les chemins `assets/img_01_...` à `assets/img_32_...` ;
- les renderers Survie les utilisent correctement ;
- les 32 fichiers physiques correspondants avaient disparu du dépôt courant ;
- le défaut se manifestait donc par des 404, pas par un resolver inter-module défectueux.

Correction :
- restauration des 32 fichiers historiques exacts depuis le package Git historique `Z40K_GITHUB_PAGES_READY.zip` du commit `2d1d405006b8e3ec7e3c05fc8beda3e040451108` ;
- contrôle SHA-256 des 32 fichiers avant commit ;
- aucun déplacement d’asset ;
- aucun fallback Dungeon/Capture/PvP ;
- aucun changement du resolver Core commun.

Plages restaurées :
- `img_01` à `img_06` : héros Survie built-in ;
- `img_07` à `img_26` : objets / cartes de Fouille ;
- `img_26` à `img_32` : arts ennemis/réserve historiques selon les renderers existants.

### Sentinelle ajoutée

`tests/gens_survival_search_art_browser_v11411.test.cjs` vérifie :
- vrai Shell -> Survie ;
- fiche héros Survie ;
- visibilité et unicité de Fouiller ;
- fonctionnement réel de `searchItem()` ;
- chargement/décodage des 6 arts héros ;
- chargement/décodage des 20 arts objets/cartes ;
- chargement/décodage des 7 arts ennemis ;
- couverture collective `img_01` à `img_32` ;
- absence de 404 Survie et de fallback inter-module.

Le workflow temporaire utilisé une seule fois pour récupérer les blobs historiques a été supprimé avant clôture du lot.

### Validation fonctionnelle avant nettoyage documentaire

HEAD fonctionnel :
`df7bbc8fa25aa37dfc19abfcfa090f155debf0aa`

Runs :
- Architecture + navigateur complet : `35490767423` — SUCCESS ;
- Firefox : `35490767454` — SUCCESS ;
- Tactical Dock : `35490767445` — SUCCESS ;
- restauration historique one-shot : `35490767438` — SUCCESS.

Aucun fichier Dungeon, Tactical, Capture, PvP, Builders, stockage/migrations ou runtime Survie n’a été modifié.
Aucun merge sur `main`.
