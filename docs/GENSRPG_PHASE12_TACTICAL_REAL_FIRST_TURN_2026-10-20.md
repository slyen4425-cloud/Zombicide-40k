# GenSrpG — Phase 12 / véritable premier tour Tactical + déplacement IA : GREEN ciblé

**20 octobre 2026. Deux navigateurs, chemin complet jusqu'au retour au héros après une action IA. Aucune modification du runtime dans ce chantier.**

## Gouvernance

- Dernier correctif de code GREEN : `checkpoint/gensrpg-phase12-dungeon-tactical-handoff-green-2026-10-20` sur SHA **`d35a0a5fd8228863c87a2da130fb1cc46a84679d`**, CI [39468714263](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39468714263) SUCCESS. Ce checkpoint contient la correction Core200 de salle et le chargement canonique Core Stats au moment de l'activation Tactical.
- §25 START de cette sentinelle créé **avant toute modification** : `checkpoint/gensrpg-start-phase12-tactical-real-first-turn-2026-10-20`, au SHA **`d35a0a5fd8228863c87a2da130fb1cc46a84679d`**, et branche distincte `work/gensrpg-phase12-tactical-real-first-turn-2026-10-20` à la même base.
- §26 : `index.html` identique au blob R15 **`9f35eb833a6ede4b91399854f19bb9bef59f45ab`**, **1 729 855 octets**, [permalien SHA](https://github.com/slyen4425-cloud/Zombicide-40k/blob/95740b6353a116c7e66b5d1095338b81d8b223bf/index.html). Pas de lecture du gros HTML par connecteur.
- Ce chantier n'ajoute que `tests/gensrpg_phase12_tactical_real_first_turn_browser.cjs`, `.github/workflows/gensrpg-phase12-tactical-real-first-turn.yml` et documentation. **Zéro changement** de `index.html`, Core200, entrée Tactical, moteurs, stats, SW, assets, données de jeu, labos ou production.

## Scénario effectivement parcouru via UI

1. Depuis le profil Survie au démarrage, choisir Aventure RPG → Dungeon ; le rechargement `forceReload155` est suivi, puis Dungeon est sélectionné depuis l'accueil.
2. Démarrer le vrai profil avec **Aldren, Lyra, Brom**, salle initiale zéro, entrer en salle 1 avec le bouton de l'application. Configuration via l'API d'éditeur des poids de salle afin d'obtenir une rencontre de type ennemi, mais **pas d'injection d'ennemi, HP, jet, combat ou IA**.
3. Le vrai générateur crée un squelette `dng_skeleton` 5 PV `dungeonRoom=1`. Le test suit **l'une des deux entrées légitimes** : détection automatique V113 si l'ennemi voit Aldren, sinon clic sur **ENGAGER LE COMBAT**. Aucune action n'est exécutée à travers un overlay actif.
4. L'UI Tactical ouvre une bataille avec exactement **un héros entré en salle** et **un ennemi vivant**. Le héros Aldren possède **14 PV**, son snapshot Core Stats `16.78.110` et **9 caractéristiques canoniques** ; les cinq services Core S3–S7 sont présents.
5. Lancer l'action via **le vrai bouton Fin du tour** de la vue Tactical. Le squelette reçoit son tour IA. Si son action est une attaque, le test attend la fin de l'animation et appuie sur le véritable bouton **Continuer** du résultat de dés ; si l'IA ne fait que se déplacer, aucune confirmation n'est requise. La commande moteur directe `aiStep` ou `endTurn` n'est jamais appelée par le test.
6. Relever les nouveaux événements du journal Tactical ; vérifier le passage par le tour de l'ennemi puis **le retour au héros ou la fin de combat**, l'absence de `pageerror` et la salle Dungeon inchangée.

## Résultat certifié

- GitHub Actions **[39470584368](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39470584368)**, SHA **`e0489a79217ac819d0f254399873d3d286e490b2`**, contexte `gensrpg/phase12/tactical-real-first-turn` **SUCCESS**, suite Node historique R10–R15, architecture/guards et vrai Playwright **Chromium + Firefox SUCCESS sur un seul SHA**.
- **Chromium :** statut Tactical actif, Aldren 14 PV, squelette 5 PV ; clic Fin du tour → événement de tour ennemi → **`move` réel du squelette** → événement de tour Aldren ; round **1→2** ; zéro `pageerror` ; salle **1** conservée.
- **Firefox :** mêmes vérifications et **même séquence d'événements**, tour 1→2 et squelette déplacé ; zéro `pageerror`.
- Un premier run révélait qu'une attaque ennemie peut mettre la simulation en attente du vrai bouton de confirmation des dés. Le test reconnaît cette interaction normale et ne l'ignore pas ; la variante validée finale a observé un **déplacement IA**, pas une attaque. Un autre run rencontrait une entrée automatique V113 avant le clic manuel ; le test respecte désormais cette voie existante au lieu de cliquer à travers l'overlay.
- **Checkpoint GREEN** `checkpoint/gensrpg-phase12-tactical-real-first-turn-green-2026-10-20` créé seulement après le succès exact du SHA **`e0489a79217ac819d0f254399873d3d286e490b2`**, HEAD et production revérifiés, **aucun fichier runtime modifié**.

## Limites et prochaine priorité

**Certifié** : vrai spawn Dungeon en salle active, vrai routeur Tactical, Core Stats canonique, affichage bataille, une entrée valide (manuel/détection), commande Fin du tour et mouvement de l'ennemi suivi du retour au héros. **Non certifié** : réussite d'une attaque avec dés validés et réduction des PV, vaincre ou perdre, retour de résultat et récompenses, sauvegarde/reprise en cours de combat, interactions sur smartphone, autre mode en jeu réel. Ces sujets requièrent des scénarios séparés et une preuve navigateur si modifiés.

Ne pas ouvrir un lot de suppression des vieilles couches sans inventaire de leurs effets, ni déclarer la Phase 12 globale terminée : `main` reste gelée au SHA **`e8681f9823573ced8aec59c8ddc47a72b02bc663`**, aucun merge/Pages, aucune intervention sur les laboratoires Combat/Exploration et les 32 images Survie.

Charte : `docs/GENSRPG_CHARTE.md` §§1–5, 12–26, `docs/GENSRPG_CHECKPOINT_POLICY.md`.
