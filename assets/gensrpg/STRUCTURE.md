# GenSrpG — Structure cible du runtime

Cette structure est la cible de la réorganisation progressive. Elle ne doit pas être obtenue par un déplacement massif en une seule fois.

## Dossiers cibles

- `core/` : stats, dés, inventaire, équipement, progression, stockage, assets, événements communs.
- `shell/` : navigation globale, état d’application, fiche héros hors combat, orchestration UI.
- `survival/` : logique et UI du mode Survie uniquement.
- `dungeon/` : exploration Dungeon, déplacement, salles, événements, objectifs, interactions.
- `tactical/` : moteur de combat tactique Dungeon, adapter, UI, IA, contrat de retour vers Dungeon.
- `capture/` : Monster Capture uniquement.
- `pvp/` : Duel/Affrontement PvP uniquement.
- `builders/` : World Builder et éditeurs ; ils produisent des données, ils ne possèdent jamais le runtime actif.

## Ordre d’extraction

1. Sentinelles et tests de frontières.
2. Services communs purs : assets, stockage, stats, inventaire/équipement, dés, progression.
3. Shell/navigation/fiche héros.
4. Survie.
5. Dungeon exploration.
6. Tactical.
7. Monster Capture.
8. PvP.
9. Builders.
10. Allègement final de `index.html`.

## Règles de migration

- Un seul propriétaire actif par responsabilité.
- Aucun nouveau wrapper global pour faciliter un déplacement.
- Tout ancien propriétaire doit être retiré du runtime avant de considérer l’extraction terminée.
- Chaque extraction doit conserver le comportement existant.
- Chaque extraction doit avoir un test avant/après.
- Le code historique peut rester dans Git mais ne doit pas rester chargé inutilement en production.

## Contrats cibles

Exemple Dungeon/Tactical :

```text
Dungeon -> startTacticalCombat(snapshot)
Tactical -> CombatResult
Dungeon -> applyCombatResult(result)
```

Exemple Shell/Fiche héros :

```text
Shell -> openHeroSheet(heroId, context)
HeroSheet -> close()
```

Aucun module de gameplay ne doit masquer, réafficher ou détourner les écrans appartenant à un autre module.
