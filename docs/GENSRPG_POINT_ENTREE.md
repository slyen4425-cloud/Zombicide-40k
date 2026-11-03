# GenSrpg — Point d'entrée : charte, feuille de route et idées
> **Raccourci documentaire** — 3 novembre 2026. Ce fichier est un index, **pas** une nouvelle charte, ni une seconde source de vérité pour le suivi technique. Revenir aux documents propriétaires pour les décisions et l'état réel.

## Retrouver les documents en un clic

| Question | Référence officielle |
|---|---|
| Quelles sont les règles permanentes ? | [Charte GenSrpg](GENSRPG_CHARTE.md) |
| Quel est le travail actuellement engagé et son checkpoint ? | [CURRENT_WORK](GENSRPG_CURRENT_WORK.md) |
| Comment reprendre un chantier / quel checkpoint ? | [Politique de checkpoints](GENSRPG_CHECKPOINT_POLICY.md) |
| Où en est la restructuration architecturale ? | [Feuille de route de restructuration](GENSRPG_RESTRUCTURATION_ROADMAP.md) |
| Quelles fonctions Monster Capture V2 envisager ? | [Backlog Monster Capture V2 — issue #230](https://github.com/slyen4425-cloud/Zombicide-40k/issues/230) |
| Quelle direction visuelle pour l'accueil GenSrpg ? | [Identité visuelle — issue #231](https://github.com/slyen4425-cloud/Zombicide-40k/issues/231) |
| Où est la repasse du mode Donjon ? | [Repasse Donjon — issue #232](https://github.com/slyen4425-cloud/Zombicide-40k/issues/232) |
| Quelles idées de décors 2,5D et d'arènes ? | [Idées d'assets d'exploration et arènes](MONSTER_CAPTURE_IDEES_EXPLORATION_ARENES.md) |

## Orientations — lecture rapide, sans substituer les sources

1. **Monster Capture V2 :** finaliser le vrai raccord rencontre Exploration → Combat, le retour, la sauvegarde/reprise, et la consommation des versions officielles des laboratoires. Ces correctifs bloquants sont suivis dans [CURRENT_WORK](GENSRPG_CURRENT_WORK.md), pas ici.
2. **Monster Capture V2 :** concevoir ensuite l'onglet Aventure, la progression, la collection, le contenu et l'ergonomie selon [#230](https://github.com/slyen4425-cloud/Zombicide-40k/issues/230).
3. **Idées futures Exploration :** enrichir les maps par biomes (neige, ports, bâtiments utiles et lieux remarquables), et étudier les arènes à champion IA/joueur. **Cadrage uniquement, aucun asset ni gameplay développé** dans ce lot.
4. **GenSrpg global :** design/transition du Shell selon [#231](https://github.com/slyen4425-cloud/Zombicide-40k/issues/231). PvP jouable non encore mis en service ; ne pas le confondre avec une architecture prête.
5. **Donjon :** repasse complète du gameplay, de la persistance et des anomalies selon [#232](https://github.com/slyen4425-cloud/Zombicide-40k/issues/232), sans préjuger de l'état actuel des anciens bugs.

## Répartition des responsabilités

- [Labo Combat](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique) : créatures, animations de combat, capacités et IA de combat.
- [Labo Exploration](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-) : monde 2,5D, cartes, éditeur, assets de décor, intérieurs, rencontres et interactions.
- [GenSrpg / dépôt principal](https://github.com/slyen4425-cloud/Zombicide-40k) : identité des parties, progression, persistance, intégration et expérience globale.
- Les règles et états de champion d'arène devront être arbitrés avec l'autorité du mode Monster Capture et, pour les **duels synchrones entre humains**, le futur contrat PvP — **pas de deuxième moteur de combat**.

## Discipline de suivi

Tout nouveau concept est noté séparément des correctifs en cours. La charte reste seule normative ; la roadmap de restructuration reste historique et architecturale ; CURRENT_WORK indique le vrai travail actif ; les tickets et idées servent de backlog. Ne pas déclarer une fonction implémentée, publiée, ou GREEN sur la seule présence de cette page.
