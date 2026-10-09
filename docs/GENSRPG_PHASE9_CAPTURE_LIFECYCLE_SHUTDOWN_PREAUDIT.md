# GenSrpG — Phase 9 — Préadit fermeture autonome Capture

Date : 2026-10-09. **Aucun runtime modifié.**

## Gouvernance

- Dernier checkpoint GREEN fonctionnel : `checkpoint/gensrpg-phase9-capture-screen-return-owner-transfer-green-2026-10-08` à `8b33eddbc8e57453e7cf5159c07e04762aa64827`.
- Triple CI du GREEN : Architecture+Browser `37838853571`, Firefox `37838853606`, Tactical `37838853693` — SUCCESS.
- Validation mobile utilisateur du 8 octobre : « Ok tout fonctionne parfaitement » après test ciblé du retour/reprise Capture et Builder Dungeon.
- Départ dédié : `checkpoint/gensrpg-start-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09` à `8b33eddbc8e57453e7cf5159c07e04762aa64827`.
- Branche de travail : `work/gensrpg-phase9-capture-lifecycle-shutdown-preaudit-2026-10-09`.
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Question et observation

La Phase 9 exige que Capture puisse **fonctionner et se fermer comme module autonome**. Retour d'écran vers le Hub et arrêt de session sont deux opérations différentes. Le retour Capture testé et validé ne doit pas être refait.

Le code public actuel établit :
- `GensCaptureV1` expose `install`, `isProfile`, `startModuleSession`, `status`, mais pas `dispose` ni d'orchestration de fermeture ;
- `GensCaptureSessionStartV1.dispose()` efface ses bindings et le flag `installed` ;
- `GensCaptureScreenReturnV1.dispose()` efface ses bindings et devient inerte pour le provider déjà enregistré auprès du Shell ;
- le Shell garde la navigation générique ; ses contrats publics `startModuleSession` et `returnToPrimaryView` ne définissent pas de clôture de session ;
- `captureEnterWorld139` reste dans le bloc historique, mais son rendu est hors périmètre du présent lot.

**Ceci est une dette d'ownership à caractériser, pas une panne démontrée.** L'ancienne UI peut déjà arrêter/reprendre correctement une session. Ne pas créer de second service de fermeture par hypothèse.

## Suite limitée après CI du préaudit

1. À partir du vrai écran Capture, caractériser le parcours quitter/fermer, changement d'univers, retour Capture et reprise (données et overlays).
2. Inspecter les définitions et appels historiques concernés sur le `index.html` **exact**, pas par extraction GitHub du gros fichier.
3. Identifier l'autorité actuelle (Shell, Capture ou sauvegarde Core), séparer *retour écran / arrêt de session / sauvegarde / démontage UI*.
4. Sélectionner un seul seam, établir RED TDD, préserver l'unicité des propriétaires, rétrocompatibilité, catalogues et état persistant.
5. Après extraction, vérifier les E2E Capture, Dungeon Builder, Survie, PvP et Tactical ; triple CI et validation smartphone avant checkpoint runtime.

## Règle 26

Le dernier fichier utilisateur `indexH.txt` est **antérieur au GREEN courant** (8 165 794 octets / blob `462abc969e7ac636f8ac4ee54c0d14fe51b83e7d`). Il ne suffit pas pour la prochaine inspection.

Nouveau fichier source à fournir lors du lot runtime :
- permalink https://github.com/slyen4425-cloud/Zombicide-40k/blob/8b33eddbc8e57453e7cf5159c07e04762aa64827/index.html
- taille attendue 8 165 823 octets ;
- blob Git `26421e0347305437fe2b1dc149b3e4fb8b3761bd`.

Ne pas inspecter/patcher le corps inline avant vérification de ce fichier exact.

## Limites du préaudit

Fichiers : ce rapport, une sentinelle VM sur **trois modules externes** (pas sur `index.html`), son étape Architecture, `GENSRPG_CURRENT_WORK.md`.
Pas de nouvelle autorité, routeur, timer, observer, changement de profil, moteur, état, sauvegarde, PWA, labo ou `main`.

Le résultat attendu est un état technique GREEN documentaire ; la fermeture de session **ne sera pas déclarée terminée** par cette seule sentinelle.
