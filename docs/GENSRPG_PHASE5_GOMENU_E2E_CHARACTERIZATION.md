# GenSrpG — Phase 5 / Caractérisation E2E goMenu

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-e2e-characterization-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-e2e-characterization-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-screen-transitions-preaudit-green-2026-09-23` ;
- SHA de base :
  `1a7cbeac8bf8765c8cda9afd0fe6b60a50bda57c` ;
- runtime :
  index blob `4f8c3b9be4189a9ac163fcb17531c95cbd783b05` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime n'est modifié dans ce lot.

## Sentinelles ajoutées

### Dungeon + Capture

`tests/gens_phase5_gomenu_e2e_browser_v1.test.cjs`

Chemins traversés sur la composition réelle :
- lancement Dungeon ;
- vraie fiche héros Dungeon ;
- appel de la frontière publique `goMenu()` ;
- retour au Core/map Dungeon ;
- fiche masquée ;
- aucun blocage pointer-events ;
- aucune modal Dungeon / dé spécial laissée ouverte ;
- Save & Quit Dungeon pour conserver une vraie sauvegarde persistante ;
- lancement Capture ;
- vieille sauvegarde Dungeon conservée ;
- appel de `goMenu()` dans une session Capture active ;
- Capture conserve le profil, le mode et le Hub ;
- Dungeon reste invisible ;
- la sauvegarde Dungeon n'est pas supprimée.

Résultat :
**GREEN**.

### Survie

`tests/gens_phase5_gomenu_survival_e2e_browser_v1.test.cjs`

Chemin traversé :
- lancement Survie par le vrai Shell ;
- vraie sélection de héros ;
- vraie session ;
- ouverture de la fiche héros par `openChar` ;
- appel de la frontière publique `goMenu()` ;
- retour au menu Survie ;
- fiche masquée ;
- aucune fuite Dungeon/Capture ;
- thème Dungeon absent.

Résultat :
**GREEN**.

## Conclusion sur la chaîne goMenu

Chaîne courante :

1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore023StabilityFix`
4. `dungeonCore030HeroReturnFix`
5. `dungeonCore200Rebuild`

Les chemins réels Dungeon, Capture et Survie sont maintenant protégés avant
toute suppression.

## Candidat de prochain micro-lot

Le meilleur candidat soustractif suivant est
`dungeonCore030HeroReturnFix -> window.goMenu`.

Raison :
- `dungeonCore200Rebuild` est l'intercepteur final ;
- s'il voit `active200 && isDungeonMode()`, il retourne avant délégation ;
- s'il délègue, alors `DungeonCore01.active` du runtime courant vaut
  `active200 === false`, ou `DungeonCore01.eligible()` vaut faux hors
  Dungeon ;
- la branche propre à Core 0.30 ne peut donc pas devenir vraie lorsqu'elle est
  appelée à travers le propriétaire final Core 2.00.

Cela donne une preuve plus forte qu'un simple ordre de wrappers.

Cette conclusion **n'autorise pas encore le retrait** :
un lot dédié TDD doit :
1. ajouter une sentinelle RED exigeant 4 propriétaires `goMenu` ;
2. retirer uniquement l'affectation `window.goMenu` de Core 0.30 ;
3. conserver le reste du bloc Core 0.30 ;
4. rejouer les deux nouvelles sentinelles E2E ;
5. rejouer Builder, Dungeon map/Tactical, Capture victoire/reprise, Survie et
   non-interférence ;
6. triple CI complète.

Aucun wrapper de compatibilité n'est autorisé.

## Dettes hors périmètre

- détection ennemie immédiate hors embuscade : différée ;
- embuscade proche des héros : automatique GREEN, validation manuelle non
  acquise.

Aucun merge sur `main`.
