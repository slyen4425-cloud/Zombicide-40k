# Capture V2 — récupération des PV de toute l'équipe (11 novembre 2026)

- **START** : branche HUD #388 à `9ab24432d9bffe4e7414393fd133bdaa8bb3ccf4`, lot séparé `work/gensrpg-capture-hp-recovery-team-2026-11-11` (1 lot = 1 branche).
- **Autorité** : une seule transaction `applyAdventureCombatResultV1` persiste l'AdventureSession et les résultats du vrai Combat. Aucun second inventaire, combat ou stockage.
- **Règle préexistante corrigée** : `combat.defeatPolicy='restore'` après résultat officiel `defeat` restaure tous les membres, y compris les 1 à 6 créatures en réserve. `null` signifie PV complets projetés par le moteur Combat avec le multiplicateur créateur (25 % par défaut). `keep-ko`, `game-over`, victoire et fuite conservent leur logique.
- **Compatibilité historique** : ancien CombatResult sans tableau de membres, ou sauvegarde ancienne avec réserve restée KO après défaite, récupère les mêmes membres sans refaire les récompenses, ni altérer le Bestiaire.
- **Test requis** : équipe de six KO, résultat Combat corrélé, écriture dans Core Storage, rechargement, anti-double commit. Tests existants `adventure_wild_reserve` et `save_defeat_policy`.
- **NON GREEN** avant CI source SHA exact, navigateur, certification des PR parentes, publication unique main et HTTPS/Android. Aucun média ni pin Lab modifié.
