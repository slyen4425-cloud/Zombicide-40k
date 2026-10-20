# GenSrpG — Phase 12 / Audit EXIT exact après R13

**20 octobre 2026 — audit de l'index R13 réel, sans extraction ni modification du runtime.** Phase 12 **OUVERTE**. Les conclusions ne valent ni validation gameplay manuelle ni CI du chantier suivant.

## 1. Gouvernance et source authentifiée (§§25–26)

- Référence R13 GREEN / point d'ancrage : `checkpoint/gensrpg-phase12-r13-builders-enemy-editor-green-2026-10-20`, code SHA `e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec`, 7/7 jobs SUCCESS documentés dans le rapport R13.
- START créé avant toute modification : `checkpoint/gensrpg-start-phase12-post-r13-exit-audit-2026-10-20`, **strictement identique** au code R13 GREEN (comparaison GitHub zéro commit). Branche propre `work/gensrpg-phase12-post-r13-exit-audit-2026-10-20`.
- Archive reçue dans cette conversation : `e1.zip`, membre unique `index.html(1).txt`. **Taille décompressée exacte 1 820 094 octets** ; **Git blob `b5a39705baf83e9782695c14bede8b9dde6ddf52`**, conforme au R13 GREEN ; **SHA-256 `e54d03be07e7efb9b9cfa39d9289823ecc09b1eaf3524c39abfe5338ed60594b`**. ZIP comprimé : 627 464 octets. Ce fichier est **la vraie source R13**, pas l'ancien `E1.zip` R10.
- Permalien de l'index exact : https://github.com/slyen4425-cloud/Zombicide-40k/blob/e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec/index.html
- Méthode : extraction des 150 balises `script` (dans leur ordre HTML, attributs, corps), décompte en octets UTF-8, hachage Git des corps, puis analyse TypeScript AST des scripts inline actifs avec zéro diagnostic de parsing. Le parse AST démontre une structure syntaxique, **pas** la propriété effective d'un domaine ni la parité du navigateur.

## 2. Inventaire exact au R13 — remplace les projections du pré-audit

| Mesure | Valeur **observée dans le ZIP R13 authentifié** |
|---|---:|
| Taille totale `index.html` | **1 820 094 octets** |
| Balises `<script>` totales | **150** |
| Scripts externes avec `src` | **61** |
| Blocs inline actifs (y compris commentaires seuls) | **89** |
| Blocs `type=application/x-gensrpg-disabled` | **0** |
| Octets de code/corps inline actifs | **1 026 171** |
| Scripts inline actifs anonymes | **5 / 691 391 octets** |
| Scripts inline actifs identifiés par `id` | **84 / 334 780 octets** |
| Erreurs syntaxiques AST dans les blocs inline actifs | **0** |

**Attention à la sémantique des compteurs** : `89` dénombre les balises sans `src` et sans type désactivé, même si le corps n'est qu'un commentaire ; plusieurs identifiants historiques se terminent par `Disabled`, mais leurs corps sont des commentaires. Ne pas reclasser ces marqueurs comme les 17 anciens scripts inertes retirés au R11. Les 89 ne constituent pas 89 autorités métier distinctes.

## 3. Les cinq vrais anonymes actuels — ordre des balises R13

| Balise | Corps exact | Empreinte Git du corps | Classification de travail |
|---:|---:|---|---|
| **24** | **589 709 o** | `bc60b190f9295f9bcb0e4f94cf26b919873c66ac` | Grand monolithe **multi-domaines** — A |
| **27** | **94 882 o** | `50e5b25ce6d3d9bf41c6e684f5548cc5842be935` | Héros/créatures/entités partagées, éditions et migration — **mixte**, A |
| 29 | 219 o | `cdf33d5bbe5ba17c36d100b2e348c82e67818160` | Bootstrap IndexedDB/DOMContentLoaded différé, B provisoire |
| 63 | 6 337 o | `ff958f9e2965130ed9c4da1ba8df721b47332d10` | **Feedback visuel IA Dungeon**, IIFE exécutée, A |
| 149 | 244 o | `c43d47df21d662a46ae54c0770106d3694acf235` | Raccord Shell/PvP, B provisoire |

### AST des deux grands blocs

- Balise **24**, 589 709 o : **759 déclarations de fonctions**, **131 instructions de déclaration de variables**, 12 expressions top-level et une instruction vide ; zéro diagnostic de syntaxe. La présence d'états, variables et initialisations interdit le déménagement du bloc entier sous une fausse autorité Core.
- Balise **27**, 94 882 o : **115 déclarations de fonctions**, **13 déclarations de variables**, quatre expressions et un `if` au premier niveau ; zéro diagnostic. `gensStarterCreatures` (~16 963 o) y côtoie éditeurs de héros, entités partagées, création de créatures et Capture ; pas un propriétaire unique.
- Les **874 fonctions déclarées au premier niveau** de ces deux blocs ne sont **pas 874 lots**. Les fonctions restantes sont toujours chargées depuis le document, pas effacées par la restructuration.
- Les **84 scripts nommés** représentent 334 780 o de corps HTML inline. Ils contiennent de nombreuses extensions Dungeon historiques à contrats différents (combat, UI, économie, exploration, stabilité, rendus, sauvegardes). Ne pas les déplacer comme un seul module ni les transformer en 84 demandes réseau synchrones.

## 4. Pistes testées par analyse statique — poids vs dépendances

Les plages ci-dessous sont des **périmètres d'exploration**, pas des frontières validées pour extraction. Un balayage AST a recensé les appels directs par identifiant vers les fonctions déclarées dans le grand script ; les accès objets, callbacks indirects et variables lexicales ne sont pas encore entièrement couverts.

| Groupe / plage dans le grand script | Fonctions | Octets de déclarations | Dépendances et décision |
|---|---:|---:|---|
| Bibliothèque de capacités (`openAbilityLibrary` à `editAbilityLibraryEntry`) | **14** | **10 947** | Propriété Builders vraisemblable, mais interfaces, état et API de capacités externes ; **trop petit seul pour un nouveau micro-lot** |
| Profils/éditeur Survie (plage `gensReferenceSurvivalSettings` → `restoreReferenceSurvivalMod`) | **30** | **16 546** | Appelle `loadGameProfiles` 14 fois, `saveGameProfiles` 10 et `applyGameProfile` 9 : vérifier frontière Core/Shell ↔ Survie avant déplacement |
| Région éditeur Univers RPG (plage `openRpgUniverseEditor` → `restoreReferenceRpgUniverse`) | **78** | **66 349** | Mélange UI, réglages, rencontres, données, sauvegarde et utilitaires runtime ; 31 appels vers `ensureRpgProfileData`, 23 vers `saveGameProfiles`, 22 vers `loadGameProfiles`, 17 vers `applyGameProfile` — **pas encore mono-propriétaire** |
| Région ennemis/spawn/combat (plage des scripts legacy correspondants) | **41** | **34 929** | Récompenses, effets, IA, spawn et UI mêlés : ne pas confondre avec l'éditeur d'ennemis R13 déjà sorti |
| Large région combat Dungeon classique | **159** | **136 237** | UI/rendu, blessures, calcul d'attaque, inventaire et pont Dungeon/Tactical mélangés ; **risque d'autorité concurrente majeur**, pas candidat à extraction en bloc |

L'analyse des appels a également relevé plusieurs dépendances vers des fonctions déclarées hors du grand script (ex. helpers communs, API de capacités, règles RPG externes) ; aucune « dépendance inconnue » n'a été assimilée à une fonction manquante : une partie vit dans les 61 scripts externes ou l'autre bloc inline.

**Unicité locale** : aucune déclaration de fonction top-level homonyme trouvée entre les 89 scripts inline actifs. Cela n'établit pas l'absence de remplacement par les fichiers externes ; seul un audit croisé des 61 scripts et des extensions de runtime permettrait de certifier cette absence.

## 5. Décision EXIT : pas de sortie de phase, pas de R14 mécanique

- **Phase 12 non clôturable** : **1 026 171 octets de corps inline actifs**, dont deux grands blocs avec de nombreuses responsabilités restent dans le shell. Les 17 anciens scripts désactivés ont bien disparu, ce qui valide la composante C déjà traitée ; aucune nouvelle suppression C à fabriquer.
- **Candidat R14 à approfondir en premier** : **le domaine Builders / éditeur d'Univers RPG**, bornage plus fin de la région de 78 fonctions. **Retirer du candidat** les fonctions possédant autorité runtime ou stockage Core et traiter explicitement les états/initialisations qui resteraient inline. Ne pas ouvrir R14 tant que cette frontière n'est pas démontrée. Le seul groupe capacités (10 947 octets) ne justifie pas un chantier isolé.
- **Deuxième axe éventuel** : consolider les vrais groupes mono-propriétaires parmi les 84 scripts Dungeon nommés, sans réécrire leurs corps ou déplacer par préfixe. Le choix doit se fonder sur une matrice d'appels, d'ordre de parser, d'effets de bord et sur la parité UI.
- **À garder provisoirement inline (B)** : les 219 octets qui programment `gensrpgBootstrapIndexedStorage()` au démarrage et les 244 octets qui raccordent `GensPvpShellCompositionV1.connect()`. Vérifier le vrai cycle et les effets avant de leur attribuer une exception EXIT définitive.
- **À déplacer seulement avec justification** : IIFE de 6 337 octets Dungeon visuel, éventuellement dans un regroupement Dungeon de même responsabilité, pas en micro-lot à part.
- Il faut préserver `main` gelée, les deux laboratoires, les 32 images Survie, les sauvegardes, la PWA et l'interaction des quatre modules.

## 6. Portes d'entrée avant le prochain lot physique

1. **Nouveau START §25 et branche indépendante** sur la base R13 code GREEN exacte ou son successeur certifié, avant toute mutation du runtime.
2. **Source §26 certifiée** : le ZIP `e1.zip` reçu dans ce fil correspond exactement au R13 courant ; tout index d'un autre SHA doit être revalidé.
3. AST au niveau des fonctions réellement sélectionnées (noms, corps identiques, fonctions globales, scopes, références à variables, ordre parser, expressions top-level non déplacées, aucune duplication de propriétaire).
4. Script externe synchrone inséré à l'emplacement validé ; rollback exact du HTML et du JS ; registre de propriétaires et pré-cache/version PWA cohérents.
5. Les contrôles Architecture/Chromium, Firefox, Tactical, autres sentinelles du vrai parcours et rollback sur **un seul SHA final** ; toute CI rouge empêche le checkpoint GREEN et tout merge.
6. Test manuel mobile des parcours impactés et tests sauvegarde/reprise séparés de la certification automatisée. `main` ne bouge pas pendant l'audit.

## 7. Résultat du chantier de ce jour

**Audit exact réalisé et documenté.** Il s'agit d'un jalon **documentaire** ; zéro changement de code de jeu, aucune réussite CI nouvelle prétendue et aucun checkpoint GREEN du chantier de code suivant. Prochain travail substantiel : prouver une sélection mono-propriétaire suffisamment large et réversible, puis seulement ouvrir l'extraction correspondante. L'audit est basé sur les octets du R13 attestés, non sur une copie reconstruite hypothétique.
