# GenSrpG V2 — Plan de reprise complet — 2026-09-11

Ce document est le point de reprise prioritaire si le fil ChatGPT est saturé ou perdu.

## Branche et règle de sécurité

- Dépôt : `slyen4425-cloud/Zombicide-40k`
- Branche de reconstruction : `rebuild/v2`
- `main` reste la version stable et ne doit pas être remplacée tant que la V2 n'a pas atteint une parité suffisante et validée.
- Toute nouvelle étape V2 doit être implémentée sur `rebuild/v2`, testée par `.github/workflows/test-v2-rebuild.yml`, puis seulement considérée comme validée lorsque `Run V2 unit tests` passe en success.

## Architecture cible

```text
GenSrpG V2
├── Core
│   ├── sauvegarde
│   ├── profils
│   ├── assets
│   ├── audio
│   ├── paramètres
│   └── import-export
├── Survie
├── RPG
├── Capture
└── PVP
```

Le Core ne contient que des services techniques neutres. Aucun état gameplay mutable n'est partagé entre les modes.

## Principes non négociables

1. Mobile-first, interface claire, hiérarchie simple.
2. Aucune saisie d'ID technique par l'utilisateur : toutes les liaisons passent par sélecteur, liste ou recherche.
3. Chaque section importante possède une aide contextuelle `?` avec but, impact, exemple et dépendances.
4. Le RPG est piloté par les données : aucune statistique, ressource, élément ou règle n'est privilégiée par son nom.
5. Le combat RPG reste un combat JDR aux dés / D100, jamais un combat action dynamique.
6. Une action de combat possède un ID unique et ne peut être résolue qu'une seule fois.
7. Les animations et popups ne pilotent jamais l'état moteur.
8. Un combattant KO ne doit jamais redevenir l'acteur courant de la timeline.
9. Les déplacements sont individuels ; aucun passage de porte ne téléporte le groupe.
10. Les distances suivent un chemin praticable et ne traversent pas les murs.
11. Toute fonction historique importante doit être inventoriée avant d'être déclarée supprimée.
12. La V2 ne remplace `main` qu'après parité suffisante + validation explicite.

## Ce qui est déjà construit

### Core / RPG générique

- stockage V2 isolé ;
- contrats statistiques / ressources ;
- formules de ressources ;
- conditions génériques ;
- effets génériques ;
- statuts temporaires ;
- compétences : coût, charges, cooldown, récupération, conditions, effets ;
- formes / transformations temporaires et permanentes ;
- éditeur RPG avec liens par sélecteurs.

### Combat RPG

- state machine déterministe ;
- initiative configurable ;
- règle de KO configurable sur statistique ou ressource ;
- file d'action et résolution unique ;
- session de combat avec timeline sécurisée ;
- acteurs KO sautés automatiquement ;
- journal moteur numéroté ;
- couche de présentation séparée ;
- laboratoire de combat ;
- règles de dés configurables.

Régressions historiques déjà prises comme référence : tour infini de Lyra, héros KO qui revient dans la timeline, double résolution, blocage d'animation, verrouillage par état UI obsolète.

### Spatial / perception

- positions individuelles ;
- unités cases / cm / pouces / désactivé ;
- mouvement fixe ou lié à une statistique ;
- obstacles / murs via cases bloquées ;
- distance par chemin praticable ;
- portée d'entraide configurable ;
- participation combat selon proximité et zone ;
- vision et furtivité génériques basées sur des statistiques sélectionnées ;
- réglages spatiaux visibles dans l'éditeur RPG.

### World Builder

- moteur monde → zones → salles ;
- salle de départ ;
- liaisons ;
- branches ;
- sens unique ;
- conditions de passage ;
- historique de navigation ;
- retour vers salle précédente ;
- validation des liens cassés ;
- éditeur World Builder visible ;
- créations/suppressions zones, salles et liaisons ;
- choix par menus, pas par IDs.

Dernier point de reprise avant ce document : World Builder visible et testé.

## Ordre de construction à poursuivre

### Phase A — Base Dungeon / auteur

1. **Créateur de salle** — étape suivante immédiate
   - dimensions largeur/hauteur ;
   - grille ;
   - cases de sol ;
   - murs ;
   - portes ;
   - entrée / sortie ;
   - obstacles ;
   - eau / lave / rochers ;
   - décor ;
   - cases spéciales ;
   - validation des coordonnées ;
   - modèle séparé du World Builder mais rattachable à une salle.

2. **Interactions de salle**
   - coffre ;
   - piège ;
   - énigme ;
   - événement ;
   - interrupteur ;
   - portail ;
   - objet interactif ;
   - rattachement à case / porte / coffre par sélecteur.

3. **Runtime de salle**
   - instanciation unique par salle ;
   - persistance des ennemis/interactions ;
   - retour arrière = rechargement de l'état existant, pas recréation ;
   - aucune duplication de pion ;
   - transitions World Builder ↔ salle ↔ sous-salle.

### Phase B — Contenu Dungeon

4. Événements composables : texte, son, effet, spawn, porte, récompense, transition, choix.
5. Coffres : rareté, loot, piège, énigme, événement, audio.
6. Pièges : détection, désamorçage, jet configurable, effet, état.
7. Énigmes : bibliothèque, aides progressives, pénalités, liaison case/porte/coffre.
8. Bestiaire : stats, ressources, compétences, IA, loot, audio, boss.
9. Spawn : événement, embuscade, renfort, boss, clé, condition, salle précise ; aucune apparition dans la mauvaise salle.

### Phase C — Héros, objets et progression

10. Inventaire et équipement génériques.
11. Armes, armures, consommables, parchemins, munitions/carquois, objets de quête, matériaux, reliques.
12. Sets génériques : `setId`, pièces, paliers, affichage porté/total.
13. Marchands : stock limité, rupture, persistance, revente remet en stock.
14. Progression : XP, niveaux, points compétence, points caractéristiques, courbe configurable, popup, soin optionnel.
15. Formes avancées : coût continu, conditions de retour, chaîne/branche, art/nom, restrictions d'équipement.

### Phase D — Quêtes / PNJ / MJ

16. Quêtes et objectifs.
17. PNJ / compagnons : position, déplacement, proximité, combat, escorte/sauvetage/temporaire.
18. Mode MJ / IA / mixte : contrôles propres, outils MJ invisibles au joueur.

### Phase E — Audio / assets / sauvegarde

19. Bibliothèque audio centrale par ID ; one-shot, boucle, volume, délai, probabilité, canal, test.
20. Rattachement audio à armes, compétences, portes, coffres, événements, boss, blessures, mort, level-up, zones, transformations.
21. Audit et reprise assets graphiques Dungeon.
22. Sauvegarde complète V2 : autosave, reprise, export/import, migration, rollback.
23. Tests de reprise partie, changement de salle, combat en cours, états temporaires, inventaire et World Builder.

### Phase F — Modes restants

24. Migration fidèle du mode Survie, sans réinventer ses règles.
25. Audit historique complet de Capture avant toute réécriture.
26. Reconstruction Capture isolée ensuite.
27. PVP séparé en dernier.

## Tests de non-régression obligatoires à conserver / ajouter

- une action ne résout jamais deux fois ses dégâts ;
- une animation de dé en retard ne bloque pas le moteur ;
- un acteur KO est toujours ignoré ;
- un héros vivant ailleurs empêche un faux Game Over global ;
- une salle déjà visitée ne respawn pas son contenu ;
- un boss apparaît uniquement dans la salle prévue ;
- une clé de boss reste attachée au bon contenu ;
- une branche/cache n'est jamais traitée comme une salle séquentielle ;
- une porte/coffre/piège/énigme reste liée à son bon support ;
- pas de duplication d'ennemis ou de pions ;
- le mouvement restant n'est pas réinitialisé artificiellement lors d'une transition ;
- sauvegarder/quitter/reprendre restaure l'état exact ;
- aucun ancien fallback ne recrée une stat ou règle désactivée.

## Audit historique encore obligatoire

Ne jamais déclarer l'audit complet tant que ces points ne sont pas vérifiés :

- ancien `index.html` géant au-delà des scans partiels ;
- arbre complet du dépôt et des assets ;
- `assets/gensrpg` ;
- `assets/dungeon` ;
- service worker / PWA / manifest / cache ;
- IndexedDB / localStorage / export / import / migrations ;
- tests historiques ;
- historique Git de systèmes masqués/supprimés, surtout Capture ;
- sons et bindings ;
- images/icônes/fallbacks ;
- helpers inline JS/CSS ;
- parcours UI, popups et contrôles cachés.

## Méthode de travail pour chaque étape

`comportement legacy -> données/assets legacy -> contrat V2 -> implémentation V2 -> test de parité -> amélioration UX`

Quand une étape est terminée :
1. commit sur `rebuild/v2` ;
2. attendre GitHub Actions ;
3. ne dire « validé » que si `Run V2 unit tests` est en success ;
4. mettre à jour la matrice de parité si le statut change ;
5. poursuivre l'étape suivante dans cet ordre.

## Fichiers de référence

- `v2/docs/REBUILD_PLAN.md` : règles de reconstruction.
- `v2/docs/PARITY_MATRIX.md` : état de parité fonctionnelle.
- `v2/docs/CONTINUATION_PLAN_2026-09-11.md` : ce document, plan de reprise opérationnel complet.

Si un nouveau fil doit reprendre le chantier, commencer par lire ces trois fichiers, récupérer la tête de `rebuild/v2`, puis reprendre à la première étape non terminée ci-dessus.