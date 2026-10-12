# GenSrpG — Phase 10 S4 : clôture architecturale PvP, sans gameplay

Date : 12 octobre 2026.

## Charte, périmètre et base

- Base GREEN vérifiée par trois CI : `785c11e8d2b37f5fffb674aa093ce882e77377fa` ; dernier checkpoint S3 `aebb542b7ad1c3150edbcb451a5ec2c1a9d17810`.
- Checkpoint de départ §25 : `checkpoint/gensrpg-start-phase10-pvp-architectural-closure-s4-2026-10-12`. Branche unique : `work/gensrpg-phase10-pvp-architectural-closure-s4-2026-10-12`.
- Périmètre strict : contrats d'autorité PvP, sentinelle de sortie Phase 10, CI et documentation. Aucun changement de code runtime ni du lourd `index.html`.
- Autorités conservées : Shell pour navigation et enregistrement de modules ; PvP pour session/préparation ; autres modules et Core inchangés.
- Objectif utilisateur : restructuration seulement. **Aucune mécanique, formule, combat ou partie Duel/PvP n'est prévue maintenant.**

## Dette réelle corrigée

Le contrat `assets/gensrpg/pvp/module-contract-v1.json` datait de la Phase 3 et disait « contract-only-not-loaded ». Cela était incompatible avec la composition explicite et effective de S2, où trois scripts PvP sont chargés et le provider enregistré auprès du Shell. Le contrat est mis à jour, sans toucher aux contrats historiques S0/S1 ni activer le composant privé S3.

Les deux notions sont séparées :

1. **Raccordement architectural : réel et testé.** S0 session ; S1 provider ; S2 composition explicite au Shell.
2. **Disponibilité fonctionnelle : non livrée et non demandée.** Pas de combat, pas de règles, pas de profil PvP persistant, pas de formulaire S3 monté depuis la page publique ; la carte « PVP — À VENIR » reste intentionnelle.

La sentinelle `tests/gens_phase10_pvp_architectural_exit_s4.test.cjs` vérifie le vrai `index.html` depuis la CI sans le modifier : ordre/présence unique des scripts PvP, connexion explicite avant autorité finale Shell, maintien du placeholder, UI S3 non chargée, stub Phase 3 non chargé, seuls les globals PvP déclarés attribués par les fichiers, aucune autorité étrangère remplacée, contrat d'architecture aligné, et gameplay exclu.

## Critère final de clôture architecturale

- S0, S1, S2, S3 restent GREEN et tests correspondants exécutés.
- Sentinelle S4 GREEN sur le vrai graphe de chargement.
- Test navigateur existant de non-interférence des **quatre familles** et test du formulaire isolé mobile/PC GREEN.
- Triple CI Architecture/Chromium, Firefox et Tactical **sur le même SHA**.
- Branche GREEN et documentation de reprise §25 créées.
- `main` reste gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Aucune livraison de gameplay sous prétexte de terminer Phase 10 ; ne pas demander de fichier `index.html` puisque son contenu exact n'est ni inspecté ni modifié localement pour ce lot.

Cette clôture valide la **séparation du module** uniquement. Les fonctionnalités Duel/PvP et une éventuelle interface joueur nécessiteront une décision et un chantier ultérieurs. Phase 11 n'est pas commencée par S4.
