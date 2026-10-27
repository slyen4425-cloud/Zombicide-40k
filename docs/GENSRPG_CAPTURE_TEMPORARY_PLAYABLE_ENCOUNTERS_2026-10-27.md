# Monster Capture — parcours provisoire jouable sans Labo Exploration

## Besoin corrigé
Le combat-test existe déjà dans l'éditeur Labo Combat. **Ne pas dupliquer cet éditeur ni son bouton de test.**
Le besoin est une **vraie partie Monster Capture** dans GenS RPG, avec une exploration provisoire légère et des rencontres qui démarrent le moteur officiel du Labo Combat.

## Parcours utilisateur attendu
1. Démarrer/reprendre un profil Monster Capture dans GenS RPG.
2. Entrer dans une zone provisoire jouable, adaptée au smartphone paysage.
3. Se déplacer et déclencher une rencontre sauvage via le système de rencontres appartenant à Monster Capture.
4. Geler la zone, fournir au seul moteur Combat les données d'équipe/adversaire et démarrer le combat.
5. À la fin du combat, valider et appliquer une fois le résultat selon les règles Monster Capture, revenir à la zone et reprendre les déplacements.
6. En cas de fuite/interruption/erreur, rendre le contrôle au joueur sans corruption de profil.

## Architecture / remplacement futur
- La zone provisoire **ne possède pas** les règles de combat, le catalogue de créatures ni les sauvegardes.
- Elle ne fait qu'émettre un événement de rencontre vers le même point d'entrée que le futur Labo Exploration.
- Le Labo Combat reste l'unique propriétaire du moteur. Aucun faux combat ni copie du moteur.
- Labo Exploration remplacera la zone provisoire sans changer le port de combat.
- Le module `manual-battle-trigger-v1.js` est une **brique de déclenchement isolée** déjà créée, non un nouvel écran de combat-test, non raccordée à la partie et non jouable à ce stade.

## Critères d'acceptation
Parcours de partie réellement navigable, rencontre déclenchée depuis la zone, vrai moteur Combat, victoire/défaite/fuite, retour à la zone, tests de reprise et non-régression, CI GREEN, URL de preview. Pas de fusion à `main` avant validation.
