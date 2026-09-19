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
