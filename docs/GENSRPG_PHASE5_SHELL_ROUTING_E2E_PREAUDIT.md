# GenSrpG — Phase 5 / pré-audit end-to-end Shell routing

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-shell-routing-e2e-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-shell-routing-e2e-preaudit-2026-09-23` ;
- base exacte :
  `74aa0aba0b2b292edd0869223724ac1935392737` ;
- dernier checkpoint fonctionnel :
  `checkpoint/gensrpg-phase5-user-regression-repair-green-2026-09-23` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime, gameplay, asset ou `index.html` n'a été modifié dans ce pré-audit.

## Correction du statut manuel

La validation utilisateur précédente doit être lue ainsi :

- combat Dungeon sur la map : revenu / confirmé ;
- Builder : revenu / confirmé ;
- interface Capture : revenue / confirmée ;
- flux Capture observé : revenu dans l'ordre lors du test utilisateur précédent ;
- embuscade proche des héros : **non confirmée manuellement** ;
- détection ennemie hors embuscade : **toujours défaillante**, dette fonctionnelle déjà documentée et volontairement hors de ce lot.

La sentinelle automatique
`tests/dungeon_event_ambush_position_v167878.test.cjs`
reste GREEN mais ne vaut pas validation utilisateur de l'embuscade.

## Objectif

Renforcer les vraies frontières end-to-end avant toute nouvelle réduction de la
chaîne `startConfiguredGame` ou toute consolidation Shell :

1. Dungeon réel -> action carte -> Tactical V2 ;
2. Builder ;
3. Capture -> combat -> victoire -> retour Capture ;
4. Capture -> recréation page -> Reprendre -> Capture même si une ancienne
   sauvegarde Dungeon persiste ;
5. non-interférence inter-module.

## Nouvelles sentinelles

### Dungeon map -> Tactical V2

`tests/gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs`

Le scénario traverse :
- vrai Shell ;
- profil Dungeon ;
- vrai pré-game ;
- vraie session Dungeon ;
- vraie map/runtime ;
- vraie action `ENGAGER LE COMBAT` ;
- vrai Bridge Tactical ;
- vraie UI Tactical V2.

Résultat sur SHA `112bbf1995c3d11695c3eae2cf8432f1aa811fc7` :

**SUCCESS**.

Preuve observable :
- overlay Tactical V2 visible ;
- 25 cellules de champ de bataille ;
- héros Dungeon réel ;
- ennemi de la map présent dans la bataille ;
- profil Dungeon conservé.

Cette frontière qui avait régressé lors du retrait de `captureFix135` est désormais
couverte explicitement.

### Capture victoire + reprise inter-module

`tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs`

Le scénario construit volontairement le cas à risque :
1. vraie session Dungeon ;
2. Save & Quit laissant le runtime Dungeon persistant ;
3. passage réel par le Shell vers Monster Capture ;
4. lancement Capture réel ;
5. combat Capture réel ;
6. victoire réelle ;
7. bouton réel de fin de combat ;
8. retour au Hub Capture ;
9. recréation complète de la page avec stockage conservé ;
10. sélection du profil Capture ;
11. clic réel sur `Reprendre`.

Résultat :

**RED**.

Le chemin victoire -> fin de combat -> Hub Capture fonctionne.

Le RED est précisément sur la reprise :
- profil actif attendu : Capture ;
- mode attendu : Capture ;
- Hub Capture présent ;
- mais `gensDungeonCore01` devient aussi visible :
  `display: block` au lieu de `none`.

Message de sentinelle :

`Resume must not let stale Dungeon runtime steal Capture`.

## Autorité fautive caractérisée

L'index exact du checkpoint est inchangé depuis la base restaurée :
- taille : `8174148` octets ;
- blob : `f13835a2827dbfa9e2698cb026d3e732ad62aba4`.

La comparaison Git entre la base et le pré-audit confirme qu'aucun runtime ni
`index.html` n'a changé.

Le fichier utilisateur vérifié correspondant à ce blob montre plusieurs couches
Dungeon qui remplacent globalement `resumeGame`.

### Dungeon Core 3.10

Le dernier wrapper Dungeon :

- lit `gensrpg_dungeon_runtime_v2` ;
- considère la présence de `participants` comme suffisante ;
- active la session ;
- impose `gensSelectedFamily="adventure"` ;
- ajoute `gensDungeonTheme` ;
- appelle `DungeonCore01.show()` ;
- retourne `true` avant délégation.

Il ne vérifie pas que le profil/module actif est réellement Dungeon.

### Dungeon Core 3.07

La couche précédente possède elle aussi un wrapper global `resumeGame` fondé
sur la seule présence d'un runtime Dungeon persistant avec participants, puis
masque explicitement les surfaces Capture et affiche Dungeon.

### Core 1.00 historique

Une couche plus ancienne contient également une reprise Dungeon large basée sur
la présence de participants Dungeon et masque explicitement le Hub Capture.

## Conclusion architecturale

Le défaut ne doit **pas** être corrigé par une garde locale ajoutée uniquement à
Core 3.10.

Pourquoi :
- Core 3.10 déléguerait alors vers Core 3.07 ;
- Core 3.07 peut reproduire le même vol d'autorité ;
- la chaîne comporte plusieurs propriétaires globaux concurrents ;
- la roadmap Phase 5 exige précisément une autorité Shell unique de
  session/module actif.

La vraie prochaine étape est donc de cartographier toute l'autorité
`resumeGame`, puis de sélectionner un retrait/consolidation soustractif avec
TDD.

## Ancienne sentinelle Dungeon après Survie

`tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs`
a produit deux fois un RED indépendant :

- son exploration aléatoire a ouvert Tactical ;
- le scénario appelle ensuite la sortie Dungeon de façon programmatique ;
- l'overlay Tactical reste actif ;
- il intercepte le clic suivant vers la carte Survie.

Ce RED est reproductible sur le même runtime qui était GREEN avant ce pré-audit.
Il ne provient d'aucune modification runtime de ce lot.

Il s'agit d'une dette de déterminisme/fixture de sentinelle à traiter sans
affaiblir les assertions métier. Aucun changement runtime n'est justifié par ce
seul échec.

## CI du pré-audit

SHA :
`112bbf1995c3d11695c3eae2cf8432f1aa811fc7`.

- Architecture statique : SUCCESS ;
- Firefox : run `35834373360` — SUCCESS ;
- Tactical Dock : run `35834373409` — SUCCESS ;
- navigateur : RED attendu sur la nouvelle frontière Capture reprise ;
- Dungeon map -> Tactical V2 : SUCCESS.

Le pré-audit est donc **RED caractérisé**, pas GREEN.

## Prochain lot obligatoire

**Phase 5 — pré-audit d'autorité `resumeGame`.**

Objectifs :
1. inventorier toutes les affectations actives `resumeGame` dans l'ordre réel ;
2. caractériser leurs préconditions et délégations ;
3. identifier le propriétaire Shell historique et les interceptions Dungeon ;
4. déterminer les données minimales nécessaires pour router une reprise vers le
   module réellement actif ;
5. identifier les wrappers Dungeon qui sont redondants/supplantés ;
6. proposer un seul premier micro-lot soustractif ;
7. conserver la nouvelle sentinelle Capture RED comme TDD du vrai défaut.

Interdictions :
- aucune correction runtime dans le pré-audit ;
- aucune garde spéciale Capture ajoutée à un wrapper Dungeon ;
- aucun nouveau wrapper global ;
- aucun observer/timer/retry ;
- aucune modification de la détection ennemie ;
- aucun retrait de `captureFix135/138/139` ;
- aucun merge sur `main`.
