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

Phase 1 — lancement Survie par le vrai Shell :
`checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18`

SHA :
`0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`

CI de fermeture : Architecture, Firefox et Tactical Dock GREEN.

## Chantier courant

**Phase 1 — sentinelle Save & Quit + vraie reprise complète par le Shell**

Branche :
`work/gensrpg-phase1-savequit-resume-sentinel-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase1-savequit-resume-sentinel-2026-09-18`

Base exacte :
`0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`

## Périmètre déclaré

Première intention **test-only** :
- partir d'une vraie session lancée par le Shell ;
- traverser le vrai propriétaire de Save & Quit ;
- fermer/recréer réellement le contexte navigateur ou recharger comme un retour utilisateur réel ;
- cliquer réellement sur **Reprendre** ;
- vérifier que la session, le module actif et l'état persistant reviennent sous la bonne autorité ;
- brancher la sentinelle à la CI si elle est stable.

Aucun correctif runtime dans ce lot si le test révèle un vrai défaut fonctionnel : caractériser d'abord, puis ouvrir un lot dédié.

## Propriétaires à identifier avant test

- propriétaire exact du bouton Save & Quit ;
- fonction(s) de persistance réellement appelées ;
- `resumeGame()` comme propriétaire Shell générique déjà identifié par l'audit ;
- garde famille/session existant ;
- état module réellement restauré après reprise.

## Fonctions/systèmes protégés

Ne pas modifier dans ce lot :
- gameplay Survie/Dungeon/Tactical/Capture/PvP ;
- moteurs de stats, dés, dégâts, inventaire ;
- déplacement/spawn/détection ;
- règles de sauvegarde ou structures persistantes ;
- navigation globale hors besoin de caractérisation ;
- PWA/cache ;
- aucun MutationObserver global, timer/retry de réparation, wrapper permanent ou monkey-patch.

## Tests prévus

1. identifier le vrai chemin Save & Quit dans `index.html` ;
2. réutiliser le vrai chemin de lancement déjà protégé ;
3. lancer une session réelle ;
4. provoquer Save & Quit par le vrai contrôle UI ;
5. vérifier la persistance attendue ;
6. recréer/recharger le navigateur ;
7. cliquer sur Reprendre ;
8. vérifier module/famille/session/état ;
9. vérifier non-prise d'autorité Dungeon quand le scénario n'est pas Dungeon, et inversement selon le scénario choisi ;
10. relancer Architecture + navigateur + sentinelles existantes.

## Risques

- plusieurs anciens chemins Save/Resume peuvent coexister ;
- un test trop synthétique pourrait injecter artificiellement l'état et masquer le vrai raccord ;
- le gros `index.html` peut imposer un harnais navigateur ciblé, sans recopier la logique métier ;
- une vraie régression de reprise doit être caractérisée sans rustine dans ce lot.

## Prochaine étape

Cartographier dans le vrai `index.html` le bouton Save & Quit, sa fonction propriétaire, les clés persistantes touchées et le chemin `resumeGame()`, puis écrire la sentinelle minimale du vrai round-trip Shell.

## Dette explicitement différée

La détection ennemie hors embuscade reste réservée à un chantier de caractérisation dédié après la Phase 1.
