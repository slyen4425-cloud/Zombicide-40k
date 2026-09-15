# GenSrpG — Structure cible des assets

Les assets doivent être compartimentés selon les mêmes frontières que le code afin d’empêcher les mélanges entre modules.

## Arborescence cible

```text
assets/
  common/
    ui/
    icons/
    effects/
    items/

  survival/
    heroes/
    enemies/
    items/
    tiles/
    ui/

  dungeon/
    heroes/
    enemies/
    bosses/
    items/
    tiles/
    walls/
    doors/
    traps/
    chests/
    ui/

  capture/
    creatures/
    evolutions/
    icons/
    balls/
    biomes/
    ui/

  pvp/
    heroes/
    arenas/
    ui/
```

## Règles

- Aucun fallback automatique d’un module vers un autre.
- Un asset spécifique reste dans le dossier de son module.
- `common/` ne contient que ce qui est réellement partagé.
- Les chemins doivent passer par le resolver central dès que possible.
- Les noms doivent être uniques ou préfixés pour éviter les collisions.
- Toute migration utilise une table `ancien chemin -> nouveau chemin`.
- Les anciens chemins ne sont retirés qu’après validation du resolver, des tests et du runtime réel.

## Ordre de migration

1. Inventorier tous les assets réellement référencés.
2. Classer chaque asset : common / survival / dungeon / capture / pvp.
3. Détecter les collisions de noms et les fallbacks actuels.
4. Adapter le resolver pour accepter explicitement `module`, `type` et `id`.
5. Ajouter les tests de résolution par module.
6. Déplacer les assets par petits lots.
7. Mettre à jour les références indirectes.
8. Retirer les fallbacks inter-module.
9. Valider PWA/cache et test mobile.
