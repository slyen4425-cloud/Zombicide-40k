# GenSrpG — Phase 12 / audit EXIT réel après R10 — source E1 certifiée

**19 octobre 2026 — audit documentaire, sans aucun changement de code de jeu.** Phase 12 **reste ouverte**. Ce document remplace le statut « source manquante » de la préparation post-R10.

## 1. Protocole, source et branches

- Référence du code R10 immuable : `checkpoint/gensrpg-phase12-r10-capture-legacy-functions-green-2026-10-18`, SHA `b1797246c76543447cbbd11248bd59b5c3d7ad6b`, quatre CI obligatoires SUCCESS sur ce SHA (voir le rapport R10).
- Le START §25 `checkpoint/gensrpg-start-phase12-post-r10-exit-assessment-2026-10-19` a été créé sur ce SHA avant toute modification ; travail sur `work/gensrpg-phase12-post-r10-exit-assessment-2026-10-19`.
- **Gate §26 franchi le 19 octobre :** archive fournie par l'utilisateur `E1.zip` (676 688 octets), membre `index.html(7).txt` **2 031 649 octets**, Git blob **`b8ef8dcb497cad94c91094ed008136a5d9800155`** ; empreinte SHA-256 **`affeace70bd5fbb82b0663eac474a39abb02e01a2a5ad53a6d04326672b4eaf5`**. Ces octets correspondent exactement au `index.html` du checkpoint R10 ; aucun ancien index ni HTML reconstitué n'a été substitué.
- Source Git : https://github.com/slyen4425-cloud/Zombicide-40k/blob/b1797246c76543447cbbd11248bd59b5c3d7ad6b/index.html
- Production `main` gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; laboratoires Combat/Exploration et 32 images Survie hors périmètre.

## 2. Recensement R10 exact, PAS repris de R09

La lecture du HTML certifié a compté les véritables balises `script`, leurs attributs `src`/`type`/`id` et les octets de leurs corps. Les cinq blocs anonymes ont été analysés avec le parseur TypeScript/JavaScript (zéro diagnostic de parsing sur ces cinq corps).

| Mesure | R09 (source d8.zip certifiée précédemment) | **R10 (E1.zip certifiée)** |
|---|---:|---:|
| Balises script | 164 | **165** |
| Scripts externes | 58 | **59** |
| Scripts inline actifs | 89 | **89** |
| Corps inline actifs | 1 201 978 o | **1 140 482 o** |
| Inline anonymes actifs | 5 / 867 198 o | **5 / 805 702 o** |
| Inline actifs identifiés | 84 / 334 780 o | **84 / 334 780 o** |
| Scripts explicitement désactivés | 17 / 95 878 o | **17 / 95 878 o** |

**Effet vérifié du R10** : -61 496 octets de corps JS inline actif, **un** script externe de plus, -61 417 octets nets de HTML (2 093 066 → 2 031 649 octets). Les 90 fonctions Capture ont été déplacées, pas supprimées.

### Topologie des cinq actifs anonymes R10

| N° balise | Corps (octets) | Déclarations/structure de premier niveau | Qualification |
|---:|---:|---|---|
| **22** | **704 020** | **886** fonctions, **131** déclarations variables, 12 instructions expression, 1 instruction vide ; parse JS valide | **Grand monolithe multi-domaines** (Survie, Dungeon/RPG, éditeurs, Shell, Core et données) ; interdiction de le qualifier comme propriétaire Core unique |
| **25** | **94 882** | 115 fonctions, 13 déclarations variables, 1 `if`, 4 expressions ; parse JS valide | Ensemble transverse (mises à jour/PWA, bibliothèques et entités partagées, créatures, héros, éditeurs) ; ne pas externaliser intégralement comme autorité unique |
| 27 | 219 | 1 `if` | Candidat bootstrap IndexedDB/DOMContentLoaded **non validé comme bootstrap pur** |
| 64 | 6 337 | IIFE | Logique/visuels de feedback IA Dungeon, **pas** un bootstrap minimal |
| 164 | 244 | 1 `try` | Raccord Shell/PvP, candidat bootstrap **à caractériser** |

Les deux plus gros anonymes représentent **798 902 octets**, soit **70,05 %** du corps inline actif. Les cinq anonymes cumulent **805 702 octets (70,65 %)**. Les 84 scripts nommés restants représentent 334 780 octets, **sans preuve qu'ils partagent tous un seul propriétaire**.

Les **1 001 fonctions** de premier niveau dans les deux gros anonymes (886+115) ne sont pas 1 001 « lots » à programmer. Le tri des noms montre plusieurs domaines mêlés ; un simple préfixe `dungeon`, `capture`, `render`, etc. ne constitue pas un audit de dépendances. Des constantes lexicales, états, initialisations, listeners et effets de bord sont présents et rendent risqué un déplacement global.

## 3. Scripts désactivés (groupe C) : contrôle statique préliminaire

- **17 scripts `type="application/x-gensrpg-disabled"` / 95 878 octets**, inchangés depuis R09, dont `rpgTurnTargetFlow157`, `rpgPlayerTargeting158`, `rpgHeroTargeting159` et les anciennes séquences Dungeon 091–105.
- Dans l'HTML R10 exact, **aucune référence littérale à ces 17 ID n'a été trouvée dans un corps JS actif** en excluant la balise désactivée elle-même.
- **Cinq de ces ID** restent mentionnés dans des **styles CSS** : `rpgTurnTargetFlow157`, `rpgPlayerTargeting158`, `rpgHeroTargeting159`, `dungeonCore091PostCombatUnlock`, `dungeonCore104Coherence`. **Ne pas supprimer leurs règles CSS par assimilation aux corps JS inertes.**
- Un examen textuel des **56 fichiers JS locaux externes lisibles sur les 57 référencés** n'a relevé aucun nom de ces scripts désactivés ni accès direct explicite par `document.scripts`/`getElementsByTagName("script")`/`querySelectorAll("script")`. Les deux CDN externes sont hors revue locale. Le fichier `assets/gensrpg/core/legacy-visual-data-v1.js` n'a pas livré son contenu par le connecteur (résultat vide malgré un blob Git identifié), **donc la couverture externe n'est pas exhaustive**.
- Ces constats restent des **contrôles littéraux**, pas une preuve contre les références dynamiques (concaténation de noms, scans DOM, accès indirect à `textContent` ou `innerHTML`), les dépendances de tests ni les fichiers non chargés dans cet index. **Aucun retrait C autorisé sur cette seule base.**

## 4. Décision de priorité / rentabilité

1. **Pas de R11 lancé automatiquement.** L'EXIT de Phase 12 n'est pas satisfait : **1 140 482 octets** de JS actif restent inline, plus **95 878 octets** de scripts désactivés ; les deux grands blocs possèdent encore de nombreuses autorités et données mêlées.
2. **Priorité A** : sélectionner **un groupe cohérent et substantiel réellement mono-propriétaire** au sein du n°22 ou n°25, sur preuves AST + dépendances et ordre parser (ne pas déplacer un monolithe transverse en bloc). Si aucun groupe suffisamment sûr et rentable n'est démontré, documenter le risque et ne pas créer un lot pour améliorer artificiellement le compteur.
3. **Priorité C** : compléter la preuve d'inertie des 17 scripts désactivés, notamment les usages dynamiques et le fichier externe non inspecté, puis envisager un **lot collectif unique** (95 878 octets) avec sauvegarde du HTML exact, rollback byte-identique, conservation CSS et tests multi-modes.
4. **Priorité B** : caractériser les deux mini-bootstraps et traiter, s'il y a matière, les petits propriétaires identifiés par groupes cohérents. Éviter explicitement 84 micro-lots et le déménagement cosmétique de wrappers.
5. Ne pas intégrer les refontes de combat/exploration développées dans leurs deux laboratoires à cette opération d'extraction historique. Le retour utilisateur favorable sur R10 n'est **pas** une validation exhaustive du combat Capture.

## 5. Gardes avant toute modification ultérieure

- Nouveau START §25, nouvelle branche, périmètre propriétaire et source exacte §26 correspondant au nouveau SHA ; `E1.zip` vaut pour le code R10 certifié et doit être **recomparée** à l'état du prochain chantier.
- Tests obligatoires : extraction byte-identique, rollback, parse JavaScript, contrats de globals et ordre de chargement, service worker + pré-cache, non-interférence des quatre modes, sauvegarde/reprise et PWA, navigateurs Chromium et Firefox, Tactical, CI complète sur **un SHA unique**. Toute CI rouge bloque.
- **Aucun fichier runtime/asset modifié dans ce chantier d'audit**. Seules la documentation et la preuve machine du recensement sont mises à jour.

Voir `docs/GENSRPG_PHASE12_POST_R10_VERIFIED_CENSUS_2026-10-19.json` pour les compteurs et les cinq empreintes de corps anonymes.
