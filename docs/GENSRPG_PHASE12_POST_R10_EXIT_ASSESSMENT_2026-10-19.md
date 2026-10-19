# GenSrpG — Phase 12 / reprise d'audit EXIT après R10

**19 octobre 2026 — chantier strictement documentaire, préparation de l'inventaire R10. Aucun changement de runtime ni extraction engagée.** Phase 12 ouverte.

## Départ certifié et conformité

- Dernier code certifié : R10 `b1797246c76543447cbbd11248bd59b5c3d7ad6b` ; checkpoint `checkpoint/gensrpg-phase12-r10-capture-legacy-functions-green-2026-10-18`.
- START §25 créé **avant tout changement** : `checkpoint/gensrpg-start-phase12-post-r10-exit-assessment-2026-10-19` -> `b1797246c76543447cbbd11248bd59b5c3d7ad6b`.
- Branche dédiée : `work/gensrpg-phase12-post-r10-exit-assessment-2026-10-19` (issue du même SHA).
- La branche R10 possède ensuite des commits documentaires (dernier `3bbdf5cbd41bc77600861a07e577c4ee0dcb9d62`) ; comparaison vérifiée : uniquement `docs/GENSRPG_CURRENT_WORK.md` et `docs/GENSRPG_PHASE12_R10_CAPTURE_LEGACY_FUNCTIONS_2026-10-18.md` changés, **aucune différence de runtime**. Le présent chantier reprend explicitement l'information de validation manuelle partielle.
- `main` reste gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Aucun merge autorisé.
- Périmètre : inventaire des responsabilités restantes dans `index.html` R10, et décision de rentabilité/risque de la fin de Phase 12. Exclus : gameplay, modifications des quatre modes, assets Survie historiques, laboratoires Combat et Exploration, PvP non commencé.

## État réellement démontré avant l'audit

- R09 avait été compté **sur l'archive exacte utilisateur d8.zip** : 164 balises script, 58 externes, 89 inline actifs (1 201 978 octets), 17 désactivés (95 878 octets). Les deux anonymes majeurs mesuraient 765 516 et 94 882 octets à **R09**. **Ces nombres ne sont pas un inventaire R10.**
- R10 a extrait byte-identiques **90 déclarations Capture** en `assets/gensrpg/capture/legacy-monolith-functions-v1.js` ; code externe 61 943 octets, HTML réduit de 2 093 066 à **2 031 649 octets** (net -61 417). Pas de changement aux règles de combat.
- Métadonnées Git (vérifiées au tree du code certifié et au tree documentaire ultérieur) : `index.html` R10 **2 031 649 octets / blob `b8ef8dcb497cad94c91094ed008136a5d9800155`** ; `preview.html` et `service-worker.js` identiques entre le SHA certifié et le dernier SHA documentaire.
- R10 : quatre suites CI SUCCESS sur `b1797246c76543447cbbd11248bd59b5c3d7ad6b` : R10 source/rollback [39165974364](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39165974364), Firefox [39165974390](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39165974390), Tactical [39165974365](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39165974365), Architecture + Chromium [39165974429](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39165974429).
- Essai humain le 19 octobre : « Ça a l'air pas mal » ; les combats Capture n'ont pas été vérifiés en profondeur. N'en déduire ni acceptation exhaustive du gameplay ni achèvement de l'intégration des laboratoires.

## Gate obligatoire §26 — non franchi pour R10

La source `d8.zip` n'est **valide que pour R09** (2 093 066 octets, blob `4dbe3314d5048f2def404ed674498c0670c04fc1`). Le nouvel inventaire doit se fonder sur **l'index R10 exact**, fourni par l'utilisateur depuis le permalink SHA immuable :

https://github.com/slyen4425-cloud/Zombicide-40k/blob/b1797246c76543447cbbd11248bd59b5c3d7ad6b/index.html

Fichier à demander en ZIP ; avant toute lecture de son contenu ou extraction : vérifier **2 031 649 octets** et blob Git **`b8ef8dcb497cad94c91094ed008136a5d9800155`**. Ne pas réutiliser l'ancienne archive, ni tenter de contourner §26 par une lecture/troncature GitHub du gros HTML.

## Plan d'audit mesurable après réception

1. **Recensement réel R10** : nombre de balises `script`, externes, inline actifs, scripts désactivés et tailles, hash de chaque corps, ordre de chargement et échantillons de responsabilités ; séparer vraie diminution du HTML et fonctionnement des externes.
2. **Frontières actives A** : AST des scripts anonymes principaux ; fonctions, états lexicaux, initialisations, références croisées et effets de bord. Démontrer des groupes **substantiels et mono-propriétaires**, pas un nouveau monolithe « Core ».
3. **Bootstraps B** : vérifier si les minuscules scripts actifs restant dans l'index ne contiennent ni règles ni autorité gameplay. Ne les conserver inline que sous preuve.
4. **Inertes C** : vérifier les 17 scripts historiquement désactivés (effectif R10 à recompter), références DOM / `textContent` et CSS, éventuels consommateurs externes. Si réellement inutilisés, proposer un **lot collectif**, jamais 17 micro-lots ni leur réactivation.
5. **Décision EXIT** : arbitrer gain net en octets, réduction des autorités et risque de comportement ; sélectionner au plus quelques groupes rentables ou arrêter explicitement si risques supérieurs. Ne pas appeler la Phase 12 GREEN tant que sa définition de sortie n'est pas atteinte.

## Garde-fous pour la suite

- Audit documentaire seul sur cette branche ; toute extraction nécessite nouveau START §25, nouvelle branche et source §26 compatible avec ce nouveau checkpoint.
- Préserver sources de vérité Shell / Core / Survie / Dungeon / Capture / Tactical, sauvegardes, profiles, caches PWA, mobiles et chargement JS classique synchrone.
- Aucun changement de gameplay, aucun asset déplacé. Ne pas anticiper la refonte Combat/Exploration prévue dans les labos.
- Tests requis pour un futur lot runtime : rollback octet-exact, SHA/blobs, AST + compilation, contrats/owners et service worker, tests vrais par mode, Architecture + Chromium, Firefox, Tactical et sentinelles de source sur **un même SHA**. Toute CI rouge bloque le checkpoint final.
- Statut de cet audit : **démarré et borné**, inventaire exact **en attente de la source R10** ; aucun nombre R09 présenté comme R10.
