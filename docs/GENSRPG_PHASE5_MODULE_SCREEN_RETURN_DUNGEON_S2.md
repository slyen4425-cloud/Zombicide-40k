# GenSrpG — Phase 5 / raccord retour écran Shell — Dungeon S2

Date : 2026-09-23

## Base sûre

- Branche :
  `work/gensrpg-phase5-module-screen-return-dungeon-s2-2026-09-23`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-screen-return-dungeon-s2-2026-09-23`
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-screen-return-capture-s1-green-2026-09-23`
- SHA de base :
  `35200c468fd935dd0c6b93775ecdc4003ea4c7f3`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Capture S1 a été validé manuellement sur téléphone avant l'ouverture de S2.

## Règle 26

Copie locale exacte du runtime S1 vérifiée avant modification :

- taille : `8172505`
- blob Git : `c17460335b2deb5e5916dbf91448b0706c38d0df`
- contenu HTML complet.

## Objectif S2

Migrer uniquement la dernière autorité globale Dungeon :

`dungeonCore200Rebuild -> window.goMenu`

vers le contrat public Shell déjà introduit et utilisé par Capture S1.

La logique owner-local Dungeon `show()` doit rester inchangée.

## Modification runtime

Commit runtime :

`af32ebbd8df692efe8353bfda0b72329db88895b`

Runtime S2 :

- taille : `8172500`
- blob Git : `7b586e9fb14b7a93a0edb069e115fd6d48cbda97`

Ancien code retiré :

`const goOutside200=window.goMenu;`

et l'affectation :

`window.goMenu=function(){...}`

Remplacement owner-local :

```js
window.GensShellScreenReturnV1?.register?.("dungeon",function(){
  if(!active200||!isDungeonMode?.())return false;
  const sh=document.getElementById('sheet');if(sh)sh.style.display='none';
  return show()===true;
});
```

## Réduction d'autorité

Avant Capture S1 :

`captureFix139 -> dungeonCore200Rebuild`

Après Capture S1 :

`dungeonCore200Rebuild`

Après Dungeon S2 :

**aucune affectation inline `window.goMenu =`.**

Le `function goMenu()` natif Shell est désormais l'unique frontière globale.

Capture et Dungeon conservent chacun leur transition module-owned via le contrat
`returnToPrimaryView`.

## Contraintes respectées

- aucun nouveau wrapper global ;
- aucun observer ;
- aucun polling ;
- aucun retry ;
- aucun timer ajouté ;
- aucun fallback inter-module ;
- `show()` Dungeon non réécrit ;
- `captureEnterWorld139()` non réécrit ;
- `startConfiguredGame` non modifié ;
- `resumeGame` non modifié ;
- `openChar` non modifié ;
- Tactical non modifié ;
- Builder non modifié ;
- `main` non modifiée.

## TDD

Nouvelle sentinelle :

`tests/gens_phase5_module_screen_return_dungeon_s2_v1.test.cjs`

RED prouvé avant modification :
- provider Dungeon absent ;
- `goOutside200` encore présent ;
- dernier `window.goMenu` encore présent.

Après modification, la sentinelle exige :
- provider Dungeon enregistré via `GensShellScreenReturnV1` ;
- garde historique `active200 / isDungeonMode` conservée ;
- `show()` reste la transition owner-local ;
- aucun `goOutside200` ;
- aucun `window.goMenu =` dans Dungeon ;
- chaîne globale `goMenu` vide.

Les gardes historiques Core 0.30 / 0.23 / 0.01 ont été avancées vers
l'état cumulatif S2 sans relâcher leurs responsabilités protégées.

## Cartographie Phase 2

Cartographie régénérée depuis le runtime S2 exact :

- sourceIndexBlob :
  `7b586e9fb14b7a93a0edb069e115fd6d48cbda97`
- globals explicites distincts : `437`
- affectations inline : `763`
- globals multi-owner : `120`
- entrée explicite `goMenu` : absente.

## Validation attendue

Avant checkpoint GREEN final :

1. Architecture + navigateur complet — SUCCESS ;
2. Firefox — SUCCESS ;
3. Tactical Dock — SUCCESS ;
4. Dungeon fiche -> retour map via le vrai Shell ;
5. Dungeon map -> Tactical inchangé ;
6. Capture -> Hub inchangé ;
7. Capture victoire / reprise inchangée ;
8. Survival inchangé ;
9. Save & Quit / reprise inchangé ;
10. Builder inchangé ;
11. PvP inchangé ;
12. non-interférence quatre modules.

## Prochaine action

Après triple CI du SHA documentaire final :

- créer
  `checkpoint/gensrpg-phase5-module-screen-return-dungeon-s2-green-2026-09-23` ;
- construire une preview téléphone **composée comme GitHub Pages**, et non un
  `index.html` brut ;
- demander validation manuelle à Sylvain avant le chantier Phase 5 suivant.

Aucun merge sur `main`.
