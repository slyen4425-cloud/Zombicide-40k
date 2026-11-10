# Monster Capture V2 — contrat monnaie, ressources et marchands (lot C2, candidat)

## Frontières et autorité
- Propriétaire unique : `AdventureRulesV1` pour le catalogue et la politique économique, `AdventureSession` et le stockage Core pour les quantités effectives. Aucun nouveau système d'inventaire ni d'enregistrement.
- `rules.loot.currencyPerVictory` conserve le montant gagné à chaque victoire ; `inventory.currency` conserve le seul solde de monnaie principale.
- Option additive `rules.economy.currency={singular,plural}` pour modifier le **nom affiché** de la monnaie du monde sans convertir les nombres des anciennes parties.
- Les ressources secondaires (bois, minerai, fragments, gemmes, etc.) sont des objets existants du catalogue `loot.items`, stockés sous les mêmes IDs `inventory.items`. L'éditeur d'objets reste l'unique propriétaire des définitions visuelles et valeurs de revente.
- `rules.economy.merchants` décrit des marchands, avec ID stable, nom, possibilité de rachat et offres par itemId. Chaque offre possède un prix en monnaie principale, zéro ou plusieurs ressources à fournir, et un stock initial entier ou `null` pour illimité.
- `session.merchantStocks` (optionnel) enregistre **seulement** les stocks restants qui ont effectivement changé dans une partie ; `processedMerchantActions` (optionnel) protège les transactions rejouées. Les anciennes sauvegardes sans ces champs restent intactes.
- Les modifications auteur d'un marchand ou d'une offre ne détruisent pas les stocks historiques : les lignes inactives restent inertes. Le catalogue actuel contrôle l'accès aux achats.
- Pour vendre un objet, le marchand doit avoir `buysItems=true` ; la valeur provient de `rules.loot.items[].saleValue`, pas d'une seconde grille de prix.
- Une transaction est une opération pure `tradeAdventureMerchantV1({session,merchantId,itemId,kind,quantity,actionId,now})`. Le runtime qui l'appellera devra valider l'interaction et sauvegarder le résultat via **le Core existant**, sous le verrou de la partie, jamais en écrivant directement dans `localStorage`.

## Éditeur et utilisation
- L'éditeur `Monster Capture → Éditeurs → Objets et drops` inclut une section « Monnaie, ressources et marchands ».
- Modifier le singulier/pluriel ; ajouter/modifier/supprimer des marchands ; ajouter/modifier/retirer leurs offres ; choisir plusieurs ressources facultatives, le prix et le stock.
- Utiliser « Enregistrer les paramètres » pour sauver les règles dans le brouillon ou la partie active ; ne jamais ajouter de marchand automatiquement aux parties historiques.
- Supprimer un objet encore utilisé comme offre/ressource par un marchand est refusé tant que la liaison n'a pas été retirée.
- L'éditeur ne vend ni n'achète à la place du joueur. Les outils de création n'exécutent pas directement le runtime.

## Raccord futur à Exploration (chantier PNJ distinct)
- Le Labo Exploration reste propriétaire du placement, des déplacements, du visuel, des interactions et des dialogues de PNJ. Il **ne copie pas** les inventaires ou les marchands Capture.
- Un événement d'interaction PNJ pourra référencer l'ID stable `merchantId` configuré dans Capture, exactement comme un lien de données.
- La transaction effective nécessite un point de déclenchement identifié, autorisation/session active, verrou Core, reprise/retour en jeu et tests sur téléphone paysage. **Aucun raccord, PNJ, boutique en jeu ni nouveau moteur de dialogue n'est prétendu opérationnel à ce stade.**

## Validation et livraison
- Source de départ **WIP dépendante** de l'éditeur d'objets PR #379 : `8f30c2499210acdffab3b11b5da74da6fcbbf884`. Le dernier socle immuable certifié en amont est `17c8b04418ceea9993dc7257b862d8016dba8009`. Ne pas étiqueter la branche économique GREEN tant que l'éditeur parent n'a pas ses CI.
- Lot séparé : `work/gensrpg-capture-economy-merchants-2026-11-10` ; checkpoint START `checkpoint/gensrpg-start-capture-economy-merchants-2026-11-10`.
- Tests Node : `node --test tests/gens_capture_v2_adventure_contract_v1.test.mjs` inclut `gens_capture_v2_economy_merchants_20261110.test.mjs` ; couvre règles historiques, ressources multiples, achats/ventes, stock, idempotence, erreurs et retrait d'une offre.
- Test réel Chromium CI : `tests/gens_capture_v2_item_editor_browser_20261110.test.cjs` étendu pour la monnaie, les offres, le stock et la persistance, après les tests d'objets/drops.
- Interdiction de publier/merge/repin le publisher `main` ou les deux labos avant les gates du SHA exact ; demande utilisateur : attendre concernant la publication du chantier éditeur d'objets.
