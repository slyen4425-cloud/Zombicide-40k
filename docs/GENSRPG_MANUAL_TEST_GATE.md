# GenSrpG — Jalon de test manuel de la restructuration

Date : 2026-09-16
Base : restructuration issue de V16.78.114.11

## Pourquoi tester maintenant

La restructuration a déjà consolidé plusieurs frontières sensibles sans réécrire le moteur :

- RuntimeBootstrap séparé du module performance ;
- aucun MutationObserver global actif dans la chaîne Tactical ;
- V113 reste l'autorité de détection/scope ;
- Tactical UI est l'unique autorité du rendu des murs ;
- Bridge possède un contrat unique `requestCombat()` ;
- `requestCombat()` applique désormais directement le scope et la visibilité V113 avant d'ouvrir Tactical.

Avant de réduire fortement les appels historiques du monolithe `index.html`, un test manuel sur téléphone doit confirmer que l'expérience V114.11 utile reste intacte.

## Scénario utilisateur prioritaire

1. Démarrage à froid de l'application.
2. Accueil -> Aventure/RPG -> Dungeon.
3. Démarrer/reprendre une partie.
4. Vérifier les points de mouvement et un déplacement normal.
5. Ouvrir puis fermer la fiche d'un héros.
6. Vérifier `Sauvegarder & quitter`, puis reprendre la partie.
7. Entrer avec Aldren seulement et vérifier qu'un héros non encore entré n'est pas ajouté au combat.
8. Vérifier un combat avec un héros proche dans la même salle puis un héros dans une autre salle.
9. Vérifier un déclenchement par détection/embuscade.
10. Vérifier murs/portes pendant zoom et combat Tactical.
11. Vérifier D100, attaques, multi-dés et retour exploration après victoire.

## Critère de passage

Le chantier de migration du monolithe peut continuer si aucun des invariants suivants ne régresse :

- fiche héros accessible ;
- mouvement visible et fonctionnel ;
- Save & Quit + reprise fonctionnels ;
- aucun héros hors donjon / autre salle aspiré en combat ;
- murs rendus une seule fois avec le bon asset ;
- retour exploration propre après combat.

## Publication

`main` doit rester sur la V16.78.114.11 sûre pendant ce jalon. Le candidat de test doit être exposé séparément ou par un mécanisme de preview qui ne remplace pas la production stable.
