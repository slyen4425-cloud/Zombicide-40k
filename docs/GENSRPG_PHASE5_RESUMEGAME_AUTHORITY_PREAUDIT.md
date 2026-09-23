# GenSrpG — Phase 5 / pré-audit d'autorité resumeGame

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-resumegame-authority-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-resumegame-authority-preaudit-2026-09-23` ;
- base :
  `65999b34c36ed2909921e957a17e810ca9d0a04a` ;
- dernier checkpoint fonctionnel GREEN :
  `checkpoint/gensrpg-phase5-user-regression-repair-green-2026-09-23`.

Aucun runtime n'est modifié dans ce pré-audit.

## Chaîne active exacte

Le runtime actif contient exactement trois autorités `resumeGame` :

1. Shell historique :
   `function resumeGame()`.
2. `dungeonCore307CriticalResumeFix` :
   `window.resumeGame = function()`.
3. `dungeonCore310PersistenceAndTokens` :
   dernier wrapper `window.resumeGame = function()`.

Ordre réel :
Shell -> Core 3.07 -> Core 3.10.

Le bloc `dungeonCore100ResumeAndInteractionFix` contient aussi une ancienne
reprise, mais son type est
`application/x-gensrpg-disabled` :
il est **inactif** et ne fait pas partie de la chaîne runtime.

## Défaut d'autorité

Core 3.07 et Core 3.10 prennent la reprise sur le seul critère suivant :

- un runtime `gensrpg_dungeon_runtime_v2` existe ;
- il contient encore des `participants`.

Aucun des deux wrappers actifs n'exige que le module/profil actif soit Dungeon.

Conséquence reproduite :
une ancienne sauvegarde Dungeon peut rester persistante après passage à Capture.
Lorsque la session Capture est active et que l'utilisateur clique sur
`Reprendre`, Core 3.10 voit encore les participants Dungeon et appelle
`DungeonCore01.show()`.

La nouvelle sentinelle prouve alors simultanément :
- profil actif = Capture ;
- mode actif = Capture ;
- Hub Capture disponible ;
- mais Dungeon devient aussi visible.

## Contrats existants à réutiliser

Aucun nouveau système de détection de module n'est nécessaire.

Le runtime possède déjà :
- `activeGameProfileId()` : source du profil actif ;
- `getActiveGameProfile()` ;
- `gensCurrentContentFamily()` ;
- `gensMode151()` qui retourne déjà :
  - `capture` ;
  - `dungeon` ;
  - `other`.
- `isCaptureContext138()` côté Capture.

Les entrées physiques :
- `assets/gensrpg/shell/entry-v1.js` ;
- `assets/gensrpg/capture/entry-v1.js` ;
- `assets/gensrpg/dungeon/entry-v1.js`

restent encore des contrats inertes Phase 3 et ne doivent pas être transformées
dans ce micro-lot.

## Propriétaire cible

La roadmap Phase 5 impose au **Shell** l'autorité unique sur :
- navigation générale ;
- ouverture/fermeture des écrans ;
- état de session/module actif.

Donc `resumeGame` doit redevenir une seule décision Shell.

Dungeon ne doit plus remplacer globalement `resumeGame`.
Dungeon doit seulement exposer son entrée de reprise à appeler quand le Shell
a déjà décidé que le module actif est Dungeon.

Capture ne doit pas remplacer globalement `resumeGame`.
Son Hub doit être restauré par le chemin Capture existant lorsque le Shell a
déterminé que Capture est actif.

## Premier micro-lot correctif retenu

Un seul lot homogène :

**Phase 5 — consolidation de l'autorité resumeGame au Shell.**

Le lot devra :

1. modifier le propriétaire Shell `resumeGame` existant, pas créer un wrapper ;
2. router selon le module/profil actif en réutilisant les discriminants existants ;
3. appeler Dungeon uniquement lorsque le module actif est réellement Dungeon ;
4. reprendre Capture sans supprimer ni muter une ancienne sauvegarde Dungeon ;
5. retirer les affectations globales `resumeGame` de Core 3.07 et Core 3.10 ;
6. ne pas modifier les autres responsabilités de Core 3.07 / 3.10 ;
7. conserver la reprise Survie historique ;
8. conserver Save & Quit / reprise Dungeon ;
9. faire passer la sentinelle Capture RED existante ;
10. conserver Dungeon map -> Tactical GREEN.

## Pourquoi il ne faut pas ajouter une garde Capture à Core 3.10

Une garde locale dans Core 3.10 ne serait pas suffisante :
- Core 3.10 déléguerait vers Core 3.07 ;
- Core 3.07 possède la même condition trop large ;
- deux autorités globales resteraient actives ;
- cela violerait la Phase 5 et la règle « un propriétaire unique ».

La correction doit donc être **soustractive** :
Shell propriétaire + retrait des interceptions Dungeon concurrentes.

## Tests obligatoires du lot correctif

- `gens_phase5_resumegame_authority_preaudit_v1.test.cjs` adapté en TDD cible
  pour exiger une seule autorité active ;
- `gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs` : doit passer ;
- `gens_savequit_resume_shell_browser_v11411.test.cjs` : Dungeon doit rester GREEN ;
- `gens_capture_current_shell_browser_v11411.test.cjs` ;
- `gens_four_module_noninterference_shell_browser_v11411.test.cjs` ;
- `gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs` ;
- Architecture ;
- Firefox ;
- Tactical Dock.

## Statut

Pré-audit d'autorité : **terminé**.

Sentinelle statique :
`Pré-auditer l'autorité resumeGame Phase 5` — SUCCESS sur le run
`35835303622`.

Le navigateur reste volontairement RED sur la frontière Capture/reprise déjà
caractérisée : ce RED devient le TDD du lot correctif suivant.

Aucun merge sur `main`.
