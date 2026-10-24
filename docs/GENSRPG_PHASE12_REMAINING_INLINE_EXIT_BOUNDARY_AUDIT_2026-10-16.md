# GenSrpG — Phase 12 / Remaining Inline — Audit de bornage de sortie
Date : 16 octobre 2026. **Audit structurel et plan de sortie, sans modification runtime.**

## 0. Autorité et charte

- **D9 déjà GREEN avant ouverture du présent audit**, contrairement à son statut au moment où l'audit initial a été rédigé. SHA verrouillé `83d6683896cdb58a63f98cf2fc3e360c23423f76` ; checkpoint `checkpoint/gensrpg-phase12-dungeon-core202-d9-green-2026-10-16`.
- Triple CI D9 sur ce même SHA : [Architecture/Chromium 38867846431](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846431), [Firefox 38867846444](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846444), [Tactical 38867846636](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38867846636) toutes SUCCESS.
- Checkpoint de départ du présent **chantier d'audit seulement**, §25 : `checkpoint/gensrpg-start-phase12-remaining-inline-exit-boundary-audit-2026-10-16` exactement sur ce SHA. Branche dédiée : `work/gensrpg-phase12-remaining-inline-exit-boundary-audit-2026-10-16`. **Aucun D10 ouvert.**
- Charte : §§1–22, 25–26 ; un propriétaire par responsabilité, quatre modes isolés ; tests du vrai chemin, compatibilité des sauvegardes et retour octet-exact pour les déplacements physiques. `main` figée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Ne pas intervenir dans les deux laboratoires ; préserver les 32 visuels Survie historiques.

## 1. Source et vérification reproductible

- Source §26 fournie par l'utilisateur : `c2.zip` → `index.html(12).txt`, **7 715 741 octets**, Git blob `f56dc5bbb368b176509ab16477bd4b24dd000497` = index D8 exact.
- Reconstruction D9 **uniquement en mémoire** : remplacer le corps original du script `dungeonCore202ContentDensity` (11 821 octets, blob `364673f3dd35bfa8be7f378152f775656c9243e2`) par sa balise `<script src="assets/gensrpg/dungeon/core202-content-density-v1.js">` à l'emplacement original. Fichier D9 reconstruit : **7 703 979 octets**, Git blob `fce949665fea47a2aa2a535ede7289b06936f986`. Ces métadonnées coïncident exactement avec l'index du checkpoint D9 GREEN.
- Méthode de comptage : balises `<script ...></script>`, `src` vs inline, présence d'un attribut `id`, et `type="application/x-gensrpg-disabled"`. Les poids de « scripts » ci-dessous concernent les **corps JS** (pas le HTML enveloppe) ; la désactivation doit rester caractérisée, jamais déduite d'un simple nom.
- **158** balises script : **32** externes, **126** inline.
- Inline : **109 actifs**, soit **6 814 878 octets** de corps, et **17 explicitement désactivés**, soit **95 878 octets**.
- Les 109 actifs : **7 anonymes = 6 340 391 octets**, **102 nommés = 474 487 octets**. Une majorité écrasante du volume se trouve dans les anonymes, pas dans les petits Core successifs.

## 2. Inventaire des sept anonymes actifs

| Ordre par poids | Taille exacte du corps | Description / classement de départ | Décision |
|---|---:|---|---|
| 1 | **5 364 441** | Bloc multi-domaines historique, Survie/Dungeon/Capture/UI/stockage ; inclut 5 `data:image` (PNG/WebP) pour **4 100 280 caractères base64** | **A**, sous-audit obligatoire ; pas un bootstrap minimal, pas un propriétaire mono-domaine |
| 2 | **734 440** | IIFE qui construit le manifeste PWA en `Blob` et change `gensManifestLink.href` | **A**, première externalisation byte-identique candidate **sans supprimer la logique** |
| 3 | **180 964** | Version, contenu, famille, accueil, éditeur, contrôle de mise à jour | **A**, couper par propriétaires après caractérisation |
| 4 | **53 746** | Supabase / synchronisation en ligne | **A**, garder connexion, sauvegarde et opt-in inchangés ; ne pas publier de secrets dans les rapports |
| 5 | **6 337** | Dungeon Core 0.24 feedback IA | **A**, propriétaire Dungeon ciblé, à regrouper seulement si prouvable |
| 6 | **244** | Connexion légère Shell PvP | **B provisoire**, possible bootstrap |
| 7 | **219** | Déclenchement différé du bootstrap IndexedDB | **B provisoire**, possible bootstrap |

Les **cinq gros anonymes non-bootstrap** pèsent **6 339 928 octets**. Leur simple **externalisation physique** ferait tomber `index.html` d'environ **7,704 Mo à 1,364 Mo** (ordre de grandeur, après tags). Cette diminution ne prouve ni la suppression d'autorités ni la réussite de l'architecture : vérifier la charge réseau, le parser-order, les assets et le runtime.

### Cas spécifique manifeste PWA

- Les deux PNG encodés dans le manifeste dynamique sont **byte-identiques** aux fichiers racine `icon-192.png` (71 694 octets, blob `a8e5c257eb91e77d805708393d2af24ab4a06a72`) et `icon-512.png` (478 559 octets, blob `34ff30639e8cbc0f2c366c6d82049772d38934fd`) du dépôt.
- Le HTML contient déjà `<link id="gensManifestLink" rel="manifest" href="manifest.webmanifest?v=1738">` ; **le script courant modifie ensuite son `href` vers une URL Blob**. Ne pas retirer cette logique par simple déduplication.
- Le manifeste statique `manifest.webmanifest` **diffère** du manifeste dynamique (au moins la description, la couleur de fond, l'orientation et les chemins des icônes). Le statique pointe vers `./icons/icon-192.png` et `./icons/icon-512.png`, tandis que les deux images certifiées sont à la racine ; la disponibilité réelle de ces chemins doit être contrôlée.
- **Premier lot à fort rendement recommandé :** déplacer le **script de création dynamique tel quel** dans un JS classique synchrone au même emplacement ; conserver le `Blob`, les images et la priorité effective du manifeste. Ensuite seulement, lot distinct de parité / déduplication PWA : installation, mise à jour, cache, mode hors connexion, Android mobile et GitHub Pages. Aucune fusion statique/dynamique sans preuve.

## 3. Frontière de sortie A / B / C

### A — code actif à sortir physiquement

- Cinq gros anonymes non-bootstrap ci-dessus, avec **sous-bor­nage obligatoire** du bloc de 5,36 Mo avant de le découper (4,10 Mo de base64 et ~1,264 Mo d'autres octets). Le qualifier explicitement de **multi-domaines** : ne pas donner son autorité à un module fictif ni le réécrire en bloc.
- **102 actifs nommés**, poids cumulé 474 487 octets. Classification fonctionnelle initiale de l'audit utilisateur : Capture 18 (~140 Ko), Dungeon 80 (~306 Ko), Core/Shell transversal 4 (~28 Ko) ; **affectation par propriétaire à vérifier avant chaque regroupement**, car certains identifiants hérités reflètent mal leur autorité réelle.
- Pour les petits nommés, préférer des **groupes cohérents et vérifiés** à des dizaines de micro-lots mécaniques : même domaine et contrat, fichier distinct par propriétaire, ordre parser inchangé, rollback de tous les scripts exact, test de l'interaction entre propriétaires. En cas de dépendance cachée, fractionner le groupe.

### B — bootstrap minimal admissible

- Les anonymes de **219** et **244 octets** sont les premiers candidats à rester inline. Ils restent **provisoirement B**, sous tests sur le vrai chemin de lancement, IndexedDB et composition PvP. D'autres fragments minuscules ne peuvent rester que s'ils sont nécessaires au bootstrap, sans logique de jeu ni autorité globale.
- Sortie Phase 12 = HTML lisible/stable, styles racine, bootstrap minimal, références explicites aux modules. Aucun combat, stats, sauvegarde, règles de mode, gros manifeste dynamique ou données massives directement inline.

### C — code explicitement désactivé

- **17** scripts `type="application/x-gensrpg-disabled"` = **95 878 octets**. **Un chantier collectif de caractérisation/retrait/archive**, pas 17 lots. Prouver l'absence de chargement, référence ou lecture textuelle utile ; conserver une archive externe traçable si nécessaire. Ne jamais réactiver implicitement.

## 4. Enveloppes de lots nécessaires à la sortie — ordre provisoire, pas 100 micro-lots

Ces **17 enveloppes** sont des périmètres à dimensionner en lots GitHub autonomes après caractérisation (une branche et un checkpoint initial par vrai lot). Elles ne prétendent pas garantir 17 commits, ni permettre de réunir artificiellement plusieurs autorités :

| Enveloppe | Objet, résultat attendu | Contrat critique |
|---|---|---|
| R01 | Manifeste dynamique 734 440 octets, externalisé **sans changement JS** | PWA et lien Blob identiques |
| R02 | Assets base64 du gros bloc, inventaire + extraction déterministe des ressources réellement déplaçables | Images identiques ; import/export et URLs existants non cassés |
| R03 | Gros monolithe : frontières Shell / bootstrap / globales | Conserver ordre parser, API, aucun deuxième Shell |
| R04 | Gros monolithe : code Survie | Propriétaire Survie et 32 images historiques intacts |
| R05 | Gros monolithe : code Dungeon | Sauvegardes, cartes, combat, progression inchangés |
| R06 | Gros monolithe : code Capture | Capture isolé et navigation préservée |
| R07 | Gros monolithe : stockage / éditeurs / export / interfaces transversales | Contrats explicites, données versionnées inchangées |
| R08 | Anonyme version / accueil / éditeurs, 180 964 octets | Déclenchement mise à jour et lancement sans régression |
| R09 | Anonyme Supabase / synchronisation, 53 746 octets | Auth, synchronisation et erreurs réseau inchangées |
| R10 | Anonyme Dungeon Core 0.24, 6 337 octets | Effet IA inchangé |
| R11 | Capture actifs nommés (~18 blocs) | Regrouper par propriétaire concret, préserver callbacks et états |
| R12 | Dungeon nommés : IA / combat / interaction | Autorité Tactical Bridge et adversaires |
| R13 | Dungeon nommés : exploration / cartes / génération | Carte, authored vs généré, transitions |
| R14 | Dungeon nommés : héros / équipement / économie / progression | Stats, sauvegardes et objets |
| R15 | Dungeon nommés : stabilité / visuels / debug / persistance | Aucune seconde autorité ; graphe préservé |
| R16 | Core/Shell transversaux et petits wrappers actifs | Contrat d'interface et bootstrap réel |
| R17 | 17 scripts C inactifs, archive/retrait, audit B résiduel et critères EXIT | Prouver non-chargement + garder seulement HTML/styles/bootstrap |

**12–20 lots restants = hypothèse de planification, pas estimation prouvée** tant que la découpe du monolithe et les frontières réelles n'ont pas été caractérisées. Ce plan remplace le modèle automatique « un Core numéroté = un lot ». Certaines enveloppes peuvent devenir plusieurs lots, ou être fusionnées uniquement quand l'indépendance et la réversibilité sont démontrées.

## 5. Gates d'exécution et clôture

1. **Cet audit de bornage est documentaire uniquement.** Ne pas ouvrir D10 avant son classement A/B/C et la liste de périmètres ; pas de modification du runtime pendant l'audit.
2. Pour chaque lot d'extraction, ouvrir checkpoint de départ §25 + branche propre sur dernier code GREEN ; source exacte §26 (nouveau SHA / ZIP), hash Git, propriétaire, parser-order, effet synchrone, type de script, dépendances et évaluation de risque.
3. Pour le bloc multi-domaines, **ne pas traiter la structure géante comme un propriétaire unique** : découpe par responsabilités prouvées, stratégies de rollbacks par propriétaire, tests d'intégration de la vraie page. Aucune migration fonctionnelle opportuniste.
4. Pour PWA, conserver d'abord le manifeste dynamique externe **à l'identique**, tests installation/cache/retour hors-ligne avant toute suppression de données redondantes.
5. Tests systématiques : unitaires, manifest propriétaire, chargement, side effects, snapshots/sauvegardes, comparaison byte-exact du JS et du HTML restauré, sentinelles Architecture/Chromium, Firefox et Tactical SUCCESS **sur le même SHA** ; checkpoint final vert seulement ensuite.
6. **Exit Phase 12** : inventaire 0 logique active de jeu inline, seulement B motivés et explicitement admis, 0 C inert oublié dans `index.html`, aucune double autorité, PWA stable, tests navigateur sur les parcours Survie/Dungeon/Capture/PvP, `index.html` essentiellement HTML/styles/bootstrap/chargements et dossier de preuve EXIT.

## 6. Prochaine décision

**Ne pas poursuivre D10 Core203 par inertie.** Première tâche après validation de cet audit : préparer le lot à fort rendement R01 (externalisation stricte du manifeste dynamique) sur **une nouvelle branche et un checkpoint propre**, sans effacement des PNG ni changement du manifeste statique. Pour toute inspection d'un `index.html` nouveau, respecter §26 ; le dernier permalink source D9 est https://github.com/slyen4425-cloud/Zombicide-40k/blob/83d6683896cdb58a63f98cf2fc3e360c23423f76/index.html (7 703 979 octets / blob `fce949665fea47a2aa2a535ede7289b06936f986`). Le ZIP `c2.zip` est la base D8 ; sa reconstruction locale est valable pour l'audit, mais pas une permission de contourner le checkpoint Git d'un futur lot.
