# GenSrpG — Phase 12 / Dungeon Tactical : premier tour réel — GREEN ciblé

**20 octobre 2026. Test automatisé du parcours réel, moteur de production strictement inchangé.** Il ne certifie ni la victoire, ni le retour Dungeon, ni le test manuel sur smartphone.

## Source, §25 et périmètre

- Dernier code GREEN avant ce chantier : `checkpoint/gensrpg-phase12-dungeon-tactical-handoff-green-2026-10-20`, SHA exact `d35a0a5fd8228863c87a2da130fb1cc46a84679d`.
- START créé **avant toute mutation** : `checkpoint/gensrpg-start-phase12-dungeon-tactical-first-turn-2026-10-20`, SHA `d35a0a5fd8228863c87a2da130fb1cc46a84679d`. Branche dédiée `work/gensrpg-phase12-dungeon-tactical-first-turn-2026-10-20`.
- `index.html` inchangé, **1 729 855 octets**, blob Git `9f35eb833a6ede4b91399854f19bb9bef59f45ab`. Aucun gros HTML lu ou modifié via GitHub ; les tests travaillent sur la source du checkout CI.
- Production `main` gelée SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`. **Zéro diff runtime**, aucun asset, service worker, laboratoire Combat/Exploration ni mode Survie/Capture/PvP touché.
- Seules additions ou modifications de ce lot : **test Playwright**, **workflow CI**, et **documentation du chantier**. Propriétaires respectés : Dungeon (déclenchement), Tactical UI/moteur (tour/IA/dégâts), Core stats/dés.

## Parcours utilisateur / preuve

- Dans une session réelle Playwright : Accueil → Aventure RPG → profil Dungeon → rechargement de famille attendu → nouvelle partie Aldren/Lyra/Brom → salle 1 → vrai squelette 5 PV marqué `dungeonRoom=1` → bouton **ENGAGER LE COMBAT** → Tactical visible, bataille réelle.
- Le bouton hérité `[data-attack]` est volontairement masqué par l'UI propriétaire **V108** ; le premier test s'y arrêtait. Le test final utilise le bouton public réellement visible **Attaquer** `[data-v108-attack-go]`, après sélection de cible. Si nécessaire, il appuie sur **Approcher** puis **Fin du tour**. Il valide les fenêtres de dés par le vrai bouton **Continuer**, sans `force:true`.
- Aucune écriture artificielle de PV/monstres/attaques/jets/IA ; les seuls réglages de reproductibilité sont les poids d'apparition ennemie appliqués via la configuration Dungeon comme dans le chantier précédent. Les résultats D100 restent aléatoires.
- Le test observe l'instance de bataille `GensRpgTacticalCombatV2Ui.getBattle()` et le journal moteur : présence d'au moins une vraie attaque héros, un tour ennemi exécuté, reprise du tour héros avec manche ≥2 et dés D100 valides. Il vérifie pour chaque combattant que **PV finaux = PV initiaux − somme des dégâts effectivement enregistrés**, bornés à 0.
- Chromium [CI finale 39491014162](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39491014162) : Aldren 14→13 PV ; squelette 5→3 PV ; deux coups de héros de 1 dégât, un coup ennemi de 1 dégât ; journal atteint **manche 3** après tours IA réels. Exemple d'un seul run, **non valeur fixée par test**.
- Firefox même CI : Aldren 14→13 PV ; squelette 5→4 PV ; IA se déplace puis attaque (1 dégât), attaque du héros (1 dégât), retour à la **manche 3**. Le scénario s'adapte à une portée initiale différente.
- `pageerror=[]` dans les deux navigateurs. Le navigateur Chromium émet quelques **404 de ressources non identifiées** et des avertissements SW bloqué délibérément par Playwright ; Firefox signale le warning antérieur `unreachable code` sur `index.html`. Ces warnings sont **distincts** du parcours testé, pas présentés comme résolus ni ignorés pour de futurs diagnostics d'assets.

## CI GREEN et checkpoint immuable

- Commit certifié `1387565eae166abb337083956e4fb6c9d62159be`.
- [GitHub Actions 39491014162](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39491014162) : **2 jobs SUCCESS** et statuts exact SHA `gensrpg/phase12/first-turn/regression` et `gensrpg/phase12/first-turn/browser` tous deux **success**.
- Le job régression passe les sentinelles historiques R10–R15, architecture, Tactical/stats/dice et prouve un **diff nul sur `index.html`, `service-worker.js`, `assets/` et propriétaires**, comparé au GREEN précédent. Le garde historique Core200 « seul fichier runtime changé » appartient exclusivement à son ancien lot et n'a pas été détourné sur le nouveau baseline : la protection du nouveau lot est l'égalité complète des fichiers runtime.
- **Checkpoint GREEN créé après CI** : `checkpoint/gensrpg-phase12-dungeon-tactical-first-turn-green-2026-10-20` sur le SHA `1387565eae166abb337083956e4fb6c9d62159be`, jamais déplacé par les commits documentaires ultérieurs.

## Ce qui n'est PAS encore validé

- Le combat **n'est pas fini** dans ce lot : victoire/défaite, résultat appliqué au Dungeon, récompenses XP/loot, fermeture de l'overlay, déblocage de la sortie, passage à la salle 2, persistance et reprise de partie restent à vérifier par un **nouveau lot indépendant** et son checkpoint START §25.
- Aucun test manuel téléphone / Pixel, PWA hors ligne ou multi-profils. Les 404 ressources devront être qualifiées séparément si un rendu visuel est affecté.
- La restructuration Phase 12 globale est toujours OUVERTE. Pas de merge ni de publication de production.

## Prochaine étape

Depuis le checkpoint GREEN ci-dessus : **scénario de fin de combat réel** (épuiser les PV du squelette au fil des tours autorisés, sans forcer les jets ; ou détecter une défaite), appliquer le résultat par l'UI, confirmer ennemis battus, sauvegarde/rechargement et reprise exploration ; contrôler le contrat Tactical → Dungeon. Déclarer séparément une éventuelle panne sans inventer une réussite.
