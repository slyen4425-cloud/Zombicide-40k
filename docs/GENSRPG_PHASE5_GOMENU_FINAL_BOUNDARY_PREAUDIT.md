# GenSrpG — Phase 5 / pré-audit frontière finale goMenu

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-final-boundary-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-final-boundary-preaudit-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-core01-retirement-green-2026-09-23` ;
- SHA exact :
  `764a13d57ed81bfe5d0fb7428ecd6c285b815719` ;
- index :
  taille `8170961`, blob `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

La base a été validée manuellement sur téléphone par Sylvain après le retrait
`goMenu` de Core 0.01.

Aucun runtime n'est modifié dans ce pré-audit.

## Chaîne restante

La cartographie et la sentinelle dédiée établissent exactement :

`captureFix139 -> dungeonCore200Rebuild`.

Il reste donc deux affectations globales de `window.goMenu`.

### captureFix139

Domaine primaire :
`capture`.

Responsabilité :
entrée Capture dédiée et séparation Capture/Dungeon.

Pour `goMenu`, cette couche :
- capture le propriétaire précédent ;
- intercepte une session Capture réellement active ;
- retourne dans le chemin Capture-owned via `captureEnterWorld139()` ;
- délègue hors Capture.

Verdict :
**responsabilité Capture réelle**.

Ce propriétaire ne peut pas être retiré sans fournir d'abord une entrée publique
Capture capable de préserver ce retour.

### dungeonCore200Rebuild

Domaine primaire :
`dungeon`.

Responsabilité :
runtime/API Dungeon Core 2.00 et interception finale de lancement Dungeon.

Pour `goMenu`, cette couche :
- capture la frontière précédente ;
- intercepte uniquement un Dungeon Core 2.00 actif dans un contexte Dungeon ;
- retourne vers son `show()` propriétaire ;
- délègue hors Dungeon.

Verdict :
**responsabilité Dungeon réelle**.

Ce propriétaire ne peut pas être retiré sans fournir d'abord une entrée publique
Dungeon capable de préserver ce retour.

## Contrat Shell cible

Le contrat Phase 3 du Shell déclare déjà que le Shell possède :
- `root navigation` ;
- `active module/session routing` ;
- `global screen transitions`.

Il déclare également consommer :
- `module public entry contracts`.

En revanche, les contrats Phase 3 Capture et Dungeon sont toujours
`contract-only-not-loaded` et ne déclarent encore aucun contrat public
spécifique de retour d'écran/module.

Leurs `entry-v1.js` restent volontairement inertes.

## Conclusion architecturale

Aucun des deux propriétaires `goMenu` restants n'est supprimable dans ce lot.

La frontière actuelle fonctionne correctement sur les E2E existants :
- Dungeon fiche héros -> `goMenu` -> map Dungeon ;
- Capture active avec vieille sauvegarde Dungeon -> `goMenu` -> Hub Capture ;
- Survie fiche héros -> `goMenu` -> menu Survie.

Mais le critère de sortie Phase 5 n'est pas encore atteint car les modules
Capture et Dungeon remplacent toujours une fonction globale de navigation.

La prochaine réduction ne doit donc **pas** être un retrait direct.

## Prochain micro-lot recommandé

**Phase 5 / contrat public de retour écran module — pré-audit / contrat pur.**

But :
définir, sans raccord runtime, le contrat minimal permettant au Shell de demander
au module actif de revenir à son écran principal sans lire son état privé.

Le futur contrat devra respecter :
- Shell décide uniquement du routage global ;
- Capture reste propriétaire de son Hub et de son état privé ;
- Dungeon reste propriétaire de sa map et de son état privé ;
- Survie conserve son comportement historique Shell ;
- aucune règle gameplay ne migre dans le Shell ;
- aucun wrapper global de compatibilité n'est ajouté.

Le lot suivant devra commencer par un contrat/tests purs et conserver les entrées
Phase 3 inertes tant que la stratégie de raccord n'est pas prouvée.

Aucun raccord de `window.goMenu` n'est autorisé par le présent document.

## Sentinelle

`tests/gens_phase5_gomenu_final_boundary_preaudit_v1.test.cjs`.

Elle vérifie :
- l'empreinte exacte du runtime manuellement validé ;
- exactement deux propriétaires `goMenu` ;
- ordre `captureFix139 -> dungeonCore200Rebuild` ;
- domaines Capture/Dungeon ;
- responsabilités réelles des deux interceptions ;
- contrat Shell de transitions globales ;
- absence actuelle de contrat public de retour d'écran Capture/Dungeon ;
- inertie des points d'entrée Phase 3.

## Hors périmètre

- `startConfiguredGame` ;
- `resumeGame` ;
- fiche héros / `openChar` ;
- détection ennemie intermittente ;
- petits défauts de rafraîchissement Stats/UI ;
- embuscade ;
- gameplay Dungeon/Capture/Survie/PvP ;
- Tactical ;
- Builder.

Aucun merge sur `main`.
