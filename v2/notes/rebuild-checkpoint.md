# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Créateur de salle : portes, interactions, jets réutilisables, tentatives persistantes et obstacles/couverture configurables sans saisie d’ID technique.
- Combat tactique : mouvement, portée, LOS, murs/portes, équipement, couverture directionnelle et portée d’entraide.
- Statuts persistants : recomposition ordonnée par source pour `add`, `subtract`, `multiply`, `percent` et `set`, avec conservation des changements externes de la statistique pendant la durée des statuts et compatibilité des sauvegardes V2 antérieures.
- Donjon multi-héros : `heroLocations`, focus individuel, transitions séparées, retour arrière et réutilisation de l’instance de salle sans respawn.
- World Builder : passages authored jouables depuis la vue Donjon, avec objets requis et conditions.
- Quêtes/événements/PNJ/alliés/loot : raccordés au vrai `roomRuntime`, sans second runtime parallèle.
- Combat Donjon réel : ennemis actifs de la salle + héros réellement présents/proches, vrai `combatState`, fin de combat réconciliée automatiquement vers salle/héros/loot/boss-key.
- Actions héros : compétences réelles du runtime héros (base + équipement + sets + formes), coûts/cooldowns/jets/effets du moteur existant.
- Tours ennemis : automatiques sur la même timeline sauf en `MJ contrôle total`.
- Présentation combat : timeline, KO, PV/ressources, journal moteur, ciblage vivant, consommables et fuite dans la vraie vue Donjon.
- Contrôle du combat : `interaction.directCombat` et `interaction.gmFullControl` sont appliqués dans la vraie vue Donjon. Direct OFF masque les actions héros automatiques/consommables ; MJ total bloque aussi les tours ennemis automatiques.
- Contrôles MJ manuels : runtime et panneau réel dans la vue Donjon, sur le même `combatState`, pour modifier les ressources/PV, KO/réactiver, effectuer un jet manuel et passer le tour.
- Sécurité d’interface MJ : le panneau MJ exige `gmFullControl=true` et un appareil explicitement désigné MJ.
- Rôle appareil MJ persistant localement : le téléphone mémorise `gm` ou `player` dans son propre `localStorage`. La règle de partie et le rôle du téléphone restent séparés ; un autre téléphone ne récupère pas ce rôle automatiquement.
- Lancement RPG : avant d’ouvrir l’espace RPG, l’appareil affiche maintenant un choix explicite `Ce téléphone est MJ` / `Ce téléphone est Joueur`. Le rôle mémorisé est indiqué et le choix sélectionné est sauvegardé localement avant le montage de la page RPG.
- Ergonomie mobile combat : feuille de style dédiée au bloc de combat Donjon réel, sans changement moteur. Timeline horizontale tactile avec snap, cartes/action zones mieux séparées, cible tactile minimale 46–48 px, consommables/fuite et panneau MJ adaptés aux petits écrans, et boutons MJ réorganisés en 2 colonnes puis 1 colonne sous 390 px.
- Audio RPG : lifecycle de salle, sortie navigateur, session audio unique et cleanup.
- Stockage cloud réel différé ; import/export manuel reste le filet de sécurité.
- Audit Monster Capture engagé : architecture autonome confirmée, bootstrap legacy global interdit en V2 et table de canonicalisation des créatures validées créée avant reconstruction du runtime.

## Jalons CI récents validés

- actions/compétences réelles héros : `34653973093` success
- tours ennemis automatiques : `34655064237` success
- renderer intégré dans vraie vue Donjon : `34656592813` success
- contrats de cible `enemy/ally/self/any` : `34656913323` success
- consommables combat Donjon : `34658191700` success
- fuite combat Donjon : `34658702948` success
- configuration combat direct / MJ : `34658933290` success
- application combat direct / MJ dans vraie vue Donjon : `34659348809` success
- runtime contrôles manuels MJ : `34672484172` success
- panneau MJ manuel dans vraie vue Donjon : `34673068558` success
- restriction panneau MJ au seul appareil MJ : `34673262305` success
- persistance locale du rôle appareil MJ : `34673462295` success
- choix du rôle téléphone au lancement RPG : `34673652441` success
- ergonomie mobile du bloc combat réel : `34677838395` success
- statuts persistants non additifs + dérive externe : `34678647180` success
- audit/document architecture Capture : `34679003790` success
- canonicalisation/déduplication créatures Capture : `34679224508` success

## Dernière étape terminée

Audit et verrouillage initial de la bibliothèque de créatures Monster Capture :
- `v2/docs/CAPTURE_LEGACY_AUDIT.md` documente les contraintes de séparation du mode Capture et les contaminations legacy à ne pas recopier ;
- le bloc legacy `MC162_ENTITIES` contient plusieurs définitions en double de créatures déjà validées ;
- les doublons confirmés incluent notamment Braiseau, Ailevent, Lumino/Lumilo, Nocteceoc/Noctecroc, Rocorne, Luciéclaire/Luciéclair, Mirachat et Descendre/Dracendre ;
- `v2/docs/capture-creature-canonicalization.json` définit un `canonicalId` unique, les alias legacy et les migrations nécessaires pour les espèces déjà validées ;
- les anciennes sauvegardes pourront migrer leurs IDs vers un ID canonique sans dupliquer automatiquement le nombre de créatures possédées ;
- les deux évolutions actuellement retenues dans ce noyau sont Aquafin -> Maraileron et Voltige -> Fulguros ;
- les lignées supplémentaires générées automatiquement par l’ancien système (ex. Braiseau -> Pyrolynx, Ailevent -> Rafalcor, Dracendre -> Volcadrake) restent explicitement hors canon tant qu’elles ne sont pas validées ;
- les nombreuses familles générées en masse dans le legacy restent en `audit_required_before_import` : elles ne sont ni supprimées ni intégrées aveuglément ;
- nouvelle régression `capture-creature-canonicalization.test.mjs` : IDs canoniques uniques, noms canoniques uniques, alias legacy non ambigus, cibles d’évolution existantes et arêtes legacy générées bloquées.

Commits de l’étape :
- audit Capture initial : `eb3eee43503628903d294120ce2964a80649a55f`
- doublons confirmés documentés : `e900a8e043bde54176b188a63cf21ca58739ef78`
- table de canonicalisation : `9848f2d65496239617f6cceeeeb29d0c2c27be48`
- régression de canonicalisation : `961648adf7a5512788f5e6976705d1fdd95c9900`

CI de validation fonctionnelle de l’étape : `34679224508` success.

## Priorités ouvertes

1. poursuivre l’audit legacy Capture sur les familles générées en masse, les clés de stockage/sauvegardes et les règles de combat/capture avant de créer `v2/src/modes/capture/` ;
2. poursuivre ensuite l’audit legacy systématique hors Capture : gros index restant, assets, audio, PWA/cache, sauvegardes/migrations, tests et UI cachées ;
3. continuer les améliorations visuelles mobile seulement après vérification sur vrai téléphone, sans déplacer l’autorité moteur dans l’interface.
