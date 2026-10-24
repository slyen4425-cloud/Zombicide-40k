# Phase 12 R08 — Bibliothèque partagée de capacités et compétences

**18 octobre 2026 — chantier actif, application contrôlée NON GREEN avant tests.**

Dernier code GREEN et validation manuelle R07 sur SHA 17a1def7a514478fec08025f354a4a1b17aa14f5. Checkpoint START §25 : checkpoint/gensrpg-start-phase12-r08-shared-ability-skill-catalog-2026-10-18 créé sur ce SHA ; branche work/gensrpg-phase12-r08-shared-ability-skill-catalog-2026-10-18, distincte.

Source exacte §26 : ZIP utilisateur d6.zip, un fichier index.html(4).txt, 2 217 805 octets et Git blob aca31c540d61c81e1504d3b915b034b372103b5b.

Extraction unique et mono-propriétaire Builders : **57 fonctions de catalogue, bibliothèque et éditeur des capacités/compétences** (86 271 octets de source, blob 9b0d61d7aa0dc833a005f9abf2902c6715224313), sans toucher aux comportements, aux effets métiers ni aux données sauvegardées. Le seul effet d'initialisation identifié au milieu du segment est un écouteur Escape de 189 octets : il reste **à la position originale** dans le script anonyme pour éviter tout changement d'ordre d'événements. Nouveau JS builders/legacy-ability-skill-catalog-v1.js **86 082 octets**, blob f3f650679799d1e6c8e6b6bcd76a6a0963a02f66 ; script classique synchrone juste avant le deuxième gros script anonyme. Nouvel index projeté 2 131 805 octets, blob 6eeed45a0a12085c1b107ee6c24b49040277ca54 (–86 000).

Contrôles stricts de source et rollback bit pour bit, cache PWA/owner-map sur branche dédiée. Après application : raccorder les sentinelles historiques, tester initialisation et bibliothèques dans vrais navigateurs, passer source/Firefox/Tactical/Architecture+Chromium sur un seul SHA, créer checkpoint GREEN puis proposer preview et test utilisateur. Main gelée, laboratoires hors périmètre. Ne pas déclarer FIN Phase 12.
