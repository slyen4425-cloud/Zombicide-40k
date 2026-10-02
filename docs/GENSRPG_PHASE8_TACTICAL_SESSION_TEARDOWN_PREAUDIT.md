# GenSrpG — Phase 8 — Pré-audit teardown de session Tactical — 2026-10-02

## Base

- checkpoint GREEN : `checkpoint/gensrpg-phase8-tactical-session-activation-green-2026-10-02`
- SHA : `6fd4b1e601db48b93c9f6a6f1466b487e7ab1f64`
- branche : `work/gensrpg-phase8-tactical-session-teardown-preaudit-2026-10-02`

## Pourquoi ce pré-audit est nécessaire

Le micro-lot 5 a retiré l'activation eager : avant le premier combat, seule la façade Bridge est chargée et la pile privée Tactical reste froide.

Le critère de sortie n'est cependant pas encore atteint après une première session, car la pile activée n'est pas démontée par `UI.close()`.

Le but de ce pré-audit n'est pas de nettoyer V108 -> V114 fichier par fichier. Il identifie uniquement les ressources actives qui survivent réellement à la fermeture et sélectionne un propriétaire unique de teardown.

## Ce qui est déjà correctement session-scoped

- l'overlay Tactical est retiré par `UI.close()` ;
- `battle` et l'état de sélection local sont remis à zéro ;
- le listener `click` posé sur `rootEl` disparaît avec l'overlay ;
- les overlays de transition V114.11 utilisent un timer borné qui retire leur propre élément.

Ces éléments ne justifient pas de nouveau nettoyage Phase 8.

## A — blocages réels restant après close

### A1 — aucun propriétaire de désactivation

`GensTacticalV1` possède désormais `activate()`, mais aucun `deactivate()` / `dispose()`.

Son état `active` reste donc vrai après la fermeture locale du combat.

### A2 — Bridge installé globalement

Lors de l'activation, le Bridge remplace/publie notamment :

- `dc200StartCombat` ;
- `openDungeonCombatSetup` ;
- les compatibilités `launchCombat200` / `startCombat` lorsqu'elles existent ;
- `openTacticalCombatV2`.

Aucun uninstall/dispose n'existe aujourd'hui.

### A3 — listeners et wrappers de compatibilité survivants

Après la première activation, V108, V109, V110, V111, V112, V113 et V114.11 gardent des listeners document et/ou wrappers sur UI, adapter, engine ou fonctions globales.

Ils n'exposent aucun `dispose()`.

### A4 — retries non possédés par la session

Les `installWithRetries()` restent bornés, mais leurs handles ne sont pas stockés/cancelables.

Une session courte peut donc se fermer avant les derniers retries — V113 va jusqu'à 10 000 ms — puis voir une réinstallation après `close()`.

### A5 — V113 reste actif dans l'exploration Dungeon

V113 conserve après fermeture :

- wrapper de `dungeonMoveHero098` ;
- wrappers d'événements Dungeon ;
- listeners board `click` + `pointerup` ;
- capacité de rappeler `dc200StartCombat`.

Cette autorité privée Tactical ne doit pas survivre entre deux sessions. Les callsites Dungeon actifs étant déjà Bridge-backed, elle n'est pas nécessaire comme seconde autorité globale permanente.

### A6 — polish Dungeon de la base UI

La base UI installe `patchDungeonMapHtml()` + `hookDungeonRender()` lors de son chargement privé. Ces hooks restent ensuite actifs après `close()`.

## B — non bloquant

- les balises `script` déjà chargées peuvent rester dans le document si leurs autorités sont inertes ;
- les objets API globaux peuvent rester en mémoire pour permettre une réactivation sans recharger le code ;
- le listener posé sur le root overlay est déjà détruit avec ce root ;
- les timers purement visuels auto-nettoyants ne justifient pas un lot séparé ;
- le code historique inactif reste backlog.

## Propriétaire unique sélectionné

**`GensTacticalV1` doit devenir le propriétaire du teardown de session.**

Contrat cible du prochain micro-lot :

1. `activate()` reste l'unique activation privée ;
2. un `deactivate()/dispose()` idempotent est ajouté au même propriétaire ;
3. les ressources privées réellement installées sont démontées en ordre inverse ;
4. les timers/retries encore pendants sont annulés ;
5. les wrappers globaux sont restaurés vers leur `__original` lorsqu'ils appartiennent à la session ;
6. les listeners document disposent de références retirables ;
7. `UI.close()` signale la fin de session via la frontière Bridge/entry, sans créer une seconde autorité ;
8. la façade Bridge reste chargée et inerte entre les combats ;
9. une requête de combat suivante peut réinstaller proprement la même pile.

Le futur lot est donc **un lot lifecycle de teardown homogène**, pas sept nettoyages legacy.

## Ce qui ne doit pas être fait

- supprimer les fichiers V108-V114 simplement parce qu'ils sont anciens ;
- réécrire gameplay, hit, dégâts, armure ou IA ;
- déplacer des callsites Dungeon déjà Bridge-backed ;
- toucher Capture/PvP/Survival ;
- modifier `index.html` ;
- ajouter observer, heartbeat, polling ou retry supplémentaire.

## Décision

Le critère Phase 8 n'est pas encore satisfait après la première session, mais le blocage restant est maintenant borné :

**ownership unique du teardown + ressources globales de session réinstallables.**

Aucun autre nettoyage legacy n'est justifié avant ce lot.

## Validation

Ce pré-audit est documentaire + sentinelle statique. Aucun runtime n'est modifié.

Après triple CI GREEN :
- checkpoint GREEN du pré-audit ;
- ouvrir un seul micro-lot runtime `session teardown ownership` ;
- RED isolé avant modification ;
- après ce lot, ré-audit immédiat du critère de sortie Phase 8 au lieu de poursuivre du nettoyage opportuniste.
