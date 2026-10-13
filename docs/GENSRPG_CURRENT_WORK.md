# CHANTIER ACTIF — PHASE 12 / D2 : Dungeon Core051 Exploration Polish (13 octobre 2026)

- **Point de départ GREEN certifié :** `11813ebc8d40ba976041f0be78d698cf2314b2dc` sur la branche D1 après correction documentaire ; triple CI SUCCESS sur ce SHA : Architecture/Chromium [38423704976](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38423704976), Firefox [38423704901](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38423704901), Tactical [38423704934](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38423704934).
- **Checkpoint initial §25 :** `checkpoint/gensrpg-start-phase12-dungeon-core051-extraction-2026-10-13` sur `11813ebc8d40ba976041f0be78d698cf2314b2dc`.
- **Branche unique D2 :** `work/gensrpg-phase12-dungeon-core051-extraction-2026-10-13`. Aucun travail D2 sur la branche D1, `main`, les laboratoires ou les images historiques.
- **Source certifiée §26 :** ZIP utilisateur `a3.zip`, contenant 7 911 489 octets ; Git blob `2921ebadacf6f660e815d9ff7712e44cd765fbdd` exactement conforme au SHA de départ. Le nom ZIP interne est `index.html(3).txt` ; contenu intégral certifié.
- **Périmètre :** déplacer sans édition de code l'IIFE du bloc `<script id="dungeonCore051ExplorationPolish">` (~47 962 octets) vers `assets/gensrpg/dungeon/core051-exploration-polish-v1.js` ; conserver son ordre de chargement synchrone, ses autorités `dc051*`, ses interactions Dungeon et son comportement. Propriétaire identifié : Dungeon, sans domaine croisé dans `docs/GENSRPG_PHASE2_INLINE_OWNERS.json`.
- **Fonctions protégées :** navigation Shell, services Core, Survie, Capture, PvP non jouable, Tactical, sauvegardes, gameplay Dungeon, PWA et assets. Aucune règle métier ou wrapper global modifié ; pas de doublon inline/externe.
- **Risque :** tests historiques lisant inline Core051 et dépendances JS à l'ordre parser ; les tests doivent suivre la source externe réelle, sans affaiblir les sentinelles. D1 doit rester reconstructible byte-exact depuis D2.
- **Validation obligatoire :** script `--apply/--verify` à empreintes verrouillées ; compilation JS ; sentinelles propriétaire/graphe et rollback D1+D2 ; vrais tests navigateur Dungeon, Survie, Capture, PvP, Tactical ; CI Architecture/Chromium, Firefox, Tactical SUCCESS au **même SHA final** avant checkpoint D2 GREEN.
- **État :** checkpoint/branche D2 créés ; extraction non encore appliquée ; prochain acte : préparer le workflow contrôlé depuis la source certifiée, publier sur cette seule branche et analyser les trois CI.

---

# GenSrpG — Point de reprise LIVE

Mise à jour : 13 octobre 2026. Cette page résume le chantier courant ; les anciennes notes exhaustives sont conservées sans perte dans `docs/history/GENSRPG_CURRENT_WORK_HISTORY_PRE_D1_2026-10-13.md` (Git blob `a2e6567ec28d2a54754129515de24722228d62e3`).

## Dernier jalon GREEN — Phase 12 / D1 Dungeon Core01

- **Checkpoint GREEN** : `checkpoint/gensrpg-phase12-dungeon-core01-d1-green-2026-10-13`.
- **SHA exact testé** : `5d8d0d37982ac2987bd4c72326de28318a4687c6`.
- **Branche D1** : `work/gensrpg-phase12-dungeon-core01-extraction-2026-10-13` ; checkpoint de départ `checkpoint/gensrpg-start-phase12-dungeon-core01-extraction-2026-10-13`, base `7ef5060a72b883ecee23ddee9c381a300f8be1b9`.
- **Livraison** : bloc `gensDungeonCore01Js` extrait sans modification du code dans `assets/gensrpg/dungeon/core01-session-ui-v1.js` (22 768 octets), à la même position du parser ; `index.html` passe de 7 934 204 à 7 911 489 octets. Script de contrôle `tools/gensrpg_phase12_dungeon_core01_extract_apply.py --verify` : reconstruction byte-exact de la version précédente.
- **CI triple sur le SHA GREEN** : Architecture/Chromium [38419138287](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138287) SUCCESS ; Firefox [38419138332](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138332) SUCCESS ; Tactical [38419138470](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38419138470) SUCCESS.
- **Tests réels** : sentinelles navigateur Dungeon Save & Quit/reprise, provider Dungeon, quatre modules, et tests structurels. Les tests historiques qui cherchaient l'ancienne balise inline ont été corrigés pour charger l'exact module externe, sans changement métier. Détails : `docs/GENSRPG_PHASE12_DUNGEON_CORE01_EXTRACTION_2026-10-13.md`.
- **Documentation uniquement** : la consolidation de ce fichier après le checkpoint ne modifie pas le runtime du SHA GREEN.

## Chantier suivant — Phase 12 / D2 à sélectionner

- **État** : D1 GREEN ; **D2 non commencé**. Choisir un gros propriétaire inline autonome et mesurable, après examen de son propriétaire et de ses dépendances réelles.
- **Charte §25** : créer un checkpoint de départ D2 sur une base GREEN vérifiée, puis sa branche dédiée, avant tout changement.
- **Charte §26** : avant inspection ou édition du prochain `index.html`, résoudre le nouveau SHA exact et obtenir le ZIP de ce fichier, contrôler taille et Git blob. Ne pas réutiliser l'ancien ZIP d'avant D1.
- **Tests requis** : extraction lossless, graphe runtime, vrai chargement navigateur, Survie/Dungeon/Capture/PvP/Tactical, puis Architecture/Firefox/Tactical SUCCESS au même SHA.

## Protections permanentes

- `main` est gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Les dépôts labo combat et labo exploration sont hors périmètre ; leurs assets restent dans leurs dépôts.
- Les 32 images historiques `assets/img_*` restent en place ; aucune migration d'assets.
- Aucun gameplay PvP n'est demandé ni autorisé dans ce chantier.
- Shell possède la navigation, Core les services partagés, et Dungeon son runtime ; aucun doublon d'autorité ni modification de gameplay lors de l'extraction.
- Lire impérativement `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md` et `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md` avant de poursuivre.
