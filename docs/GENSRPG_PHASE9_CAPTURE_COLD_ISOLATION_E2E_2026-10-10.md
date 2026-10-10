# Phase 9 — Axe A — Capture à froid sans runtime Dungeon : preuve navigateur GREEN

Date : 10 octobre 2026. **Micro-lot exclusivement diagnostic et sentinelles. Aucun changement runtime, index HTML, état utilisateur ou gameplay.**

## Gouvernance

- Base immuable : `checkpoint/gensrpg-phase9-capture-exit-gate-green-2026-10-10` → `a556eeb0f6798e1cf210eca5896ac75231efc1c6`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-runtime-isolation-e2e-2026-10-10`, même SHA.
- Branche de travail : `work/gensrpg-phase9-capture-runtime-isolation-e2e-2026-10-10`.
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Les branches divergentes `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09` et `work/gensrpg-phase9-capture138-legacy-start-retirement-2026-10-09` ne sont ni fusionnées ni modifiées.
- Règle 26 : **aucune lecture API directe ni modification de `index.html`** ; seul le runner Playwright lit la composition réelle du dépôt au checkout.

## Scénario réel

Source permanente : `tests/gens_phase9_capture_cold_runtime_isolation_browser_v1.test.cjs`, dérivé du vrai test de victoire/reprise existant, **en retirant complètement la préparation d'une partie Dungeon**.

Chromium mobile `412×915` avec stockage local et session vidés au démarrage. Chargement réel de `preview.html` et de ses propriétaires, sans services de substitution applicative autres que la neutralisation Supabase externe déjà utilisée dans les sentinelles existantes.

1. Sur accueil vierge, vérifier absence de `gensrpg_dungeon_runtime_v2` et `gensrpg_dungeon_state_v1`.
2. Sélectionner réellement le profil Monster Capture, dresseur, créature de départ et lancement via le bouton du pré-game/Shell.
3. Lire `GensShellModuleLaunchV1.activeModule()`, `gensMode151()`, `isDungeonMode()`, la vraie UI et les clés runtime privées Dungeon.
4. Cliquer sur le bouton d'exploration/jour suivant, vérifier la persistance du **jour 2**.
5. Construire un combat avec le véritable `captureStartBattleAutomatic` ; comme le test historique, rendre une victoire déterministe en abaissant les PV adverses dans la **fixture de combat**, sans remplacer le moteur ; utiliser le vrai `captureBattleUseAbility`, puis cliquer sur le bouton réel `captureBattleFinishAndClose()`.
6. Fermer l'onglet, recréer la page, sélectionner Capture et utiliser le véritable bouton Reprendre. Ne précréer aucun runtime Dungeon durant le parcours.
7. À toutes les étapes : inspecter les **états réels**, pas des flags injectés ; ne pas supprimer artificiellement les clés privées après lancement.

## Résultat strictement observé sur GitHub

[Run ciblé **38023317474** — SUCCESS](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38023317474) sur SHA `f03689f99e2b12bcb27794f4da9fe067c9f443e5`.

| Étape | Shell | Mode 151 | Dungeon mode | Dungeon runtime / state | Monde Capture |
| --- | --- | --- | --- | --- | --- |
| Accueil froid | survival (accueil par défaut) | other | false | `null / null` | aucun |
| Capture lancée | capture | capture | false | `null / null` | jour 1 |
| Exploration | capture | capture | false | `null / null` | jour 2 |
| Combat Capture actif | capture | capture | false | `null / null` | jour 2 |
| Après victoire | capture | capture | false | `null / null` | jour 2 |
| Rechargement avant Reprendre | capture | capture | false | `null / null` | jour 2 |
| Reprise Capture | capture | capture | false | `null / null` | jour 2 |

Le Hub Capture apparaît et le panneau Dungeon reste invisible ; ces deux éléments sont des **indices UI supplémentaires**, non la preuve principale. Le moteur de combat Capture est le vrai moteur, mais la fixture utilise un combat rapide et des caractéristiques ajustées pour sa déterminisation.

## Ce que cette preuve signifie, et ses limites

**Prouvé :** le parcours réel ci-dessus démarre, progresse, combat, gagne et reprend **sans jamais créer de sauvegarde/état privé Dungeon, et sans identifier Capture comme Dungeon**. C'est une preuve supplémentaire forte que Capture n'utilise pas un *runtime Dungeon de session persisté* comme hôte.

**Non prouvé :** l'absence de tout appel à une fonction privée Dungeon/Survie en mémoire, de tout effet secondaire latent ou timer historique, et la **fermeture définitive/dispose d'une session Capture suivie d'une deuxième session propre**. Le navigateur charge encore du code historique commun ; l'absence d'une clé `localStorage` ne prouve pas l'absence de toute exécution privée. Il faut caractériser les propriétaires du lifecycle, pas supprimer à l'aveugle. Les contrôles d'activité Survie ici portent sur l'identité Shell et la non-activation de son panneau, pas sur une instrumentation exhaustive de son moteur.

**Décision :** l'axe A « vrai parcours froid sans runtime de session Dungeon » est **GREEN pour ses états publics et persistants** ; le critère général d'indépendance complète reste **PARTIEL**. Ne pas déclarer la Phase 9 finie et ne pas remplacer l'ancien E2E qui valide, lui, la présence d'une sauvegarde Dungeon étrangère préexistante. Le reste doit être borné aux vrais blocages B/C et à l'analyse des appels internes résiduels.

## CI et checkpoints

Le test est aussi branché dans le job Playwright de `.github/workflows/gensrpg-architecture-sentinels.yml`, près de la sentinelle Capture victoire/reprise. L'exécution ciblée documente l'observation, mais **ne remplace pas** les workflows Architecture+Browser, Firefox et Tactical au SHA final. Créer un checkpoint GREEN **de ce lot de caractérisation uniquement** quand la triple CI et le job Browser sont SUCCESS sur le même commit.

Aucun merge `main`, aucun changement du moteur et aucune proclamation de sortie Phase 9.
