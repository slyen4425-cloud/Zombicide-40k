# Phase 12 — R02 / EXIT BOUNDARY — Monolithe multi-domaines

Date : 16 octobre 2026. **Préparation documentaire ; R02 NON GREEN.**

## Autorité de départ

- Projet : `slyen4425-cloud/Zombicide-40k`. Charte `docs/GENSRPG_CHARTE.md` §§1–26 et politique de checkpoints applicables.
- Dernier code GREEN : R01 au SHA exact `1b0fa3a718059242507d3e95de45033bba57ea24`, checkpoint final `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16` confirmé sur le même SHA que les trois CI SUCCESS : [Architecture/Chromium 38897048039](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897048039), [Firefox 38897047733](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047733), [Tactical 38897047747](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047747).
- Checkpoint de départ R02 créé **avant** tout changement : `checkpoint/gensrpg-start-phase12-r02-monolith-exit-scoping-2026-10-16` pointant au même SHA R01 GREEN ; branche exclusive `work/gensrpg-phase12-r02-monolith-exit-scoping-2026-10-16`.
- `main` reste figée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`. Laboratoire combat et exploration isolés. Les quatre modes, l'inventaire, les sauvegardes et le service worker doivent rester inchangés pendant l'audit.

## Source attendue selon §26

- **Fichier exact requis pour cette nouvelle étape :** [index.html du checkpoint R01 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/1b0fa3a718059242507d3e95de45033bba57ea24/index.html).
- Taille attendue **6 969 593 octets**, Git blob attendu `caf31c121d926b7b76b9bb05688fab8f2839814e`.
- Demander à l'utilisateur de **télécharger ce fichier et envoyer le ZIP** ; vérifier taille, blob, branche/checkpoint avant toute inspection détaillée. `c4.zip` correspond à la source D9 (7 703 979 octets), désormais dépassée pour R02.
- Ne pas tenter le transfert GitHub répété du gros HTML par les connecteurs.

## Périmètre borné et risques

- L'audit global post-D9 a isolé un script anonyme actif **5 364 441 octets**, avec **4 100 280 caractères `data:image`** ; environ **1,264 Mo** d'autre contenu susceptible d'inclure des propriétaires multiples.
- La sortie doit être physique **et architecturale**. Ne pas ranger arbitrairement tout le bloc sous un seul nouveau propriétaire. Conserver les contrats Shell/Core, Survie, Dungeon, Capture et fonctions d'édition/import/export/stockage.
- **Images et ressources :** identifier formats, empreintes, équivalents éventuels, usages runtime/export/sauvegarde ; conserver 32 visuels historiques Survie sans suppression automatique. Toute migration d'URL blob/data vers fichier physique exige un contrat de cache/portabilité prouvé et est une décision distincte du déplacement byte exact de JS.
- **Risques hautement prioritaires :** ordre des fonctions globales, déclarations de portée, effets pendant parsing, zones de chaîne template contenant `</script>`, références aux assets encodés, hooks de navigation, gestion des sessions/sauvegardes et service worker hors ligne.

## Étapes R02 (non exécutées)

1. Recevoir et certifier le ZIP R01 GREEN exact (§26). Pas de remplacement par une source antérieure, même reconstituable.
2. Mesurer de manière reproductible le début/fin du monolithe, ses images intégrées, les fonctions et leurs frontières réelles ; établir A1 code déplaçable tel quel, A2 données/ressources, B éventuel bootstrap minimal, C éventuellement désactivé.
3. Dessiner le graphe des dépendances et l'ordre parser ; identifier les fonctions à autorité Survie, Dungeon, Capture, Core, Shell, données éditeur et stockage ; consigner les références protégées sans refactoring opportuniste.
4. Produire des **lots physiques cohérents réellement nécessaires à EXIT**, avec rollback octet exact, preuves de non-double autorité, CI Architecture/Chromium + Firefox + Tactical sur le même SHA et checkpoint final §25 pour chacun.
5. Définir et maintenir un critère de sortie : HTML+styles+bootstrap minimal B uniquement, 0 moteur/stat/sauvegarde inline, 0 code C inutilisé, PWA et parties sauvegardées inchangées.

**Décision présente : R02 est un chantier de diagnostic. Aucune extraction n'est autorisée sans le ZIP exact et son contrôle, puis bornage individuel des responsabilités.**
