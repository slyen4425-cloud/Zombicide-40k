# GenSrpG — Phase 4 Core Stats — S5 Providers de modificateurs

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s5-modifier-providers-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s5-modifier-providers-2026-09-21`.
- Base exacte / dernier GREEN : `46276b1f9c946f179ea7b1fea3f5fad6420bfa66`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-stats-s4-hero-values-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Extraire uniquement le contrat pur qui transforme des résultats de providers
externes en lignes `StatModifier` déjà consommables par S3.

Nouveau fichier prévu :
`assets/gensrpg/core/stats-modifier-provider-v1.js`.

Global :
`GensStatsModifierProviderV1`.

Dépendance pure :
`GensStatsNormalizationV1`.

S5 reste **inert** en production.

## Cartographie propriétaire S5

Le propriétaire canonique Stats reste :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

Sa composition historique de base appelle encore les seams propriétaires :
- `dungeonEquipmentBonus` ;
- `dungeonSkillEffectTotal` ;
- `dungeonChallengeDebuffTotal067`.

### Equipment

Le seam `dungeonEquipmentBonus` naît dans le runtime Dungeon historique puis est
enrichi par plusieurs propriétaires légitimes :
- bonus d'items du runtime historique ;
- `assets/dungeon/dungeon-core-316.js` ajoute les bonus de sets ;
- `assets/gensrpg/gens-equipment-stat-cleanup-1678102.js` ajoute les bonus
  d'évolution et possède l'invalidation de son cache local ;
- `assets/gensrpg/gens-mobile-combat-performance-16781022.js` cache le résultat
  final du seam pendant les bursts combat.

S5 ne doit reproduire aucune de ces règles.
Inventory/Equipment reste l'unique propriétaire de la valeur produite.

### Talents

Le pré-audit revalidé S1 identifie `dungeonSkillEffectTotal` comme seam inline
du système Talents.

Aucun propriétaire externe Talent distinct n'est déclaré dans le manifeste
runtime Phase 2 courant.

S5 ne lit ni talents appris, ni état talent, ni capacités.

### Challenges

`dungeonChallengeDebuffTotal067` reste le seam runtime Challenge consommé par
Stats.

Le manifeste runtime Phase 2 courant ne déclare aucun fichier externe Challenge
comme propriétaire de ce calcul. Les lots Storage Challenge Library/History
restent uniquement propriétaires de leur transport/persistance et ne deviennent
pas moteur de malus.

S5 traite donc également ce seam comme résultat externe, sans réimplémenter son
runtime.

## Graphe réellement chargé

Pages/preview chargent :
1. `stats-normalization-v1.js` ;
2. `gens-rpg-stats-clean-167874.js` ;
3. `gens-dungeon-hero-art-repair-167874.js` ;
4. `gens-mobile-combat-performance-16781022.js`.

Le bridge Hero Art charge ensuite notamment :
- `gens-hero-editor-dynamic-167897.js` ;
- `gens-stat-upgrade-policy-167898.js` ;
- `gens-equipment-stat-cleanup-1678102.js`.

Le graphe actuel reste l'autorité.
S5 n'ajoute aucun chargement production.

## Pourquoi la règle 26 n'est pas déclenchée

Le lot S5 ne modifie et ne recopie aucun des trois seams inline.

Leur corps exact n'est pas nécessaire pour construire le contrat Core :
le module reçoit uniquement leurs résultats agrégés explicitement fournis.

Si un futur raccord doit modifier leurs callsites dans `index.html`, la règle 26
sera déclenchée à ce moment-là avec le SHA exact.

## Contrat S5

Entrée :

```text
ModifierProviderConfig {
  definitions: StatDefinition[]
  sources: ModifierSource[]
}

ModifierSource {
  source: string
  values: Record<string, number>
  enabled?: boolean
}
```

Chaque `values` contient des résultats déjà calculés par le propriétaire externe.
Le Core ne sait pas comment ces nombres ont été obtenus.

Sortie :

```text
StatModifier[] {
  id: "<source>:<target>"
  target: string canonique
  value: number
  source: string
  enabled: boolean
}
```

## Normalisation

Pour chaque source :
- source vide -> ignorée ;
- values non-objet -> ignoré ;
- cible canonisée via S2 ;
- cible inconnue des définitions -> ignorée ;
- valeur non finie -> ignorée ;
- aliases convergeant sur la même cible -> additionnés ;
- total nul -> pas de ligne ;
- enabled vaut true sauf false explicite ;
- ordre déterministe = ordre des sources puis ordre des définitions normalisées.

Le module ne détermine jamais quelles sources doivent s'appliquer à une stat.
Le futur adaptateur propriétaire fournit seulement les résultats réellement
applicables.

C'est essentiel pour conserver les distinctions historiques actuelles sans
graver dans Core des cas particuliers de stats natives.

## Frontières

S5 ne connaît pas :
- inventaire porté ;
- objets ;
- sets ;
- évolution ;
- talents ;
- challenge ;
- héros courant ;
- state ;
- profil ;
- Armor ;
- hit ;
- D100 ;
- résistances ;
- dérivées S6 ;
- Tactical.

Il ne gère aucun cache et aucune invalidation.

## TDD

Sentinelle :
`tests/gens_phase4_stats_s5_modifier_providers_parity_v1.test.cjs`.

La fixture :
1. instrumente `GensCleanRpgStats167874.baseValue()` comme oracle historique ;
2. fournit les mêmes résultats agrégés Equipment/Talent/Challenge sous forme de
   tables explicites ;
3. passe ces tables au provider S5 ;
4. passe les lignes obtenues au moteur S3 avec les valeurs héros S4 ;
5. compare `baseValue` S3 au propriétaire historique.

Cas couverts :
- plusieurs sources additives ;
- malus négatif ;
- alias de cible ;
- stat custom ;
- défense/armure alimentées explicitement sans règle spéciale dans Core ;
- mouvement sans source externe quand l'adaptateur n'en fournit aucune ;
- cible inconnue ignorée ;
- valeur non finie ignorée ;
- source désactivée ;
- absence de mutation ;
- source-agnosticité du code Core.

## RED attendu

La sentinelle et son étape Architecture sont ajoutées avant
`stats-modifier-provider-v1.js`.

Le premier run doit échouer uniquement parce que ce fichier S5 est absent.

## Critère de sortie

S5 est GREEN uniquement si :
- RED attendu observé ;
- provider pur créé ;
- parité avec le `baseValue` historique démontrée sur la fixture ;
- S3 + S4 composent avec les lignes S5 sans formule dupliquée ;
- aucun nom de système propriétaire n'est codé dans le Core ;
- aucun ID spécial de stat n'est codé dans le Core ;
- service classé Phase 4 inert ;
- graphe production inchangé ;
- Architecture + navigateur complet, Firefox et Tactical Dock GREEN sur le HEAD
  documentaire final ;
- checkpoint S5 créé.

## Suite

Après S5 GREEN :
S6 — dérivées génériques à sémantique stable.

Ne pas inclure encore application finale Défense/Armure, toucher, D100 ou
résistances.


## Résultat S5

### RED TDD observé

Commit pré-provider :
`5c8449234b829cb2a7c647b704f17c26253829ec`.

Run Architecture :
`35577545243` — FAILURE attendu.

L'échec se produit exactement à l'étape :
`Vérifier la parité des providers de modificateurs Core Stats S5`.

Cause exacte :
`ENOENT` sur
`assets/gensrpg/core/stats-modifier-provider-v1.js`.

S1, S2, raccord S2, S3 et S4 étaient GREEN avant ce RED.

### Provider pur créé

Fichier :
`assets/gensrpg/core/stats-modifier-provider-v1.js`.

Commit :
`30234d1a76c80d7331ed1fbf95d8758c1141a420`.

API :
`GensStatsModifierProviderV1.collect(config)`.

Le provider :
- reçoit uniquement definitions + sources explicites ;
- canonise les cibles via S2 ;
- ignore les cibles inconnues et valeurs non finies ;
- fusionne additivement les aliases d'une même source ;
- conserve enabled ;
- produit des lignes S3 déterministes ;
- ne mute aucune entrée ;
- ne connaît aucun système propriétaire.

### Parité démontrée

La fixture S5 utilise `GensCleanRpgStats167874.baseValue()` comme oracle.

Les résultats agrégés des seams historiques sont fournis explicitement au Core,
puis la chaîne S4 -> S5 -> S3 est comparée au moteur historique.

Valeurs verrouillées :
- force : 22 ;
- chance : 9 ;
- defense : 20 ;
- armor : 11 ;
- movement : 4.

La fixture prouve notamment :
- addition de plusieurs sources ;
- malus négatif ;
- alias `strength -> force` et `defence -> defense` ;
- stat custom ;
- source désactivée ;
- cible inconnue ignorée ;
- valeur non finie ignorée ;
- mouvement inchangé lorsqu'aucun résultat externe applicable n'est fourni.

Aucune règle spéciale de defense/armor/movement n'existe dans le provider.
Le choix des résultats applicables reste responsabilité de l'adaptateur
propriétaire.

### Graphe Phase 2

Commit :
`661ab77e8a2ef9cefaec66c71d1c61d9c899d50d`.

`stats-modifier-provider-v1.js` est classé **Phase 4 inert**.

Inventaire JS physique :
`85 -> 86`.

Le graphe production reste inchangé.
Le provider n'est chargé ni par Pages ni par `preview.html`.

### Validation GREEN technique

HEAD technique :
`661ab77e8a2ef9cefaec66c71d1c61d9c899d50d`.

Runs :
- Architecture + navigateur complet : `35577612459` — SUCCESS ;
- Firefox : `35577612420` — SUCCESS ;
- Tactical Dock : `35577612410` — SUCCESS.

Le navigateur complet valide notamment :
- Survie ;
- Fouiller + arts ;
- Dungeon après Survie ;
- Builder ;
- Config objet ;
- fiche RPG ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Capture ;
- non-interférence quatre modules ;
- murs ;
- preview ;
- resolver d'assets.

Aucun propriétaire Equipment/Talents/Challenge n'a été modifié.
Aucun `index.html`, gameplay, Tactical, stockage, UI ou formule combat n'a changé.

## Clôture documentaire

Le SHA documentaire final doit repasser Architecture + navigateur complet,
Firefox et Tactical Dock.

Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-stats-s5-modifier-providers-green-2026-09-21` ;
- ouvrir S6 depuis ce checkpoint ;
- S6 = dérivées génériques à sémantique stable ;
- ne pas inclure l'application finale Défense/Armure, toucher, D100 ou résistances.
