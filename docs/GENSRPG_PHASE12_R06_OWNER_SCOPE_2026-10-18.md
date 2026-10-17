# GenSrpG — Phase 12 / R06 — bornage du prochain propriétaire inline

**Date : 18 octobre 2026. État : R06 OUVERT, PRÉ-AUDIT DOCUMENTAIRE ; AUCUNE EXTRACTION ni GREEN R06.**

## 1. Reprise sécurisée après validation utilisateur

Le test utilisateur du 17/18 octobre a validé les combats, embuscades et les murs du Dungeon généré. L'exécution reprend donc sur le dernier **code validé par le joueur et par toutes les suites CI** :

| Élément | Référence vérifiée |
|---|---|
| Checkpoint de départ R06 §25 | `checkpoint/gensrpg-start-phase12-r06-inline-owner-scope-2026-10-18` |
| Branche de travail R06 | `work/gensrpg-phase12-r06-inline-owner-scope-2026-10-18` |
| Base code immuable | `4dd865a45634b7367ce66a526feae58b923edef9` |
| Checkpoint GREEN antérieur | `checkpoint/gensrpg-dungeon-generated-wall-texture-green-2026-10-17` |
| Index exact au départ | **2 782 155 octets**, Git blob `b33542b033c5afa8a1643d99c56c21dbd4be266c` |
| Main, hors chantier | `e8681f9823573ced8aec59c8ddc47a72b02bc663` |

**Preuves sur un SHA commun :** [Dungeon généré / Tactical / embuscades](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738371), [Firefox](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738376), [Tactical dock](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738379), [Architecture / Chromium](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39072738381), quatre workflows SUCCESS.

## 2. Ce qui est déjà externalisé et ne doit PAS être recommencé

Constat à partir de l'arbre Git du checkpoint (uniquement métadonnées de fichiers et anciens rapports) :

| Propriétaire actif | Chemin | Taille | Blob |
|---|---|---:|---|
| Core / données visuelles legacy | `assets/gensrpg/core/legacy-visual-data-v1.js` | 4 100 559 o | `f7adfca9b04b23c489aae71ae9284c9b849f1d0b` |
| Shell / famille et accueil Hub | `assets/gensrpg/shell/legacy-hub-family-ui-v1.js` | 6 651 o | `e45f3b4e419a10b030c47bc921bded1ec0dc723b` |
| Builders / bibliothèque équipements | `assets/gensrpg/builders/equipment-library-editor-v1.js` | 27 860 o | `27cadba87c766b5293ac3a7fe3ddffb8510adc40` |
| Core / synchronisation et sauvegardes | `assets/gensrpg/core/legacy-cloud-sync-backup-v1.js` | 53 746 o | `8d7f8179676b096a53816cd1ca2530c120e3cf18` |

R01 (manifest dynamique), R02 (données visuelles), R03 (Shell), R04 (Builders), R05 (Core cloud) et D1–D9 sont déjà protégés par leurs propres checkpoints et rollback. Les traiter une deuxième fois comme des scripts encore inline serait une erreur.

Le plan initial des sept gros anonymes dans `GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md` remonte **à D9 avant les R01–R05**. Ses nombres et classements ne sont **PAS un inventaire courant** : le HTML fait maintenant **2,782 Mo**, et non 7,704 Mo. Ne pas recycler une estimation d'environ 109 blocs actifs comme nombre exact à ce stade.

## 3. Frontière R06 à établir à partir du fichier courant

**La prochaine extraction n'est pas sélectionnée à l'aveugle.** Il faut fournir une photographie exacte, vérifiable et actuelle des scripts actifs résiduels et de leur propriétaire, puis privilégier un groupe contigu, homogène et utile plutôt qu'un Core numéroté traité artificiellement comme un lot.

Trois familles à caractériser, **non validées comme candidates actuelles** :
- **Shell / version / interface d'accueil** : bloc historique d'environ 181 Ko au stade D9 ; probablement transverse. Ne prélever qu'un périmètre réellement Shell, sans démarrage Capture/Dungeon, sans UI/stockage mixés.
- **Capture** : des scripts nommés historiques, environ 140 Ko au stade D9 ; Phase 9 Capture est fonctionnellement close. Toute extraction doit préserver le vrai hub Capture autonome, les sauvegardes/reprises et éviter de réactiver des propriétaires Dungeon.
- **Dungeon Core 0.24 feedback IA** : petit anonyme historique d'environ 6,3 Ko au stade D9. Possible propriétaire homogène, mais risque de multiplier les microlots avec peu d'effet ; ne le sélectionner que si les frontières, la charge réelle et le gain en sont démontrés.

Le résidu de code métier précédemment inclus dans l'anonyme multidomaine (~1,26 Mo après R02) n'est pas, en soi, un unique propriétaire. Interdiction de le déplacer en bloc ou de lui inventer un propriétaire `core` par facilité. Les désactivés C doivent rester inertes et être retirés/archivés par un chantier collectif dédié, pas un par un.

## 4. Règle d'admission §26 — aucune ancienne archive substituée

Le [permalink exact vers `index.html` au checkpoint R06](https://github.com/slyen4425-cloud/Zombicide-40k/blob/4dd865a45634b7367ce66a526feae58b923edef9/index.html) est la seule source admissible pour une future extraction. Télécharger cette révision exacte puis la joindre en ZIP ; vérifier les **2 782 155 octets** et le blob `b33542b033c5afa8a1643d99c56c21dbd4be266c` avant toute analyse du corps ou modification.

Les ZIP `c7` et `c8` ne correspondent PAS à ce blob : le passage des murs générés a changé `index.html` de 2 781 436 à 2 782 155 octets, en conservant une correction fonctionnelle manuellement validée. **Ne pas écraser cette correction au nom du découpage.** Le connecteur GitHub est utilisé pour les références SHA, branches, arbres, CI et commits, non pour faire transiter le gros HTML.

## 5. Procédure d'extraction quand la source exacte sera certifiée

1. **Mesurer** les balises actives et désactivées actuelles, domaine et taille de chaque script, calls globaux et la séquence de chargement.
2. **Désigner** un seul propriétaire R06, décrire ses consommateurs et l'unique seam d'entrée/sortie. Exclure les quatre autres modes si leurs dépendances ne sont pas nécessaires.
3. **Préparer** dans le même lot une extraction physique réversible : JS externe byte-identique, `<script src>` classique synchrone au même endroit, rollback index R06 → checkpoint exact, pas de renommage des API ni nouvelle autorité. Pré-cache service worker et manifeste des propriétaires mis à jour.
4. **Tester** d'abord la parité de chargement et les fonctions de propriétaire, ensuite navigateur réel (Survie/Dungeon/Capture/PvP, Tactical, Builder, héros, objets, dés, salles générées et authored, Save & Quit, PWA), enfin Architecture/Chromium, Firefox et Tactical SUCCESS sur **un seul SHA**.
5. **Clôturer** le lot R06 par un checkpoint GREEN sur le commit vraiment testé, pas sur un commit documentaire ultérieur. Le lot suivant aura sa propre branche et son propre checkpoint START.

## 6. État exact de clôture de ce pré-audit

- ✅ Reprise Phase 12 autorisée par retour utilisateur.
- ✅ Branche R06 et checkpoint de départ séparés, ancrés sur un code Dungeon validé.
- ✅ Blobs et propriétaires déjà externalisés vérifiés dans le Git tree.
- ✅ Backlog ancien requalifié : non utilisé comme inventaire courant, pas de D10 mécanique.
- ☐ Source `index.html` R06 actuelle reçue et son SHA vérifié.
- ☐ Choix du propriétaire exact et périmètre byte-identique.
- ☐ Extraction R06, nouveau commit code, CI R06, checkpoint GREEN et éventuelle preview.

La source certifiée est le seul verrou restant avant une modification physique de `index.html` respectant la charte. Aucun chantier sur `main` ou sur les laboratoires n'a été lancé.
