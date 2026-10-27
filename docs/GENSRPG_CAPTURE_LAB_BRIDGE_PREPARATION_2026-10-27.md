# Capture / Labo Combat — préparation 27 octobre 2026

## Autorité
Capture conserve les équipes, règles, résultats, sauvegardes et navigation. Le laboratoire reste autonome. Aucun moteur de production n'est remplacé.

## Contrat provisoire
Le fichier assets/gensrpg/capture/battle-bridge-contract-v1.js expose snapshot(input) et result(input,original). Validation de deux camps, IDs uniques, PV bornés et résultat complet. Aucune écriture, aucun accès DOM, aucun chargement en production.

## À préparer ensuite
1. Cartographier les APIs réelles du labo et du combat Capture.
2. Enrichir le DTO : capacités, états, réserve, timers, sprites, effets et énergie.
3. Créer un adaptateur optionnel, sans dépendance inverse du laboratoire.
4. Tester le retour de résultat et les sauvegardes.
5. Preview smartphone paysage, validation utilisateur et rollback avant activation.

## Test
node tests/gens_capture_lab_bridge_contract.test.cjs

## Mise à jour continue du labo

Un emplacement Capture versionné (battle-provider-slot-v1.js) accueille un fournisseur externe uniquement par register(provider). Le fournisseur annonce protocol=1, sa version et ses capabilities. Capture refuse un protocole incompatible, une capacité absente ou un second fournisseur concurrent. begin(snapshot, requiredCapabilities) utilise le contrat de données, crée une session, puis start. end() garantit stop et dispose ; unregister() interdit le retrait d'un moteur encore actif. Aucun chargement automatique : l'ancien combat reste actif.

Chaque nouvelle version du labo pourra être intégrée par un adaptateur de fournisseur séparé, avec matrice de capacités et tests. Les données de sauvegarde ne stockeront pas la version du moteur comme source de vérité. Avant activation : tests 1v1/2v2, états, ciblage, réserves, animations, export/import et smartphone paysage. Les mises à jour incompatibles devront passer par un nouveau protocole, jamais par une mutation silencieuse.

Test supplémentaire : node tests/gens_capture_battle_provider_slot.test.cjs.

## Décision propriétaire validée le 27 octobre

Le Labo Combat doit être l'autorité du déclenchement et de l'exécution des combats Monster Capture, et de l'édition des créatures. Capture conserve le contexte de rencontre dans l'exploration, l'identité des créatures, les sauvegardes et l'application des résultats; il délègue les commandes de combat et d'édition via un port versionné. Le port `lab-ownership-port-v1.js` formalise `startEncounter`, `stopEncounter`, `editCreature`, `closeEditor` et le cycle de vie du fournisseur. Il est inerte tant qu'aucun adaptateur n'est branché. Une mise à jour du laboratoire doit être validée par protocole, version, capacités, tests et preview avant remplacement de l'adaptateur. **Aucun branchement réel ni basculement du gameplay n'a encore été réalisé.**
