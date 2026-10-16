# GenSrpG Phase12 — R02 : bornage du monolithe anonyme après R01 GREEN (16 octobre 2026)

**Statut : AUDIT DOCUMENTAIRE R02, runtime inchangé ; aucune extraction R02 ni checkpoint final GREEN.**

## Gouvernance et preuves

- Dernier GREEN fonctionnel : **R01** au SHA `1b0fa3a718059242507d3e95de45033bba57ea24`, checkpoint `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16`.
- Triple CI R01 au même SHA : Architecture/Chromium [38897048039](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897048039), Firefox [38897047733](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047733), Tactical [38897047747](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047747), toutes SUCCESS.
- Point de départ R02 §25 : `checkpoint/gensrpg-start-phase12-r02-megablock-boundary-audit-2026-10-16` sur le SHA R01 GREEN **avant tout changement** ; branche unique `work/gensrpg-phase12-r02-megablock-boundary-audit-2026-10-16`. Audit seulement, pas de déplacement de JS/images ni de modification du Shell, des modes ou de l'import/export.
- Source §26 : `c5.zip` / `index.html(14).txt`, **6 969 593 octets**, Git blob `caf31c121d926b7b76b9bb05688fab8f2839814e`, correspond exactement au code R01 GREEN. Le ZIP `c4.zip` correspond à D9, il est dépassé pour R02.
- Plus grand `<script>` actif sans `id` : **5 364 441 octets**, corps blob Git `181ec13091f7dfeb5dde173af99dbe1aeecb07c2`, script classique synchrone. Dans le HTML, balise à l'offset **620 361–5 984 819**. Elle arrive après les externes Capture et se termine par l'installation de l'accueil sur événement. **Aucun extrait n'est déplacé dans ce lot documentaire.**

## 5 images encodées présentes au sein du même JS

| Élément | Offset dans JS | Format | Caractères base64 |
|---|---:|---|---:|
| `Z40K_GENERIC_SHEET_BG` | 33 | PNG | 3 587 780 |
| `GENSRPG_EQUIPMENT_CARD_BG` | 3 608 340 | WebP | 136 656 |
| `GENSRPG_ENEMY_SKINS.creature` | 4 227 113 | WebP | 125 144 |
| `GENSRPG_ENEMY_SKINS.boss` | 4 352 291 | WebP | 142 372 |
| `GENSRPG_ENEMY_SKINS.invocation` | 4 494 703 | WebP | 108 328 |
| **Total** | | | **4 100 280** |

Ces 5 data URI occupent **4 100 394 octets avec les préfixes** ; le reste du script est **1 264 047 octets**, code et données autres. Les base64 ne doivent pas être confondues avec les deux icônes du manifeste R01. Les images d'origine et les 32 images Survie historiques sont intouchables sans preuve.

## Frontières visibles à cartographier avant découpe

| Marqueur (offset JS) | Famille et précaution |
|---|---|
| `renderCustomVisualSheet` (3 587 908) | Règles/fiche Survie ; fidélité visuelle et callbacks |
| `GENSRPG_EQUIPMENT_CARD_BG` (3 608 307) | Équipement/éditeur et crop |
| `GENSRPG_IDB_MIGRATION_FLAG` (3 749 379), `gensrpgOpenAssetDb` (3 749 632) | IndexedDB : import/export, migrations, hydratation et cache |
| `dungeonRpgLevelFromXp` (3 789 253) | Stats et progression Dungeon, vérifier l'autorité canonique |
| `renderHome` (4 030 256) | Shell, accueil, routage |
| `openGameProfileEditorFromHub` (4 101 087) | Éditeurs, transitions |
| `startConfiguredGame` (4 214 293) | Démarrage Survie/Dungeon/Capture |
| `GENSRPG_ENEMY_SKINS` (4 227 079) | Assets ennemis / éditeur |
| `window.addEventListener` (5 364 088) | Effet de bord d'initialisation ; préserver l'ordre parser |

Signaux globaux textuels : `localStorage` 141 occurrences, `indexedDB` 12, `addEventListener` 28, `setInterval(` 3. Les fréquences de mots par mode **ne déterminent pas les propriétaires**.

## Décision et sous-bornage

1. **Cartographier tous les consommateurs des cinq chaînes `data:`** : rendu, modèles, sauvegarde, export et fonctionnement hors ligne. En priorité `Z40K_GENERIC_SHEET_BG` (3 587 780 caractères), sans supprimer ni changer son contrat.
2. **Identifier les propriétaires fonctionnels réels** des 1 264 047 octets restants : stockage Core, éditeurs, Survie, Dungeon, Capture, Shell. L'ordre des déclarations `const/let`, des fonctions exposées au DOM et des événements peut rendre un découpage dangereux.
3. Définir les sous-lots par responsabilité validée, chacun avec checkpoint/branche/source exacte selon §§25–26, JS transféré à l'identique, rollback octet par octet, tests PWA, vraie navigation, sauvegardes et triple CI Architecture/Firefox/Tactical au même SHA. **Interdit de prétendre que les 5,36 Mo appartiennent à un propriétaire unique.**
4. R02 audit documentaire ne rend pas Phase12 GREEN ; D10 Core203 reste suspendu. La branche production `main`, les labos combat et exploration, les sauvegardes et le gameplay restent inchangés.
