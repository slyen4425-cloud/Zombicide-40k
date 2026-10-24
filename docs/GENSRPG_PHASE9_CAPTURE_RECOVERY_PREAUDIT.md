# GenSrpG — Phase 9 — Pré-audit de reprise Monster Capture — 2026-10-02

## Base GenSrpG

- checkpoint GREEN : `checkpoint/gensrpg-phase8-exit-green-2026-10-02`
- SHA : `03da28af683607719a635f89db5f47c41c9fbbe6`
- checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-recovery-preaudit-2026-10-02`
- branche : `work/gensrpg-phase9-capture-recovery-preaudit-2026-10-02`
- `main` reste gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

Aucun runtime GenSrpG ou laboratoire n'est modifié dans ce pré-audit.

## Critère officiel Phase 9

Roadmap :

> Capture peut démarrer sans runtime Dungeon/Survie actif.

Interprétation renforcée :
- **Capture est un module autonome de premier niveau**, frère de Survie, Dungeon et Versus/PvP ;
- Capture ne doit plus être un sous-mode Dungeon ni utiliser Dungeon comme identité fonctionnelle ;
- son lifecycle, son monde/exploration, son combat, ses créatures, son équipe/réserve, sa UI et sa sauvegarde doivent appartenir à Capture ;
- Dungeon peut au plus partager des services génériques via Core, jamais servir d'autorité ou de runtime hôte ;
- à la sortie de Phase 9, lancer Capture ne doit nécessiter aucun runtime privé Dungeon/Survie actif.

La Phase 9 ne demande pas de jeter le mode Capture existant ni de fusionner le laboratoire en bloc. Elle demande de rendre Capture autonome avec des propriétaires explicites.

## État réel du dépôt principal

### Shell

Le Shell final possède déjà l'autorité de lancement :
`assets/gensrpg/shell/module-launch-final-authority-v1.js`.

Son comportement est routing-only :
`activeModule() -> startModuleSession(moduleId)`.

Il ne lit aucun état privé Capture, Dungeon ou Survival et ne possède aucune règle gameplay.

### Provider Capture

Le provider public `capture` existe déjà dans `GensShellModuleLaunchV1`.

La preuve Phase 5 établit qu'il :
- refuse un contexte non-Capture ;
- délègue à la référence stable du propriétaire Capture139 ;
- retourne seulement `handled=true/false`;
- ne lit ni DOM, ni storage, ni état privé dans le provider lui-même.

Donc **le routage Shell n'est pas le chantier Phase 9 à recréer**.

### Module Capture cible

`assets/gensrpg/capture/entry-v1.js` est encore une entrée Phase 3 strictement inerte.

Son contrat :
- possède à terme Monster Capture runtime, créatures, biomes, capture, équipe/réserve et combat Capture ;
- interdit les runtimes privés Dungeon, Survival et PvP ;
- prévoit un install/dispose explicite.

Il n'existe donc pas encore d'entrée runtime Capture autonome dans l'arborescence cible.

### Runtime Capture actuellement joué

Les sentinelles réelles verrouillent encore un substrat historique :
- profil built-in Monster Capture ;
- `gameStyle="dungeon"` ;
- famille Shell `adventure` ;
- content-family `creature` ;
- `gensMode151() === "capture"` ;
- `isDungeonMode() === true` ;
- Capture139 possède le lancement Capture ;
- V137/V138 gardent encore du contexte/nettoyage pré-game Dungeon/Capture ;
- V151 réconcilie les UI Capture/Dungeon ;
- le panneau Dungeon classique reste caché pendant Capture.

Cela prouve un **héritage de substrat et de routage**, mais pas que le provider Shell final dépend d'une règle privée Dungeon : Capture139 intercepte le contexte Capture avant délégation.

Le premier travail Phase 9 doit donc isoler l'autorité Capture existante derrière sa propre entrée avant de remplacer son moteur interne.

## État réel du laboratoire Exploration

Dépôt :
`slyen4425-cloud/laboratoire_dynamique_exploration-`.

Ce laboratoire est explicitement isolé de GenSrpG principal et du laboratoire Combat Dynamique. Sa cible architecturale est déjà compatible avec la Phase 9 :

```text
GenSrpG Shell
   -> Capture runtime
      -> Capture Exploration
         -> Encounter Bridge
            -> Capture Combat
```

Il ne doit donc jamais devenir un runtime Dungeon ni une seconde autorité Combat.

### Référence de travail actuelle

Branche :
`work/exploration-map-actor-editor-v1-2026-10-02`

Cutoff de reprise relu :
- HEAD documentaire de la branche : `f9209d4b55506b1fc3cab438ed8b7429551f8cad` ;
- HEAD runtime technique correspondant : `3f6cc88b39d99e62589182cdee28f89538e7f3e8` ;
- CI runtime `37059461116` — SUCCESS ;
- Pages `37059948321` — SUCCESS.

Tout commit Exploration postérieur à `f9209d4...` devra être traité comme un delta à ré-auditer avant intégration.

Base GREEN du chantier :
`checkpoint/exploration-world-builder-dynamique-ui-v1-green-2026-10-02`
= SHA `80e6468eda0261e0f7db12c81f98beb13df339ab`.

La branche Map Actor est 25 commits devant cette base, sans divergence.

### Autorités déjà structurées à préserver

- Exploration Engine : position/mouvement ;
- Collision World : collisions ;
- WorldDocument / World Surface Model : monde et surfaces ;
- World Builder Dynamique : édition de données, jamais runtime ;
- WorldObject / WorldArea / Portal : objets et passages ;
- MapActorVisual v1 : représentation visuelle seulement ;
- Map Actor Renderer : rendu, sans position/collision/stats ;
- Encounter Bridge : future frontière Exploration -> Capture Combat.

Le laboratoire n'a aucune autorité sur le Shell GenSrpG, les services Core partagés ou le moteur Capture Combat.

### Map Actor Editor — statut exact

Le chantier édite visuellement héros / PNJ / créatures en réutilisant le Map Actor Visual System v1.

Une régression réelle a été documentée :
- les réglages Map Actor étaient visibles dans le Builder ;
- `Tester en jeu` lançait le runtime avec le visuel par défaut ;
- le retour Builder perdait les réglages.

La correction architecturale transporte désormais, pour la session de test :
- WorldDocument canonique ;
- MapActorVisual v1 optionnel ;
- source image de session optionnelle ;
sans transporter de position Builder, collision, stat ou IA.

Le correctif de source `data:` / cache revision est techniquement GREEN :
- correction : `a5a2a05bac42267c365ebf16696dce5e8a390d7d`;
- CI `37059209076` — SUCCESS ;
- cache-bust runtime final : `3f6cc88b39d99e62589182cdee28f89538e7f3e8`;
- CI finale `37059461116` — SUCCESS.

Mais le chantier Map Actor reste **non GREEN utilisateur** tant que le test smartphone complet Builder -> Tester en jeu -> retour Builder n'est pas validé.

Décision Phase 9 :
- préserver cette architecture comme source de référence ;
- ne pas importer le labo Exploration en bloc ;
- ne pas déclarer Map Actor final GREEN avant validation utilisateur ;
- lors de l'intégration, raccorder Exploration sous le runtime Capture autonome, jamais sous Dungeon ;
- remplacer ses adapters locaux par les contrats Core/Shell/Capture appropriés sans créer de seconde autorité.

## État réel du laboratoire Combat Dynamique

Dépôt :
`slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

### Important : `main` du labo n'est pas l'état moderne

Le `main` du labo reste sur le socle de fondation :
`3197388f2b3ee7491be6e6125a015315158cffa2`.

Les travaux modernes sont portés par des branches/checkpoints dédiés.

Il est donc interdit de traiter `main` comme la version à intégrer.

### Référence technique cumulative récente

Checkpoint / preview :
`checkpoint/lab-dot-editor-clarity-v1-green-2026-10-02`
= `preview/lab-dot-editor-clarity-v1-2026-10-02`
= SHA `3414ad1e23a2204daf79f26cdd4e381982b713c6`.

Validation documentée :
- CI `37049757197` — SUCCESS ;
- suite complète : **864/864 PASS** ;
- statut : GREEN technique, preview utilisateur encore requise.

Ce SHA descend du checkpoint Universal Visible Contact V1 `5aed8b3c9a7963edb06b5cca17fa676c924451c6` de 43 commits sans divergence.

### Sous-systèmes déjà dans l'ascendance de `3414ad1...`

- Stats / progression architecture :
  `cd6d8ceab41785fb915c4f790022fb439c9063d8`.
- Stats / progression éditeur prévalidation :
  `a10ff7ea776f6e05e39e4aaa35bd3dc69dce5ba2`.
- Database Core V1 :
  `e7d462ca3e75b0aa53e46fc89d86f7ff933d7fe1`.
- Compétences complexes natives :
  `6a2392f00fa5129f2e25647464d4613da86582e1`.
- Catalogue créatures canonique :
  `ebf1134e070458e225cc05d7d17fb07b74779d7c`.
- Santé/PV comme stat :
  `783c824625f1785e86cabffe9eec8f09ba2b2aa0`.
- Packages de transfert d'entités :
  `5bc2da5fa6595ece89ed527ba6e55f0446f12c34`.
- Sémantique legacy des statuts :
  `77875449190d2dce16f5ef96d7a3f72b019f5523`.
- Taxonomie audio Capture :
  `4e98b0e6c8a0f715b5353d1eb43358bc65c11aa2`.
- Contact visible universel :
  `5aed8b3c9a7963edb06b5cca17fa676c924451c6`.

Le laboratoire conserve une seule chaîne d'autorité du contact :
`géométrie visible -> Combat Runtime.reportActionContact() -> Combat Session / Action Resolver -> Presenter`.

Il n'existe pas de moteur spécial Boule de feu / Griffe / Plongeon / Téléportation.

### Branches divergentes à ne pas fusionner aveuglément

#### Database Export/Import R2

`checkpoint/lab-capture-database-export-import-v1-r2-prevalidation-green-2026-09-30`
= `c7445b868445ade97f12b1575ac508bb3f159880`.

Cette branche diverge de la lignée récente après
`5bc2da5fa6595ece89ed527ba6e55f0446f12c34`.

Son delta propre porte surtout l'état fichiers/database de l'éditeur et son UI.
Le Core Database et les transferts existent déjà dans la lignée récente.

Décision Phase 9 :
**ré-audit du delta UI/files uniquement ; aucun cherry-pick global**.

#### Ancien checkpoint 1v1 / 2v2

`checkpoint/lab-capture-battle-format-1v1-2v2-prevalidation-green-2026-09-28`
= `adf504bdb9ef5c12a192e46de8ef2247967a7afc`.

Cette ancienne prévalidation est divergente de la lignée récente.

La lignée `3414ad1...` contient néanmoins déjà :
- `BattleFormatDefinition` ;
- données 2v2 ;
- client 2v2 ;
- tests 2v2 ;
- le même Combat Session / Runtime / Animation Core.

Décision Phase 9 :
**ne pas réintroduire l'ancienne branche ; auditer le 2v2 moderne présent dans la lignée récente**.

## Autorités du labo à préserver lors d'une future intégration

| Domaine | Autorité laboratoire | Règle Phase 9 |
| --- | --- | --- |
| Combat temporel | Combat Runtime | aucune seconde horloge Capture |
| Résolution dégâts/effets | Combat Session / Action Resolver | UI/renderer ne recalcule rien |
| Format 1v1/2v2 | BattleFormatDefinition | aucun booléen global 2v2 |
| Actifs/réserve/KO | Roster Session | pas de copie UI de l'état roster |
| Créatures éditées | configuredCreatures | IDs stables, pas de doublons |
| Capacités éditées | configuredSkills | une seule bibliothèque active |
| Stats | CaptureStatRegistryV1 | paramètres data-driven |
| Progression | CaptureProgressionRulesV1 | loadout complet préservé |
| PV | stat canonique health / Santé-PV | maxHp dérivé par règle générique |
| Statuts | StatusEffectV1 + Combat State | présentation séparée du gameplay |
| Contact visuel | Visual Controller/capteur -> reportActionContact | aucune hitbox ou moteur parallèle |
| Présentation | Presenter / Render Adapter | aucune règle gameplay |
| Audio | Audio Adapter + bindings | cycle de vie sans autorité combat |
| Database | CaptureDatabaseV1 | distincte du snapshot Combat |
| Export runtime | CaptureCombatExportV1 / adapters | projection dérivée, pas seconde source |

## Matrice de reprise Phase 9

| Domaine | GenSrpG actuel | Labo | Décision |
| --- | --- | --- | --- |
| Lancement module | Shell public -> provider Capture139 | autonome | conserver Shell ; déplacer l'autorité derrière l'entrée Capture |
| Entrée `assets/gensrpg/capture/` | inerte | n/a | premier seam d'ownership |
| Monde Capture / hub / capture | inline historique | labo Combat ne possède pas ce monde | conserver puis isoler progressivement |
| Exploration libre / carte | substrat Capture historique incomplet | labo Exploration : WorldDocument + Engine + Builder structurés | future intégration sous Capture runtime, jamais sous Dungeon |
| Visuel héros/PNJ/créature sur map | historique dispersé | MapActorVisual v1 + Renderer + Editor | préserver l'autorité visuelle unique ; validation smartphone encore requise |
| Combat Capture | inline historique | moteur autonome largement refondu | futur adaptateur, pas copie brute |
| Créatures | historique GenSrpG | configuredCreatures + catalogue canonique | réconcilier par ID stable |
| Capacités | historique GenSrpG | configuredSkills + effets complexes | réconcilier par ID stable |
| Stats/progression | historique | contrats génériques GREEN | intégrer seulement via adaptateur/contrats |
| 1v1/2v2 | ancien runtime Capture | format data-driven moderne | prendre la lignée récente, pas ancien fork |
| Assets/audio/FX | historiques dispersés | catalogues/bindings structurés | migration séparée après autorité runtime |
| Export/import | existant historique | Core DB dans lignée + UI R2 divergente | Core d'abord ; UI R2 ré-auditée |

## Régression à exclure explicitement

Une intégration précédente de presets/catalogue avait abouti à une bibliothèque visible ne contenant plus que le loup de test.

Cette situation ne doit jamais être interprétée comme un état de migration accepté.

Règle :
- la migration Phase 9 doit comparer les catalogues avant/après ;
- aucun catalogue actif ne peut être remplacé par un dataset de démonstration ;
- une créature existante est remplacée par ID stable, jamais dupliquée ou perdue ;
- les presets de démonstration ne deviennent pas l'autorité de la bibliothèque.

## Décision du pré-audit

La Phase 9 ne doit **pas** commencer par importer en bloc le moteur d'un des deux laboratoires.

Le premier seam à traiter est :

**ownership de l'entrée publique Capture**.

Cible :
1. `assets/gensrpg/capture/entry-v1.js` devient la frontière publique réellement chargée du module ;
2. le Shell continue de sélectionner uniquement le provider public ;
3. l'entrée Capture délègue d'abord au propriétaire Capture historique validé, sans déplacer de gameplay dans le Shell ;
4. aucune règle du labo n'est intégrée dans ce premier seam ;
5. après parité E2E, l'autorité inline Capture pourra être extraite progressivement derrière cette entrée ;
6. seulement ensuite, les sous-systèmes validés des laboratoires Combat et Exploration seront raccordés par des adapters Capture documentés, chacun sous son propriétaire cible.

Pourquoi ce seam est nécessaire au critère Phase 9 :
tant que l'entrée cible Capture est inerte et que l'autorité de session reste inline/historique, brancher directement le labo créerait une seconde architecture au lieu de séparer proprement le module.

## Validation GREEN

HEAD relu :
`9635d9c3409dc804b2a860fad04ccd38b7dd16dc`.

Triple CI :
- Architecture + Browser `37060581725` — SUCCESS ;
- Firefox `37060581712` — SUCCESS ;
- Tactical Dock `37060581734` — SUCCESS.

Décision :
**PRÉ-AUDIT DE REPRISE MONSTER CAPTURE GREEN**.

Aucun runtime GenSrpG, Combat Dynamique ou Exploration n'a été modifié par ce pré-audit.

## Prochaine étape autorisée

**Pré-audit dédié `Capture public-entry ownership`**, puis TDD RED avant toute modification runtime.

Ce prochain travail devra inspecter précisément le propriétaire inline Capture139 et son raccord de provider.

Il nécessite donc l'application de Rule 26 sur le `index.html` exact du checkpoint Phase 8 final avant toute modification.

Aucun merge, cherry-pick ou runtime Capture n'est autorisé par le présent document.
