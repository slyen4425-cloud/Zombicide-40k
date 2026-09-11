# GenSrpG V2 — Matrice de parité

Cette matrice sert de garde-fou : aucune fonction historique n'est considérée supprimée simplement parce qu'elle n'a pas encore été migrée.

| Domaine | Référence actuelle | V2 | Statut | Critère de parité |
|---|---|---|---|---|
| Accueil / modes | Survie, RPG, Capture, PVP réservé | Modes isolés | En cours | Navigation propre, aucun état gameplay partagé |
| Aide contextuelle | Partielle / dispersée | Volet `?` uniforme | En cours | Chaque zone importante possède aide + exemple |
| Stats RPG | Plusieurs stats historiques + couches de migration | Statistiques libres par ID | Base active | Création, édition, activation, bornes, progression |
| Ressources RPG | PV/Mana et usages historiques | Ressources libres par ID | Base active | PV, Mana, Ki, Rage, etc. possibles sans code spécial |
| Conditions | Conditions dispersées | Moteur générique | Base active | Stat, ressource, niveau, XP puis quête/item/flag |
| Effets | Buff/debuff/DoT/HoT dispersés | Moteur générique + statuts temporaires | En cours | Effets réutilisables, durée, cumul, déclenchement début/fin de tour |
| Compétences | Actives/passives, coûts, cooldowns, charges | Contrat + runtime générique | En cours | Coût, charges, cooldown, cible, jet, effets, conditions |
| Évolution héros | Non générique | Formes temporaires/permanentes | En cours | Conditions + coût + durée + effets + compétences |
| Combat RPG | D100/dés + timeline + nombreux wrappers historiques | State machine déterministe | En cours | 1 action = 1 résolution ; initiative configurable ; statuts temporaires ; animation non autoritaire |
| Défaite / KO | Historiquement liée aux PV + correctifs locaux | Règle générique stat/ressource/seuil | Base active | Aucun nom `PV` imposé ; univers choisit la condition de KO |
| Déplacement | Tactique individuel avec correctifs successifs | Positions individuelles + distance par chemin + portée configurable | Base active | Position individuelle, coûts configurables, pas de téléportation groupe |
| Vision / furtivité | Détection et perception partiellement codées | Moteur générique configurable | Base active | Stats choisies par menu, distance/zone configurables, aucun nom privilégié |
| World Builder | Monde/zone/salle/branches | À migrer | À faire | Parité des liens, retours, branches, événements |
| Créateur de salle | Cases, murs, portes, coffres, pièges, énigmes | À migrer | À faire | Toutes interactions éditables et liées par sélecteurs |
| Événements | Narration + effets limités | Actions composables | À faire | Chaînes d'actions, effets, sons, spawn, portes, choix |
| Coffres | Rareté, loot, pièges, interaction tactique | À migrer | À faire | Rareté, contenu, piège, énigme, événement, audio |
| Pièges | Tests + dégâts / états | À migrer | À faire | Stat choisie, difficulté, détection, désamorçage, effets |
| Énigmes | Bibliothèque + porte/coffre selon couches | À migrer | À faire | Case/porte/coffre/événement + aides + pénalités |
| Inventaire / objets | Armes, armures, consommables, munitions, sets | À migrer | À faire | Stats/effets/sons/charges/restrictions génériques |
| Sets | Set cuir + Armure des Anciens + paliers | À migrer | À faire | `setId`, paliers, affichage porté/total |
| Marchands | Stock, rupture, revente, persistance | À migrer | À faire | Stock configurable et persistant |
| Progression | XP, niveaux, points, popup | À migrer | À faire | Courbe configurable + formes + compétences |
| Bestiaire | Créatures Dungeon éditables | À migrer | À faire | Stats/ressources/IA/attaques/loot/audio libres |
| MJ / IA | IA, MJ, mixte | À migrer | À faire | Rôles clairs, outils MJ invisibles joueur |
| Audio | Sons répartis dans plusieurs systèmes | Bibliothèque centrale | À faire | Un asset audio réutilisable partout par ID |
| Sauvegarde | localStorage + IndexedDB + backup/import rollback | Core stockage V2 isolé | En cours | Autosave, export/import, migrations, rollback |
| Survie | Fonctionnel et jugé satisfaisant | Migration fidèle | À faire | Même comportement avant amélioration |
| Capture | Ancien système encore présent par couches | Isolé / gelé | Conservé | Inventaire historique avant future réécriture dynamique |
| PVP | Réservé mais non construit | Espace isolé | Réservé | Aucun couplage au RPG/Capture |

## Règles de validation

1. Un élément n'est marqué **Migré** qu'après implémentation + test de parité.
2. Les données utilisateur ne doivent jamais dépendre du nom affiché d'une stat ou ressource.
3. Toute liaison éditable doit passer par un sélecteur, une liste ou une recherche, jamais par saisie d'ID.
4. La V2 ne remplace pas `main` avant parité suffisante et validation explicite.
5. Les régressions historiques (timeline infinie, double popup, respawn, sauvegarde perdue, etc.) deviennent des tests de non-régression.
