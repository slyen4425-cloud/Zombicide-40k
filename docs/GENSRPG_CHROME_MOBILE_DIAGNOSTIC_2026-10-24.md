# GenSrpG — Mode diagnostic Chrome mobile opt-in (2026-10-24)

## Origine
Incident utilisateur P0 [#161](https://github.com/slyen4425-cloud/Zombicide-40k/issues/161) : Chrome Android plante quelques secondes après ouverture de l'accueil et un premier clic, Firefox fonctionne. Antérieur à R16. Cause non établie et toujours ouverte.

## Gouvernance
- Base production `main` : `e696162108e695e682b1d52f4b70fb254aef12a9`.
- START créé **avant toute modification** : `checkpoint/gensrpg-start-chrome-mobile-diagnostic-ui-2026-10-24` au SHA exact ci-dessus.
- Lot unique branche dédiée `work/gensrpg-chrome-mobile-diagnostic-ui-2026-10-24`.
- Source `index.html` inchangée (pas d'édition GitHub ni réécriture de l'application). `service-worker.js` et les quatre modes inchangés.
- Trois fichiers auxiliaires exclusivement : `diagnostic.html`, `diagnostic-shell.js`, `diagnostic-boot.js`. Fichiers CI de test isolés.
- `main` ne doit intégrer ce lot qu'après tests réels et CI des propriétaires existants.

## Usage utilisateur
Ouvrir `https://slyen4425-cloud.github.io/Zombicide-40k/diagnostic.html` sur Chrome Android. Cliquer sur « Démarrer GenSrpG avec journal », effectuer une interaction minimum. Après un plantage, retourner **exactement à cette URL sans paramètres** (et sans vider données de site) pour copier ou exporter le journal JSON. Partager le JSON après contrôle des données.

## Sécurité
- Journal opt-in uniquement et sans réseau d'analyse : aucune transmission automatique.
- Clé unique localStorage `gensrpg_mobile_diag_v1` ; max 120 entrées / ~45 Ko. Effacement via un bouton dédié ne supprime **pas** les sauvegardes.
- Événements : démarrage, erreurs JS / rejet de promesses / erreurs ressources, clics/touches (tag, id et classe seulement), tâches longues, mesure des frames, taille du DOM et mémoire JS si disponible, état de visibilité et sortie de page.
- Ne collecte ni valeurs de formulaires, ni identifiants, ni contenu des sauvegardes, ni cookies. Les messages d'erreur éventuellement sensibles doivent être inspectés avant partage.
- Si Chrome ou Android plante brutalement, le script peut être incapable de sauver le dernier événement : « fin non confirmée » n'est pas une preuve de crash.

## Limite expérimentale
Le lanceur lit le vrai `index.html` par `fetch` no-store et le réécrit **dans le document de diagnostic** avec `<base>` et le script logger injecté avant le premier runtime. Les règles du jeu ne sont pas modifiées, mais le chemin de chargement, l'adresse visible et les événements de navigation sont légèrement différents. Un crash absent dans ce mode ne prouve pas que `main/index.html` soit stable ; un crash présent permet d'obtenir un premier journal, à compléter par les journaux système Android si nécessaire.

## Gate
Sentinelle `tests/gens_chromium_diagnostic_journal_browser_20261024.cjs` : composition réelle dans Chromium et Firefox, logger chargé, touche enregistrée, retour à l'écran rapport, conservation d'un marqueur de sauvegarde de test, export. CI générale inchangée ; Merge uniquement après succès et revue.

