# GenS RPG — premier combat jouable depuis Monster Capture (27-10-2026)

Statut : **non raccordé / non jouable**. Travail isolé sur la branche du pont Capture. Aucun changement de `main`.

## Audit réel du fournisseur Combat
- Le dépôt Combat `main` contient `releases/combat-main-pilot-2026-10-27-rc1.json`.
- Son statut est `blocked-ci-not-published`, sa CI `RED` (13 échecs déclarés sur 2319 tests), `consumer.autoSync=false`.
- Le manifeste référence le code `gh-pages@e97a259ff080a5a9ff40d0f4e0892f45d71f081d` et les médias `global-assets@b3d46ce6f2639ebb59a2984aeff17f97cbcd7377`. Ce sont des repères, **pas une livraison stable de `main`**.
- `gh-pages/index.html` redirige vers `examples/dom-demo/capture-editor-v2.html`, interface de laboratoire, **pas un point d'entrée moteur consommable**.
- Aucune preuve d'un export fournisseur compatible avec `GensCaptureLabOwnershipPortV1` (`createBattle/startBattle/stopBattle/disposeBattle/openCreatureEditor/closeCreatureEditor`) à ce stade.

## Critères vérifiables de la première version d'essai
1. Le fournisseur Combat publie sur `main` un manifeste GREEN, avec SHA de code, SHA du catalogue médias et API d'intégration versionnée.
2. Adapter les exports réels du fournisseur au port Capture existant, sans copier son moteur ni créer un second propriétaire.
3. Depuis une rencontre Monster Capture, construire le DTO d'entrée, lancer un combat et afficher le résultat.
4. Retour de résultat appliqué une seule fois par Capture ; arrêt/nettoyage complets ; sauvegardes inchangées en cas d'échec.
5. Test d'intégration du chemin entrée → combat → résultat → retour, y compris interruption et smartphone paysage.
6. CI GREEN du lot, puis URL de preview sur branche de travail, sans fusion implicite dans `main`.

## Règles
Aucune URL de l'éditeur démo ne doit être présentée comme un raccordement jouable. Pas de changement silencieux de fournisseur, pas de dérive des SHA, pas de suppression ou masquage des tests en échec. La synchronisation automatique est secondaire au premier combat jouable.
