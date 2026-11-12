# Capture V2 — drop Krakenor (12 novembre 2026)

START 2d492526a8587e043a7f44606cac24aba8104605 · branche checkpoint dédiée · lot isolé de catalogue et test.

Le Labo Combat `main` certifié publie l'espèce `crea_mer_3` sous le nom **Krakenor**, avec le visuel `pack:capture:creature-pieuvre-opponent-01`. Cette identité vérifiée permet de rattacher le fichier auteur déjà importé `drop_pieuvre_perle_encre.png` à l'objet vendable **Perle d’encre de Krakenor**, sans fabriquer de nouvelle espèce. L'import reste opt-in/idempotent, l'objet a 20 % de chance et une unité comme les autres modèles, indépendamment du taux vitrine 30 % de fragments de l'espèce.

Trois visuels (Hériplante, Liane venimeuse, Peste noire) restent disponibles dans la galerie sans drop automatique tant que leur espèce exacte n'est pas prouvée. Ne pas réutiliser un identifiant d'une autre créature ni écraser les mondes sauvegardés.

Propriétaire unique : `AdventureRulesV1.loot` de Capture ; source créature Combat `main` sans duplication d'assets. Aucun changement au runtime Exploration, inventaire Core, logique Combat, PWA ou aux anciennes sauvegardes. Validation : tests de catalogue, idempotence, valeur de vente, provenance PNG, CI Capture et publication uniquement après la chaîne parente et ses propres gates.
