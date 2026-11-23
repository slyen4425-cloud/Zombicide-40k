# Capture V2 — adoption des escaliers ajustables, 23/11/2026

- START : source Capture officielle immuable `fd3c0a84e8b2a9df75c02ab59daa1b9190603e8a`, sans modification de moteur.
- Exploration propriétaire `main@35dbe475e53abcc7ba8f4c5ee3be972390232584`, PR #540 fusionnée (tracé pied → sommet sur le même WorldObject).
- CI Exploration à certifier sur le SHA post-merge : https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/45266578823
- Combat conservé `main@0543103891b5777fff108cb12a1ae55a519544d9` ; fond/son/pinceau/portails/marchands inchangés.
- Transport : unique source-pins-v1.json, aucune copie d'escalier ni de règle de collision, pas de modification des sauvegardes existantes.
- PWA publisher à mettre à jour séparément après CI source + CI fournisseur GREEN, puis contrôle Pages HTTPS/Android.
