# GenSrpG V2 — Matrice de parité

Cette matrice sert de garde-fou : aucune fonction historique n'est considérée supprimée simplement parce qu'elle n'a pas encore été migrée.

| Domaine | Référence actuelle | V2 | Statut | Critère de parité |
|---|---|---|---|---|
| Accueil / modes | Survie, RPG, Capture, PVP réservé | Survie + RPG actifs, Capture/PVP réservés | En cours | Navigation propre, aucun état gameplay partagé |
| Aide contextuelle | Partielle / dispersée | Volet `?` uniforme | En cours | Chaque zone importante possède aide + exemple |
| Stats RPG | Plusieurs stats historiques + couches de migration | Statistiques libres par ID | Base active | Création, édition, activation, bornes, progression |
| Ressources RPG | PV/Mana et usages historiques | Ressources libres par ID | Base active | PV, Mana, Ki, Rage, etc. possibles sans code spécial |
| Conditions | Conditions dispersées | Moteur générique | Base active | Stat, ressource, niveau, XP, quête/item/flag selon configuration |
| Effets | Buff/debuff/DoT/HoT dispersés | Moteur générique + statuts temporaires/persistants | Base active | Effets réutilisables, durée, cumul, ordre déterministe, add/subtract/multiply/percent/set |
| Compétences | Actives/passives, coûts, cooldowns, charges | Contrat + runtime générique branché au vrai combat | Base active | Coût, charges, cooldown, cible, jet, effets, conditions |
| Évolution héros | Non générique | Formes temporaires/permanentes | Base active | Conditions + coût + durée + effets + compétences |
| Combat RPG | D100/dés + timeline + nombreux wrappers historiques | State machine déterministe + vraie vue Donjon | Base active | 1 action = 1 résolution ; initiative configurable ; stale-turn rejeté ; fin de combat réconciliée |
| Défaite / KO | Historiquement liée aux PV + correctifs locaux | Règle générique stat/ressource/seuil | Base active | Aucun nom `PV` imposé ; univers choisit la condition de KO |
| Déplacement | Tactique individuel avec correctifs successifs | Positions individuelles + distance par chemin + portée configurable | Base active | Position individuelle, coûts configurables, pas de téléportation groupe |
| Vision / furtivité | Détection et perception partiellement codées | Moteur générique configurable | Base active | Stats choisies par menu, distance/zone configurables, aucun nom privilégié |
| World Builder | Monde/zone/salle/branches | Moteur + éditeur zones/salles/liaisons + passages authored | Base active | Liens, retours, branches, objets requis, conditions, réutilisation des salles |
| Créateur de salle | Cases, murs, portes, coffres, pièges, énigmes | Grille + murs/portes + interactions structurées | Base active | Toutes interactions éditables et liées par sélecteurs |
| Interactions de salle | Case/porte/coffre selon couches legacy | Coffre/piège/énigme/événement/interrupteur/portail/objet | Base active | Rattachement case/porte/coffre par sélecteur, liens invalides refusés |
| Événements | Narration + effets + spawn + embuscades | Runtime salle + file d'événements + orchestration | En cours | Chaînes d'actions, choix et audio à compléter si nécessaire |
| Coffres | Rareté, loot, pièges, interaction tactique | Support générique + runtime salle | Base active | Rareté, contenu, piège, énigme, événement, audio |
| Pièges | Tests + dégâts / états | Support générique + éditeur | Base active | Stat choisie, difficulté, détection, désamorçage, effets |
| Énigmes | Bibliothèque + porte/coffre selon couches | Support générique + éditeur | Base active | Case/porte/coffre/événement + aides + pénalités |
| Inventaire / objets | Armes, armures, consommables, munitions, sets | Moteur objets + inventaire + consommables combat | Base active | Stats/effets/charges/restrictions génériques ; audit munitions/sons restant |
| Sets | Set cuir + Armure des Anciens + paliers | Moteur de sets intégré aux héros/compétences | Base active | `setId`, paliers, bonus actifs et exposition UI à maintenir |
| Marchands | Stock, rupture, revente, persistance | Moteur marchand V2 | Base active | Stock configurable et persistant, achat/revente cohérents |
| Progression | XP, niveaux, points, popup | Moteur progression V2 | Base active | Courbe configurable + compétences/formes ; UX level-up à poursuivre |
| Bestiaire | Créatures Dungeon éditables | Moteur bestiaire V2 + spawn/runtime salle | Base active | Stats/ressources/attaques/loot configurables ; IA avancée à poursuivre si besoin |
| MJ / IA | IA, MJ, mixte | Tours ennemis auto + MJ total + panneau manuel sécurisé par appareil | Base active | Rôles clairs, outils MJ invisibles joueur, même combatState |
| Audio | Sons répartis dans plusieurs systèmes | Bibliothèque/runtime audio centralisés | En cours | Asset audio réutilisable partout par ID ; inventaire des anciens sons à terminer |
| Sauvegarde | localStorage + couches historiques + backup/import | Core stockage local + routeur remote | En cours | Autosave, export/import, migrations et rollback utilisateur encore à consolider |
| Survie | Fonctionnel et jugé satisfaisant | Moteur/données/interface séparés | Socle actif | Parité fonctionnelle complète encore à vérifier avant remplacement de main |
| Capture | Ancien système avec stockage/réserve/équipe/combats/objets/dresseurs | Aucun module V2 actif | Absent volontairement | Inventaire historique complet puis reconstruction isolée sans dépendance Dungeon |
| Multijoueur | Entrée héberger/rejoindre + système Supabase historique | Aucun module V2 | Absent | Host/join, code/invitation/QR et synchronisation sans coupler les moteurs |
| PWA / cache | Manifest + service worker versionné + offline/network-first | Aucun manifest/service worker V2 | Absent | Installation smartphone, cache versionné, mise à jour sûre, fallback offline |
| Import / export utilisateur | Sauvegardes/imports historiques | Pas encore de flux utilisateur final | Absent | Export monde/partie, import validé, migration/version et sauvegarde de secours |
| Assets Dungeon | Grande bibliothèque murs/sols/créatures/objets | Référencement partiel | En cours | Inventaire des assets utiles, suppression doublons, chemins V2 stables |
| Tests historiques | Batterie legacy très large | Batterie V2 dédiée | En cours | Transformer les anciennes régressions encore pertinentes en contrats V2 |
| PVP | Réservé mais non construit | Espace isolé | Réservé | Aucun couplage au RPG/Capture |

## Manques confirmés par l'audit legacy du 2026-09-12

1. **Capture** n'a pas encore de module V2. L'ancien chantier doit être récupéré avant réécriture : réserve, équipe active, combats de créatures, objets de capture, dresseurs et données historiques.
2. **Multijoueur** n'a pas encore de remplacement V2 alors que l'ancienne app exposait héberger/rejoindre et s'appuyait sur un système Supabase existant.
3. **PWA/cache** n'existe pas encore dans `v2/` : pas de manifest V2, pas de service worker V2, donc pas encore de stratégie d'installation/offline/version de cache pour la reconstruction.
4. **Sauvegarde utilisateur complète** reste incomplète : le provider local/remote existe, mais les flux finaux export/import/migration/rollback ne sont pas encore consolidés.
5. **Assets et sons legacy** doivent être inventoriés avant migration, sans recopier les doublons ni les wrappers historiques.
6. **Tests legacy pertinents** doivent être convertis en régressions V2 au fur et à mesure, plutôt que garder les anciens correctifs comme dépendances runtime.

## Règles de validation

1. Un élément n'est marqué **Migré** qu'après implémentation + test de parité.
2. Les données utilisateur ne doivent jamais dépendre du nom affiché d'une stat ou ressource.
3. Toute liaison éditable doit passer par un sélecteur, une liste ou une recherche, jamais par saisie d'ID.
4. La V2 ne remplace pas `main` avant parité suffisante et validation explicite.
5. Les régressions historiques (timeline infinie, double popup, respawn, sauvegarde perdue, etc.) deviennent des tests de non-régression.
6. L'audit legacy ne signifie pas recopier l'ancien code : il sert à identifier les comportements et données à préserver dans l'architecture V2.
