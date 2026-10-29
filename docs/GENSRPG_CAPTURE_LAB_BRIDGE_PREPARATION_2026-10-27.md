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

## Mise à jour continue du labo — autorité unique

Le seul point d'accueil est `lab-ownership-port-v1.js`. Un fournisseur annonce `protocol`, `version` et `capabilities`. Capture refuse un second fournisseur concurrent, interdit le remplacement pendant un combat ou une édition et exige le cycle de vie explicite. Les évolutions du laboratoire passent par un adaptateur unique, une matrice de compatibilité et des tests avant activation. Le contrat `battle-bridge-contract-v1.js` est uniquement un validateur de données, pas un second orchestrateur.

Le prototype concurrent `battle-provider-slot-v1.js` a été retiré avant activation pour éliminer une double autorité potentielle. Aucun branchement réel, migration de sauvegarde ou basculement de combat n'est effectué dans ce lot.

## Décision propriétaire validée le 27 octobre

Le Labo Combat doit être l'autorité du déclenchement et de l'exécution des combats Monster Capture, et de l'édition des créatures. Capture conserve le contexte de rencontre dans l'exploration, l'identité des créatures, les sauvegardes et l'application des résultats; il délègue les commandes de combat et d'édition via un port versionné. Le port `lab-ownership-port-v1.js` formalise `startEncounter`, `stopEncounter`, `editCreature`, `closeEditor` et le cycle de vie du fournisseur. Il est inerte tant qu'aucun adaptateur n'est branché. Une mise à jour du laboratoire doit être validée par protocole, version, capacités, tests et preview avant remplacement de l'adaptateur. **Aucun branchement réel ni basculement du gameplay n'a encore été réalisé.**

## Politique d'évolution sans rustine

- Un seul port Capture possède la liaison. Le laboratoire expose un fournisseur, jamais un second runtime Capture.
- `protocol` identifie le contrat majeur; `version` est une version sémantique valide; `capabilities` est une liste sans doublon. Les fonctions sont validées avant installation.
- Une fonctionnalité nouvelle du laboratoire est optionnelle et annoncée par une capacité explicite. Capture ne l'appelle que si elle est disponible.
- Une version incompatible ne s'installe pas. Aucun remplacement à chaud pendant une session de combat ou d'éditeur. Pour évoluer: terminer la session, désinstaller le fournisseur, puis installer le nouveau fournisseur validé.
- La validation CI spécifique est verte; les suites générales architecture et armure V114.11 échouent sur cette branche. Aucun GREEN global, aucune fusion tant que les causes ne sont pas identifiées et corrigées à la source.
