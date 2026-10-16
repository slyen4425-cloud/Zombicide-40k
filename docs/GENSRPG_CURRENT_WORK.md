# GenSrpG — Point de reprise LIVE (16 octobre 2026)

**Phase 12 : D1–D9 + R01 GREEN. R02 OUVERT en audit structurel uniquement (NON GREEN). Aucun code du monolithe déplacé ; Core203 suspendu.**

## Chantier ACTIF — R02 Bornage du monolithe anonyme A (5 364 441 octets)

- **Base §25 :** dernier code R01 GREEN `1b0fa3a718059242507d3e95de45033bba57ea24`; checkpoint de départ `checkpoint/gensrpg-start-phase12-r02-monolith-exit-scoping-2026-10-16` créé sur ce même SHA avant toute modification. Branche exclusive `work/gensrpg-phase12-r02-monolith-exit-scoping-2026-10-16`.
- **Nature du lot :** cartographie / séparation des responsabilités uniquement ; aucune extraction physique du monolithe avant identification des vrais propriétaires et des dépendances. Ne pas transformer ce script multi-domaines en un nouveau moteur.
- **Source §26 obligatoire pour lecture exacte :** [index.html R01 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/1b0fa3a718059242507d3e95de45033bba57ea24/index.html) — **6 969 593 octets**, Git blob `caf31c121d926b7b76b9bb05688fab8f2839814e`. Demander le **ZIP de ce fichier exact** ; `c4.zip` correspond à D9 et est désormais périmé.
- **Éléments déjà bornés dans l'audit global :** grand anonyme 5 364 441 octets, environ 4 100 280 caractères d'images base64 et environ 1,264 Mo de code multi-domaines. Quatre moteurs, Shell, éditeurs et persistance à distinguer par autorité ; ne pas toucher aux 32 visuels Survie historiques.
- **Tests prévus** : poids/hash du script, inventaire `data:image` et consommations, sections/fonctions/effets globaux, chargement parser, contracts Survie/Dungeon/Capture/Shell/Core, sauvegarde/import/export, PWA hors-ligne ; isolation/rollback octet exact et triple CI uniquement lors de lots d'extraction validés.
- **Garde-fou :** `main` et les deux labos figés ; R01 GREEN reste une base immuable. Ne pas créer de faux checkpoint GREEN pour ce diagnostic non exécuté.
- **Livrable de cadrage :** `docs/GENSRPG_PHASE12_R02_MONOLITH_EXIT_SCOPING_2026-10-16.md` ; attente d'index R01 source §26 avant caractérisation détaillée.
- **Le lot R02 n'est pas commencé au niveau runtime :** aucune extraction/CI R02 GREEN annoncée.

## Dernier lot validé — R01 : manifeste PWA dynamique

- **Base fonctionnelle §25 :** D9 GREEN `83d6683896cdb58a63f98cf2fc3e360c23423f76`, document de bornage validé sur `d26f4a3219d34aac229c0ee71a0f489915c83129`. Checkpoint de départ `checkpoint/gensrpg-start-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16` ; branche dédiée `work/gensrpg-phase12-r01-pwa-dynamic-manifest-extraction-2026-10-16`.
- **Source §26 certifiée :** ZIP utilisateur `c4.zip` / `index.html(13).txt`, **7 703 979 octets**, blob Git `fce949665fea47a2aa2a535ede7289b06936f986` égal à D9.
- **Extraction réelle et sans modification de l'IIFE :** un propriétaire PWA anonyme de **734 440 octets** / Git blob `778e3acf2f77b3c7680bf70a0c6a846b84826235` déplacé vers `assets/gensrpg/shell/pwa-manifest-dynamic-v1.js`, script classique synchrone à son emplacement d'origine ; manifeste statique, icônes embarquées et URL Blob inchangés.
- **Nouvel index R01 :** **6 969 593 octets**, Git blob `caf31c121d926b7b76b9bb05688fab8f2839814e` ; gain net **734 386 octets**. Réinsertion de l'IIFE restaure **octet pour octet** l'index D9, qui restaure lui-même D8→D1. Le graphe du runtime comporte maintenant **103 fichiers propriétaires atteignables**.
- **Service worker :** nouveau JS PWA pré-caché et version cache renouvelée pour préserver l'amorçage hors ligne ; aucune refonte ni remplacement de manifeste. Une vérification manuelle d'installation/mise à jour sur Android reste utile avant déploiement public, et n'est pas confondue avec la triple CI.
- **Application contrôlée :** [GitHub Actions 38895240370](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38895240370) SUCCESS.
- **GREEN officiel, même SHA `1b0fa3a718059242507d3e95de45033bba57ea24` :** [Architecture/Chromium 38897048039](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897048039), [Firefox 38897047733](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047733), [Tactical 38897047747](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047747), toutes **SUCCESS**.
- **Checkpoint final §25 :** `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16` vérifié sur ce SHA de triple CI. Les corrections post-extraction concernent inventaires, tests historiques, cache PWA et manifest de propriétaires (pas de modification de logique du générateur de manifeste).
- **Rapport :** `docs/GENSRPG_PHASE12_R01_PWA_MANIFEST_2026-10-16.md` ; bornage `docs/GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md`.
- **Protection des branches :** `main` production figée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucun changement des deux laboratoires, des règles Tactical ou des sauvegardes.

## Bilan et prochaine action

- D1–D9 : **230 719 octets de JS externalisés**, **230 225 octets nets supprimés de l'index**. R01 ajoute **734 440 octets JS**, **734 386 octets nets d'index retirés**. Total **965 159 octets JS externalisés** et **964 611 octets nets d'index en moins** depuis le départ de Phase12.
- **Direction de R02 : caractérisation du bloc anonyme multi-domaines 5 364 441 octets**, dont ~4,10 Mo de base64 images, selon la classification A/B/C. Distinguer données visuelles, code Survie/Dungeon/Capture, UI et sauvegardes avant toute extraction ; pas de propriétaire fictif ni refonte fonctionnelle ; sa branche et son checkpoint de départ sont ouverts pour cette caractérisation documentaire.
- **Source R02 requise §26 :** [index.html au code R01 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/1b0fa3a718059242507d3e95de45033bba57ea24/index.html) **6 969 593 octets**, Git blob `caf31c121d926b7b76b9bb05688fab8f2839814e`. Demander le fichier exact compressé en ZIP avant de consulter/découper le nouveau monolithe. `c4.zip` = D9, désormais périmé pour R02.
- **Sortie Phase12** : HTML/styles/bootstrap minimal, plus de logique de mode/moteur/sauvegardes inline ; garder catégories A/B/C et enveloppes R01–R17 ; regroupement par propriétaire seulement si frontières et parser-order prouvés. Aucun micro-lot mécanique en série sans justification.
- **Charte permanente :** `docs/GENSRPG_CHARTE.md` §§1–26, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
