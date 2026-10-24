# GenSrpG — Point de reprise LIVE / Phase 12 D4 (13 octobre 2026)

**État actuel : extraction physique D4 publiée et testée, en attente du triple GREEN. Aucun checkpoint final D4 créé.**

## Références obligatoires

- Dernier SHA triple-CI GREEN : `9fa3729d0ae4f3531d53221a9d1021277a1c7382` (Architecture/Chromium [38463775565](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38463775565), Firefox [38463775532](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38463775532), Tactical [38463775527](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38463775527)).
- Checkpoint précédent D3 GREEN : `checkpoint/gensrpg-phase12-dungeon-mj72-d3-green-2026-10-13` sur `2ec9e6dc5f13e9ea19234f6167641f6ccfd61dbb`.
- Checkpoint **de départ D4** (§25) : `checkpoint/gensrpg-start-phase12-dungeon-core200-d4-extraction-2026-10-13` sur `9fa3729d0ae4f3531d53221a9d1021277a1c7382`.
- Branche **unique D4** : `work/gensrpg-phase12-dungeon-core200-d4-extraction-2026-10-13`.
- Source **§26 certifiée** : ZIP utilisateur `a4.zip` entrée `index.html(5).txt`, 7 836 124 octets, blob Git `972f0e0be12fac14427853fbcd7abe5233eb5a8c`; identique au fichier sur SHA de départ, sans téléchargement massif GitHub.
- Propriétaire ciblé : `dungeonCore200Rebuild` (`docs/GENSRPG_PHASE2_INLINE_OWNERS.json`, `primaryDomain=dungeon`, statut active, aucun `crossDomains`). IIFE autosuffisante, Core 2.00 rebuild/entrée Dungeon.
- Extraction prévue : JS d'origine **55 842 octets**, blob `5649ae0af69064dde72e6ea28b8dbefd105cb527`, vers `assets/gensrpg/dungeon/core200-rebuild-v1.js`, contenu inchangé. Remplacer uniquement son tag inline par `<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>` au même endroit et conserver script classique synchrone.
- Index après D4 attendu : **7 780 333 octets**, blob `ca15dd7b483963d7bd0767b7b5baca915d17ec43` (55 791 octets nets retirés).
- **Risques protégés :** intercepteur de lancement Dungeon, ordre de chargement, session, rechargement, Capture/Survie, Tactical, PvP non jouable, ancien graphe JS et snapshots. Aucun changement fonctionnel, aucune refonte.
- **Tests de sortie :** preuve byte-exact D4→D3→D2→D1, node JS syntax, sentinelles d'inventaire/domaine, vrai navigateur Dungeon/Survie/Capture/PvP/Tactical ; trois CI Architecture/Chromium, Firefox, Tactical SUCCESS **sur le même SHA final** avant checkpoint GREEN.
- **Invariants :** `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`, laboratoires combat/exploration intacts, 32 images historiques Survie inchangées.
- **Application D4 physique :** [workflow 38470070484](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38470070484) SUCCESS ; commit moteur `9697f21c05f3764c8d7fabffa618bd80f3395d7a`. JS + index exactement aux empreintes verrouillées ; contrôles node/rollback D4→D1, graphe JS, composition et sentinelles propriétaires PASSÉS dans le workflow. **Attendre la triple CI post-application sur un même SHA avant tout checkpoint GREEN.**
- **Sentinelles historiques :** après externalisation, inventaire combat et tests des anciens callsites Runtime 2.00 doivent lire le code depuis le nouveau propriétaire ; helper de reconstruction D4→D3 strictement limité aux tests et aux empreintes Git certifiées. Ancienne exception de protection globale limitée aux deux occurrences préexistantes et byte-verrouillée. Aucune modification du runtime.
- **Prochain acte :** CI Architecture/Chromium + Firefox + Tactical sur HEAD courant, correction ciblée seulement si échec. Ne pas commencer D5 avant D4 GREEN et nouvelle source §26.

## Historique

D1, D2, D3 GREEN. Dossier ancien point de reprise : `docs/history/GENSRPG_CURRENT_WORK_PRE_D4_2026-10-13.md`.
Consulter obligatoirement `docs/GENSRPG_CHARTE.md`, `docs/GENSRPG_CHECKPOINT_POLICY.md`, `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
