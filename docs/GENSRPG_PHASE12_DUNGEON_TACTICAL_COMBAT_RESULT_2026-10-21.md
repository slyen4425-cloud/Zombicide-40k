# GenSrpG — Phase 12 / Dungeon Tactical : résultat réel, récompense et reprise UI — GREEN ciblé

**21 octobre 2026. Validation Chromium et Firefox du cycle réel « entrée → combat → victoire → récompenses → retour Dungeon → rechargement → REPRENDRE LA PARTIE ».** Cela ne valide ni un scénario de défaite, ni le passage à une salle ultérieure, ni le comportement sur smartphone/PWA.

## Charte, point de départ et propriétaires

- **Dernier GREEN de code initial** : `checkpoint/gensrpg-phase12-dungeon-tactical-first-turn-green-2026-10-20`, SHA `1387565eae166abb337083956e4fb6c9d62159be`, CI premier tour 39491014162.
- **§25 START créé avant mutation** : `checkpoint/gensrpg-start-phase12-dungeon-tactical-combat-result-2026-10-21`, SHA exact `1387565eae166abb337083956e4fb6c9d62159be` ; branche unique `work/gensrpg-phase12-dungeon-tactical-combat-result-2026-10-21`.
- **§26** : `index.html` reste au blob `9f35eb833a6ede4b91399854f19bb9bef59f45ab` (1 729 855 octets). [Permalien immuable](https://github.com/slyen4425-cloud/Zombicide-40k/blob/1387565eae166abb337083956e4fb6c9d62159be/index.html). Aucun besoin de lire/modifier le gros HTML par connecteur.
- **Zéro changement de runtime** : le diff avec le dernier GREEN porte exclusivement sur un nouveau test navigateur, un workflow CI et `docs/GENSRPG_CURRENT_WORK.md`. Le propriétaire Dungeon des salles, le propriétaire Tactical du combat, le bridge de résultat, les services Core Stats/D100 et le stockage restent inchangés. Aucun mock/injection de monstre, dégâts, IA, jet, XP ni victoire.
- `main` reste gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; pas de merge, ni déploiement Pages/PWA, ni modification des laboratoires, images Survie ou des modes voisins.

## Parcours réel reproduit

1. Cliquer **Aventure RPG → Dungeon**, accepter le rechargement normal du changement de famille, lancer nouvelle partie avec Aldren, Lyra et Brom.
2. Configurer uniquement le **poids des rencontres** via l'API d'édition officielle à 100 % ennemi pour rendre le scénario reproductible, sans modifier les résultats du combat.
3. Entrer réellement en salle 1, générer un squelette vivant 5 PV marqué `dungeonRoom=1`, fermer la narration/effet avec leurs boutons publics, puis cliquer **ENGAGER LE COMBAT**.
4. Choisir la cible, employer les boutons visibles **Approcher**, **Attaquer**, **Fin du tour**, **Continuer** pour les D100, jusqu'au statut natif `battle.status='ended'`. Ne jamais appeler directement `resolveAttack`, `endTurn`, `commitBattle` ou le moteur d'IA.
5. Cliquer le bouton natif **« Appliquer le résultat et revenir au donjon »**. Observer l'événement `gensrpg:tactical-combat-finished` une seule fois, la fermeture de l'overlay, la modale de victoire, la disparition du squelette de `loadActiveEnemies` et `dungeonLivingEnemies`, le déverrouillage de la salle, et le détail de la récompense.
6. Fermer la modale de récompense ; actualiser le vrai navigateur, revenir par le choix de famille/univers et cliquer **REPRENDRE LA PARTIE**. Vérifier que le Core Dungeon s'affiche bien en salle 1, ennemis toujours éliminés, PV/blessures et XP conservés, pas de Tactical résiduel. Un coffre dans la salle peut légitimement prendre priorité sur le bouton d'exploration.

## Résultats exacts de la CI finale

- [**CI 39539851897**](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39539851897) au commit **`17ce4972fb2e3cb859cbe25be3fc2f4196dbddac`** : deux jobs **SUCCESS**, statuts `gensrpg/phase12/combat-result/regression` et `gensrpg/phase12/combat-result/browser` **success** sur le même SHA. Les sentinelles historiques R10–R15/architecture/Tactical/Core Stats/D100 sont conservées et ont réussi ; zéro diff sur `index.html`, `assets/`, `service-worker.js` et manifeste de propriétaires.
- **Chromium** : victoire d'Aldren au tour/manche **6**, héros **10/14 PV**, squelette **0/5 PV** ; **5** clics d'attaque par le joueur, **10** fenêtres de dés confirmées. Résultat appliqué, **1 XP**, **4 blessures** persistantes, aucun ennemi actif, salle 1 restaurée par le vrai bouton **REPRENDRE**.
- **Firefox** : victoire au tour/manche **7**, héros **12/14 PV**, squelette **0/5 PV** ; **7** clics d'attaque, **13** fenêtres de dés confirmées. Résultat appliqué, **1 XP**, **2 blessures** persistantes, aucun ennemi actif, salle 1 restaurée via **REPRENDRE**.
- Les jets D100 sont réels et aléatoires ; le test contrôle que les PV finaux de chaque acteur correspondent aux dommages réellement inscrits au journal. Le total d'XP correspond **une seule fois** aux parts de la récompense ; rechargement/reprise ne le double pas.
- **Butin** : aucun objet n'est tombé dans ces deux parcours. La gestion du **cas positif** d'un drop n'est donc pas validée. Aucun `pageerror` bloquant observé, mais warnings 404 de ressources en Chromium et avertissement historique `unreachable code` en Firefox sont à caractériser hors de ce lot.

## Checkpoint GREEN et limites

- **Checkpoint GREEN immuable créé après succès des deux jobs** : `checkpoint/gensrpg-phase12-dungeon-tactical-combat-result-green-2026-10-21`, pointant précisément sur **`17ce4972fb2e3cb859cbe25be3fc2f4196dbddac`**. Les commits documentaires de rapport se trouvent sur la branche de travail et ne modifient pas le checkpoint validé.
- **Prochain lot séparé et nouveau §25 START** : valider un passage réel de salle 1 vers salle 2 après la victoire, les salles à verrouillage/clef, le cas de défaite, un loot effectivement obtenu et sa persistance, les autres modes/frontières, les 404 d'assets et la PWA sur smartphone. Aucun GREEN global de Phase 12 et aucune publication de `main`.

Références : `docs/GENSRPG_CHARTE.md` §§1–5, 12–26 ; `docs/GENSRPG_CHECKPOINT_POLICY.md` ; `tests/gensrpg_phase12_dungeon_tactical_combat_result_browser.cjs`.
