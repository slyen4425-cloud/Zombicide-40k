# Monster Capture — Idées d'assets d'exploration 2,5D et d'arènes
> **Idées documentées le 3 novembre ; état corrigé par le créateur le 6 novembre 2026.** Les visuels neige et arènes sont livrés ; les mécaniques d'arène et l'ensemble port/navigation ne sont pas développés. Propriétaire décor/map : **Labo Exploration** ; identité, progression et état de champion : **Monster Capture / GenSrpg** ; IA et résolution des combats : **Labo Combat** ; duel de joueurs en direct : futur contrat PvP. Respecter la [charte](GENSRPG_CHARTE.md) et éviter toute seconde autorité.


## État officiel déclaré par le créateur — 6 novembre 2026
| Chantier | Visuels | Système / gameplay | Suite |
|---|---|---|---|
| Maisons enneigées | **FAITS ET LIVRÉS** | Aucun travail supplémentaire demandé | **CLOS**, ne pas recréer |
| Arbres enneigés | **FAITS ET LIVRÉS** | Aucun travail supplémentaire demandé | **CLOS**, ne pas recréer |
| Arènes élémentaires | **VISUELS FAITS** | **NON FAIT** : champion PNJ initial, conquête, titre persistant, invitation PvP, IA défensive et équipe enregistrée | Concevoir et développer les mécaniques plus tard |
| Ports et bâtiments portuaires | **RIEN DE FAIT** | **RIEN DE FAIT** | Créer assets, interactions et ports |
| Navigation / bateaux | **RIEN DE FAIT** | **RIEN DE FAIT** | Étudier et développer système de navigation en lien avec ports (bateaux, embarquement, déplacement, débarquement, transitions) |

Ce statut provient de la confirmation explicite du créateur, sans nouvel audit technique des fichiers. Ne pas confondre « visuels d'arènes réalisés » et « gameplay d'arène implémenté ». Pour les ports, le chantier visuel et la navigation constituent un **même futur axe**, à cadrer ensemble. Aucun développement lancé par cette mise à jour documentaire.

## Intention
Les cartes possèdent déjà notamment des maisons, ponts, arbres, cascades et décors. L'objectif n'est pas d'empiler des objets : chaque nouvel asset doit créer un lieu **reconnaissable, visitable et potentiellement interactif**, utilisable dans le World Builder. Exemples inspirants : **Pokémon GO** (défense d'arènes), **Temtem** (dojos à conquérir et défense par équipe enregistrée), villages et points d'intérêt de RPG d'exploration. Ne copier aucun visuel ou univers propriétaire.

## A. Priorité : variantes enneigées pour cartes neige
- **Maisons :** variantes couvertures neige cohérentes des modèles existants (toitures, corniches, perrons, rebords de fenêtres, escaliers, porches et cheminées), avec portes fonctionnelles, collisions et échelles préservées.
- **Arbres :** conifères sous neige, arbres à branches dénudées enneigées, arbustes/buissons givrées, troncs et souches ; silhouettes distinctes pour lecture à l'écran.
- **Décors assortis :** murets, barrières, ponts, bancs, rochers, panneaux indicateurs, lampadaires, puits et chemins enneigés ; quelques stalactites/glaçons.
- **Visuels facultatifs :** fumée de cheminée, lumière chaude aux fenêtres, neige soufflée légère, sans pénaliser le Pixel paysage.
- Assurer un assortiment d'assets **non enneigés / enneigés** cohérent sans remplacer les maisons existantes ; sélectionner par biome ou manuellement.

## B. Côte, fleuve, lac : un vrai port à visiter
- **Quais et jetées modulaires** (bois, pierre), escaliers et raccords à l'eau pour gérer différents niveaux et perspectives.
- **Bâtiments :** capitainerie, entrepôt de marchandises, chantier naval, cabane de pêcheur, marché aux poissons, phare, auberge du port.
- **Petits décors :** barques, embarcadères, cordages, caisses, tonneaux, filets, bouées, grues, panneaux.
- **Usage possible, non décidé :** PNJ batelier / traversée entre régions, quête de cargaison, marchand spécialisé, créatures aquatiques, découverte de nouvelles zones. Les systèmes de trajet/quête doivent réutiliser les événements et transitions d'Exploration.

## C. Bâtiments mémorables avec une raison d'y entrer
- **Centre de soins / refuge des créatures** : halte sur la route, interaction et PNJ.
- **Boutique / marché / forge** : objets et ressources (seulement si l'économie V2 est décidée dans #230).
- **Laboratoire / observatoire** : recherche sur créatures, indices, découverte.
- **Serre botanique / pépinière** : biome plantes, rencontres, récoltes.
- **Bibliothèque / école / musée** : histoire du monde, quêtes et collection.
- **Tour de guet / phare / moulin** : repère visible de loin ; pour un moulin, réutiliser la famille d'animations visuelles en préparation après validation/placement.
- **Ruines, sanctuaire, temple, mine abandonnée, grotte, fort** : lieu d'exploration et éventuel événement rare.
- **Relais / auberge / gare / téléporteur narratif** : étapes et éventuels voyages ; les mécaniques ne sont pas présumées existantes.
- Décliner l'architecture par **biome** (neige, forêt, littoral, volcanique, désert, marais) avec peu de variantes solides plutôt qu'une grande quantité de doublons.

## D. Nouvelle idée de gameplay : arènes à champion persistant

### Concept confirmé par l'auteur — à noter, pas à développer
1. Créer dans des villes ou zones choisies des **arènes visibles sur la carte**, à thème libre : **feu, eau, électricité, glace**, puis nature, terre, ombre, etc.
2. Chaque arène démarre avec un **champion PNJ contrôlé par l'IA**, doté de son équipe de créatures.
3. Un joueur qui bat ce champion **devient le champion actuel de l'arène** ; cette propriété est **enregistrée dans la partie / le monde partagé**, pas seulement affichée pendant le combat.
4. Un nouveau challenger qui visite l'arène rencontre ce champion :
   - **si le champion joueur est connecté et disponible dans la partie :** lui envoyer une **invitation à combattre en direct** ;
   - **s'il est absent :** le challenger combat une **défense gérée par l'IA**, jouant **l'équipe explicitement choisie par le champion humain**.
5. En cas de victoire du challenger, le **titre change de propriétaire** et est sauvegardé ; l'ancien champion perd le titre. Ainsi la prise de contrôle de l'arène crée une compétition durable entre joueurs (y compris parties familiales).

### Déclinaisons d'assets pour les arènes
- Bâtiment extérieur distinctif selon l'élément, entrée clairement visible, enseigne/bannière du champion.
- Hall/vestibule, terrain de combat intérieur et décor thématique : volcan et braises (feu) ; bassin/cascades (eau) ; bobines/éclairs stylisés (électrique) ; cristaux/glace (glace).
- Panneau affichant **nom du champion actuel**, ses couleurs et statut de défense ; éventuellement trophée/statue si retenu.
- Les arènes doivent s'insérer dans les cartes existantes sans dupliquer le moteur 2,5D ni le moteur de combat.

### Règles et cas à arbitrer avant développement
- Arènes **par monde, serveur, partie coopérative ou session familiale** ? Identité stable du propriétaire et sauvegarde partagée entre appareils.
- Invitation **acceptée, refusée, sans réponse, joueur occupé, déconnexion en combat** : délai et politique de repli IA à définir (ne pas forcer un duel).
- **Équipe de défense** : sélection et sauvegarde, limitation de niveau, modification possible, ordre/stratégie IA, snapshot au début du défi, validation des créatures.
- **Conditions de victoire**, égalité/abandon, fraîcheur des données, défis simultanés, transfert atomique de possession, anti-abus et reprises après coupure.
- Règles propres à chaque arène, type/élément obligatoire ou simple thème, nombre de challengers et de champions.
- Récompenses, badges, rang, éventuel bonus de champion, durée de possession, rotation ou remise à zéro : **aucune règle figée pour l'instant**.
- **Dépendance bloquante :** le PvP jouable en direct n'est pas développé ; planifier séparément de l'architecture PvP existante. L'IA défensive et les combats doivent réutiliser les propriétaires du Labo Combat, pas un second système.


## E. Idée combat à cadrer — retour forcé d'une créature KO (6 novembre 2026)
**Statut : idée de gameplay confirmée par le créateur, à étudier ; non développée, aucun taux de risque ni règle définitive validés.**

- Permettre au joueur de **forcer le retour au combat d'une créature déjà KO**, en acceptant un **risque de perte définitive de cette créature**.
- Prévoir un avertissement explicite et une confirmation avant le choix irréversible ; ne jamais déclencher automatiquement la perte.
- À décider : conditions d'activation, probabilité du risque, durée et limites du retour, PV/énergie au retour, déclencheur exact de la perte définitive, interaction avec victoire/défaite, protection des créatures spéciales, options MJ et sauvegardes.
- Préserver l'autorité du Labo Combat pour les états et le combat ; GenSrpg / Monster Capture pour l'identité, l'inventaire et la persistance de la créature. Éviter un second moteur.
- **Recherche préalable** : retrouver une éventuelle note historique plus détaillée avant de figer ces paramètres ; la présente note consolide uniquement le principe explicitement rappelé par le créateur.

## Inspiration documentée
- [Pokémon GO — défendre une arène](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/383-earning-the-defender-bonus/?l=en) : défense persistante au-delà de la présence du joueur.
- [Temtem — Dojo Wars](https://temtem.wiki.gg/wiki/Dojo_Wars) : contrôle de dojos par des joueurs et défense organisée.
- [Temtem — Dojo Park](https://temtem.wiki.gg/wiki/Dojo_Park) : adversaires IA reprenant les équipes utilisées par les défenseurs.

## Prochaine étape souhaitable, **non lancée**
Les maisons et arbres enneigés sont livrés et les visuels d'arènes sont réalisés : **ne pas les recréer**. Prochain lot visuel à concevoir : quai, capitainerie, phare, embarcations et accessoires portuaires ; cadrer simultanément la mécanique de navigation/bateaux (embarquement, traversée, débarquement, transitions et sauvegarde). Séparément, concevoir puis développer le gameplay des champions d'arène sans supposer le PvP existant.

Liens associés : [Backlog Monster Capture V2 #230](https://github.com/slyen4425-cloud/Zombicide-40k/issues/230) · [Point d'entrée](GENSRPG_POINT_ENTREE.md).
