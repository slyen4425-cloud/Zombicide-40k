# Capture V2 — visibilité du Sac et du Shell pendant le combat (11 novembre 2026)

- **START** source PR #383 à e6e8c5fe2c1053736dc49052fb5cf203aa25eb89; branche unique `work/gensrpg-capture-hud-reconcile-2026-11-11`.
- **Propriétaires** : Exploration signale l'overlay natif; GenSRPG Capture masque son seul Sac/Équipe; le Shell masque son seul bouton Retour. Pas de nouveau moteur, catalogue ou sauvegarde.
- **Contrat** : message `gensrpg.exploration.combat.visibility.v1` validé par origine, iframe, sessionId, encounterId et booléen. Aucune information de PV ne transite par ce message.
- **Correctif** : la fiche joueur ne peut pas s'ouvrir pendant un combat, réapparaît après sortie, annulation, Game Over et retour titre; préserver les boutons natifs du combat.
- **Méthode** : transplantation ciblée de l'ancienne PR #361 sur le sommet #383 sans réintroduire d'anciens fichiers, pins ou règles de marchand; aucun fichier PNG modifié.
- **Gates** : tests Node, navigateur PC et paysage mobile, CI source, certification des dépendances #379/#380/#382/#383, publication unique sur main et validation HTTPS avant statut GREEN.
- **Statut** : candidat, non publié.
