# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, état combat/PV/KO/statuts/capacités/réactions, résumé adverse actif et inspection adverse.
- Le résumé adverse, les cartes Équipe active/Réserve et l’overlay d’inspection des créatures possédées utilisent désormais le registre canonique `capture-creature-assets.json` pour résoudre les IDs/noms canoniques.
- Le registre Capture est chargé de façon lazy en parallèle du module Capture, uniquement à l’ouverture du mode.
- Un art/icône ne peut être rendu que si le registre fournit un `path` autorisé dans `v2/assets/capture/creatures/` et que son statut n’est plus `pending_import`.
- Aucun fallback RPG/Dungeon n’est accepté. Si le registre est absent, invalide ou encore `pending_import`, la vue reste sans image.
- Les 14 visuels canoniques actuels restent tous `pending_import` avec `path:null`; les noms canoniques sont actifs, mais aucune image réelle n’est encore affichée.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- Les inspections et résumés restent strictement consultatifs : aucune attaque, IA, déplacement, dégâts, soin, capture ou progression du temps n’est déclenché depuis ces vues.
- La liste Équipe active expose désormais une première commande gameplay réelle : le switch manuel de créature active pendant un combat, via `switchCaptureBattleCreature()` uniquement.
- Le bouton `Changer` n’apparaît que pour une créature de l’équipe active, vivante, différente de la créature actuellement active et pendant un combat actif ; la réserve n’expose jamais cette commande.
- Le switch réussi resynchronise l’état global autoritaire, puis rerend le roster et le résumé adverse ; aucun switch direct bas niveau n’est utilisé depuis l’UI.
- Les 4 orbes reconnues restent `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; coefficients non inventés.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu’à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu’à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed / temps visuel / visibilité / overlay : success jusqu’à `34687557658`
- inspection métier de créature : `34688278893` success
- listes Équipe active/Réserve inspectables : `34688524627` success
- marquage créature active en combat : `34690135197` success
- affichage PV / KO du roster : `34690466513` success
- affichage statuts actifs du roster : `34690816101` success
- affichage charges / cooldowns capacités : `34691249135` success
- affichage état réactions / esquive : `34692442765` success
- inspection détaillée PV/KO/statuts/capacités/réactions : `34692774662` success
- résumé visuel adversaire actif : `34693245713` success
- inspection adverse depuis le résumé : `34693630321` success
- nom canonique + gating assets adversaire : `34693958720` success
- nom canonique + gating assets roster : `34694300782` success
- nom canonique dans inspection créature possédée : `34694675567` success
- première commande gameplay UI — switch manuel de créature active : `34695849063` success

## Dernière étape terminée

Switch manuel de créature active depuis la page Capture :
- `capture-page.js` importe et utilise l’API autoritaire publique `switchCaptureBattleCreature()` ;
- pendant un combat actif, une créature vivante de l’équipe active qui n’est pas déjà engagée reçoit un bouton `Changer` ;
- la créature KO n’expose pas le bouton ;
- la créature déjà active n’expose pas le bouton ;
- la réserve n’expose jamais le bouton et ne reçoit aucun listener de switch ;
- après un switch réussi, la session est remplacée avec le nouvel état autoritaire puis le roster et le résumé adverse sont rerendus ;
- aucun `moveCaptureRosterCreature()`, `setCaptureTeam()`, capacité, capture ou autre action de combat n’a été ajouté à cette étape ;
- le moteur conserve ses raisons publiques réelles : `capture-creature-ko` pour une cible KO et `capture-active-creature-not-in-team` pour une cible absente de l’équipe.

Régression :
- `v2/tests/capture-ui-switch-active.test.mjs` couvre le switch p1→p2, la conservation des PV dans `activeTeam` et `roster`, le refus du KO, le refus d’une cible absente, les garde-fous UI et l’absence de switch depuis la réserve ;
- les anciens gardes statiques qui interdisaient globalement tout switch depuis `capture-page.js` ont été restreints à leurs surfaces réellement passives ;
- batterie complète finale : `34695849063` success.

Commits de l’étape :
- UI switch autoritaire : `3865e52b1f41cd329d46aa8dbddfb2389f0c0566`
- régression dédiée : `b508851505386374938a191852c53bab2edede04`
- garde roster adapté : `0fabeb76453cb263cdbd790ab5c2ee0d7b83062b`
- garde résumé adverse adapté : `fba74ae8d9a0bc120e36f2a45219d950d81dad96`
- raison KO autoritaire : `294df48b25f27b22c09b306796a88a81e76f8110`
- raison cible absente autoritaire : `b278e471a798f12865bd6cdf51af1ad027f6e88f`

## Priorités ouvertes

1. prochaine étape Capture : poursuivre la transformation de la page Capture en interface réellement jouable, en exposant progressivement les autres commandes autoritaires existantes sans réécrire le moteur ;
2. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. enrichir les autres réactions/effets tactiques uniquement si leurs contrats sont validés ;
5. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
