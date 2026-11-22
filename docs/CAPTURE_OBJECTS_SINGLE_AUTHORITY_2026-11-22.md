# Monster InvoC — objets, drops, fragments et boutiques PNJ (22 novembre 2026)

## Sources et checkpoint
- Propriétaire métier : **Monster Capture V2 / AdventureRules et AdventureSession** dans ce dépôt.
- Base exacte : `206ab07efe74abb6821480becf9bcc7767ea685e`, branche précédente `work/capture-item-library-defaults-20261121` (PR #565).
- Checkpoint START **non modifié** : `checkpoint/capture-objects-start-20261122` sur ce SHA.
- Branche de travail : `work/capture-object-library-single-authority-20261122`, PR #595, issue #594.
- Route/PWA `main` non modifiée ; le raccord à la PWA nécessite CI, budget, médias, pin source et test HTTPS **du même SHA**, conformément à la charte. Aucun GREEN avant ces preuves.

## Propriétés et garde-fous
- Capture V2 est l'unique auteur de `loot.items`, `loot.drops`, `fragmentRecruitment`, `economy.merchants` et `AdventureSession.inventory` ; les champs optionnels `kind` et `useEffect` ne migrent pas destructivement les anciennes définitions.
- Les fragments restent des références virtuelles `fragment:<speciesId>` issues du Bestiaire officiel Combat ; aucune copie de son catalogue ni des médias.
- Exploration stocke seulement `merchantId` dans ses définitions PNJ. L'éditeur natif PNJ délègue la configuration par un message `gensrpg.exploration.npc.merchant.configure.v1` contrôlé same-origin, exécuté par le Shell Capture. Le bouton/contrat est préparé dans la PR Exploration #518 ; aucune table d'offres, aucun second inventaire dans Exploration.
- Les trois vues d'édition **Bibliothèque d'objets**, **Drops / Ressources**, **Boutique PNJ** réutilisent les **mêmes** données et le **même formulaire Adventure** (pas de base nouvelle). La bibliothèque comporte les sous-catégories Utilisables / Ressources / Fragments.
- Ressource à la publication du Bestiaire dans le brouillon d'un univers : compléter les espèces manquantes (1 ressource à 50 %, quantité 1, revente 100) par la fonction canonique `materializeCapturePublishedMonsterDropsV1`. Préserver tout drop explicitement réglé, toute ancienne partie et tout override de fragments. L'icône doit appartenir réellement à l'espèce ; sinon sans illustration.
- Potions nouvelles par défaut du jeu vitrine : soin +20 PV ; réanimation 35 % PV max. Les fiches sont éditables ; le Sac passe par `useAdventureConsumableV1` et le même verrou/sauvegarde de session que les combats et fragments. L'inventaire ne s'affiche pas pendant le combat. Test idempotent et refus des cibles incohérentes.
- `merchant.resalePercent` facultatif et éditable dans la boutique PNJ (100 % par défaut historique), les prix/stock d'offres restent par marchand ; la valeur `item.saleValue` appartient à la fiche référence, jamais dupliquée en état autonome.

## Parcours/tests requis avant GREEN
1. Contrats potions et consommation depuis la vraie fiche de Sac, cible réserviste comprise, double clic, reprise sauvegardée, refus en combat.
2. Nouvelle créature publiée et ancienne créature personnalisée, rechargement, changement d'univers, import/export ; une ressource, pas de conflit et fragment intact.
3. Trois onglets bibliothèque, sélection d'icône et transitions Android paysage/PC ; édition réellement persistée dans Core Storage.
4. PNJ Explore -> ouvrir l'unique boutique Capture -> régler offre, prix, rachat, stock -> revenir sans perte PNJ -> achat/vente transaction unique.
5. CI unitaires, tests navigateur Explor/Combat, absence de régression Dungeon/Survie, budget Pages, HTTPS/publication PWA au SHA exact.

### CI / publication
La branche reste en **préparation** tant que le cycle complet n'est pas GREEN. Les échecs de sentinelles historiques sur les anciens chemins d'édition nécessitent mise à jour explicite des assertions, jamais des moteurs parallèles.
