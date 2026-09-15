# GenSrpG — Ordre de nettoyage et restructuration

Cette feuille de route applique `GENSRPG_CHARTE.md`. Le principe est de réduire le risque avant chaque déplacement de code. Aucun big-bang.

## Phase 0 — Geler et documenter l’état actuel

Objectif : conserver un point de comparaison fiable.

- relever le SHA de production ;
- conserver une branche de sauvegarde ;
- documenter les comportements validés actuels ;
- lister les régressions connues restantes ;
- ne pas mélanger corrections gameplay et restructuration dans le même jalon.

Critère de sortie : base sûre identifiée et reproductible.

## Phase 1 — Tests sentinelles avant tout déplacement

Créer/renforcer les scénarios qui doivent survivre à toute la restructuration :

- lancement Survie ;
- lancement Dungeon ;
- fiche héros Dungeon ;
- Save & Quit + reprise ;
- mouvement Dungeon ;
- stats canoniques ;
- dés D100/D6 ;
- calcul de touche ;
- dégâts + armure + résistances ;
- combat Tactical entrée/sortie ;
- Monster Capture ;
- Duel/PvP ;
- sauvegarde ;
- PWA/cache.

Ajouter des tests de non-interférence entre les quatre modules.

Critère de sortie : une régression majeure bloque automatiquement la CI.

## Phase 2 — Cartographie réelle du runtime

Inventorier :

- scripts réellement chargés par index.html ;
- auto-installs ;
- wrappers/monkey-patches ;
- MutationObserver ;
- listeners document/window ;
- timers/retries ;
- accès directs à localStorage/IndexedDB ;
- fonctions globales remplacées ;
- responsabilités dupliquées.

Classer chaque fichier : Core, Shell, Survie, Dungeon, Tactical, Capture, PvP, Builders, legacy/inactif.

Critère de sortie : aucun fichier runtime actif sans propriétaire connu.

## Phase 3 — Créer l’arborescence cible sans déplacer le gameplay

Créer les dossiers :

- `assets/gensrpg/core/`
- `assets/gensrpg/shell/`
- `assets/gensrpg/survival/`
- `assets/gensrpg/dungeon/`
- `assets/gensrpg/tactical/`
- `assets/gensrpg/capture/`
- `assets/gensrpg/pvp/`
- `assets/gensrpg/builders/`

Ne pas encore supprimer les anciens fichiers. Préparer les points d’entrée et contrats.

Critère de sortie : structure prête, comportement production inchangé.

## Phase 4 — Sortir les services communs de index.html

Ordre recommandé :

1. resolver d’assets ;
2. stockage/migrations ;
3. moteur de stats ;
4. inventaire/équipement/sets ;
5. dés ;
6. progression/XP ;
7. bus d’événements/utilitaires communs.

Chaque extraction doit :

- conserver exactement le comportement ;
- supprimer l’ancienne implémentation active après validation ;
- ajouter un test du vrai raccord ;
- ne pas introduire de wrapper global de compatibilité permanent.

Critère de sortie : index.html ne contient plus les moteurs communs.

## Phase 5 — Extraire le Shell et la navigation

Créer l’autorité unique pour :

- accueil ;
- changement de module ;
- navigation générale ;
- fiche personnage hors combat ;
- ouverture/fermeture des écrans ;
- état de session/module actif.

Retirer des modules toute autorité globale sur les vues qu’ils ne possèdent pas.

Critère de sortie : un seul propriétaire de navigation et fiche héros.

## Phase 6 — Isoler Survie

Déplacer progressivement le runtime Survie dans `survival/`.

- aucun appel aux fonctions privées Dungeon ;
- dés/stats/inventaire communs uniquement via Core ;
- assets Survie uniquement via contexte Survie.

Critère de sortie : Survie démarre/joue avec Dungeon/Tactical non chargés ou inactifs.

## Phase 7 — Isoler Dungeon exploration

Déplacer dans `dungeon/` :

- exploration ;
- salles/branches ;
- déplacement ;
- événements/spawn ;
- portes/coffres/pièges/énigmes ;
- déclenchement de combat ;
- sauvegarde d’état Dungeon.

Dungeon reste propriétaire du monde et décide quand Tactical démarre.

Critère de sortie : exploration complète sans dépendance UI Tactical globale.

## Phase 8 — Consolider Tactical

Revenir à l’architecture cible initiale :

- engine pur ;
- adapter ;
- UI ;
- AI ;
- bridge Dungeon.

Supprimer progressivement :

- chaînes V108/V109/V111/V112/V113 redondantes ;
- observers body ;
- heartbeats ;
- réinstallations différées ;
- multiples autorités de détection ;
- multiples autorités de rendu ;
- multiples calculateurs de dégâts/touche.

Important : avant cette phase, corriger et figer le vrai chemin stats -> snapshot -> attaque -> dégâts, plus explication détaillée des calculs.

Critère de sortie : Tactical n’existe que pendant une session de combat et se démonte proprement.

## Phase 9 — Séparer Monster Capture

Créer `capture/` comme module autonome.

- créatures, biomes, capture, équipe/réserve ;
- combat Capture propre ;
- Core commun uniquement pour services génériques réellement partagés ;
- aucun détournement Dungeon/Survie.

Critère de sortie : Capture peut démarrer sans runtime Dungeon/Survie actif.

## Phase 10 — Séparer Duel/PvP

Créer `pvp/` autonome avec ses règles de session, combat et UI.

Critère de sortie : aucune fonction globale des trois autres modules n’est remplacée.

## Phase 11 — Restructurer les assets visuels

Créer :

- `assets/common/`
- `assets/survival/`
- `assets/dungeon/`
- `assets/capture/`
- `assets/pvp/`

Sous-dossiers selon besoin : heroes, enemies, bosses, creatures, items, icons, tiles, walls, doors, traps, chests, ui, effects, biomes, arenas.

Procédure obligatoire :

1. inventaire des PNG/JPG/WebP réellement utilisés ;
2. attribution à un module ;
3. identification des vrais assets communs ;
4. table `ancien chemin -> nouveau chemin` ;
5. adaptation du resolver central ;
6. tests visuels et chemins ;
7. déplacement physique par lots ;
8. suppression des compatibilités anciennes seulement après validation.

Aucun fallback inter-module.

Critère de sortie : un asset Dungeon ne peut plus apparaître en Survie par collision de nom.

## Phase 12 — Alléger index.html

Une fois les modules extraits, index.html doit contenir principalement :

- structure HTML minimale ;
- styles racine ;
- shell/bootstrap ;
- chargement explicite des modules/services nécessaires.

Pas de moteur de combat, stats, sauvegarde ou logique de mode inline.

Critère de sortie : index.html devient lisible et stable.

## Phase 13 — CI d’architecture

Automatiser les règles importantes :

- interdire nouveaux MutationObserver body/html ;
- interdire nouveaux setInterval globaux non autorisés ;
- détecter les remplacements de fonctions protégées ;
- vérifier qu’un module n’importe pas directement un runtime privé d’un autre ;
- vérifier les assets hors périmètre ;
- vérifier les quatre scénarios sentinelles.

Critère de sortie : une future dérive architecturale échoue avant publication.

## Priorité immédiate recommandée

Avant de déplacer beaucoup de code :

1. terminer les tests sentinelles ;
2. corriger/figer le vrai calcul RPG Tactical (stats réelles, armes, dégâts, armure 50/50, explication) ;
3. cartographier les scripts actifs ;
4. extraire Core stats/storage/assets sans changement de gameplay ;
5. isoler Shell/navigation ;
6. seulement ensuite attaquer les gros déplacements Dungeon/Tactical.

Cette priorité évite de restructurer autour d’un calcul encore ambigu ou de perdre une règle pendant le déménagement.
