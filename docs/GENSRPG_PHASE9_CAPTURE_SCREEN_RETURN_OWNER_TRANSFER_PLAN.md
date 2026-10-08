# GenSrpG — Phase 9 — Transfert du propriétaire de retour écran Capture — 2026-10-08

## État vérifié, prérequis

- Base GREEN exacte : `1d1eede2556bbe3f76120dfb4befca262f023296`.
- Checkpoint : `checkpoint/gensrpg-phase9-capture-screen-return-ownership-preaudit-green-2026-10-08`.
- Branche de départ : `checkpoint/gensrpg-start-phase9-capture-screen-return-owner-transfer-2026-10-08`.
- Travail dédié : `work/gensrpg-phase9-capture-screen-return-owner-transfer-2026-10-08`.
- Base CI : Architecture + Browser `37806001901`, Firefox `37806001870`, Tactical Dock `37806001625` — SUCCESS.
- Production `main` : `e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.
- Source `index.html` de cette base : **8 165 794 octets, blob Git `462abc969e7ac636f8ac4ee54c0d14fe51b83e7d`**. Aucun commit après la base n’a le droit de changer le runtime avant vérification du fichier.

## Gate obligatoire : §26 de la charte

Le fichier `index.html` est requis pour consulter/modifier le corps exact de `captureFix139`. Ne pas transférer l’index de 8 Mo via l’API GitHub, et ne pas réutiliser une vieille archive non vérifiée.

**Permalink à transmettre pour téléchargement et pièce jointe :**
https://github.com/slyen4425-cloud/Zombicide-40k/blob/1d1eede2556bbe3f76120dfb4befca262f023296/index.html

À réception du fichier HTML ou d’un ZIP contenant ce fichier :
1. vérifier les 8 165 794 octets et le blob `462abc969e7ac636f8ac4ee54c0d14fe51b83e7d` ;
2. inspecter seulement `captureFix139`, le registre Shell `GensShellScreenReturnV1`, `goMenu`, `captureEnterWorld139`, et les appels essentiels ;
3. isoler le plus petit seam transférable sans dupliquer l’implémentation ni créer de wrapper global ;
4. documenter les références localisées et un inverse byte-exact avant mutation.

Si l’index exact est indisponible ou échoue la vérification : **STOP runtime** ; garder le préaudit GREEN, ne pas supposer un contenu.

## Un seul périmètre métier

**Capture** : transférer l’ownership physique du retour écran Capture, actuellement enregistré dans le bloc legacy `captureFix139`, à l’entrée/lifecycle Capture autonome selon contrat public existant. **Shell** : conserver le dispatch générique unique et sa sémantique `handled:boolean`. **Dungeon** : conserver son propre provider intact.

Réutiliser le registre public Phase 5 et l’identité canonique Capture ; ne pas implémenter un second routeur, un autre moteur de session, un autre `goMenu`, ni déplacer `captureEnterWorld139()` avant preuve que sa fermeture/capture d’état peuvent être relocalisées sans divergence.

**Invariants figés** : source de profil Capture, entrée Shell, démarrage Capture transféré, corps de règle monde/hub, sauvegardes/seed, progression, monstres, Dungeon/Tactical, Survie/PvP, éditeurs et Builder, PWA, bibliothèques d’assets et laboratoires externes.

## TDD requis après Rule 26

1. **RED** : un vrai chemin Capture actif + vieille sauvegarde Dungeon prouve que le propriétaire physique du provider de retour reste `captureFix139`; pas simplement un changement de champ JSON.
2. **GREEN** : l’unique provider `capture` est enregistré par Capture, plus par `captureFix139` ; Shell reste seul routeur, pas de `window.goMenu =` ajouté.
3. Éprouver la transition : ouvrir Capture → sélectionner dresseur/créature → démarrer → ouvrir vue secondaire → retour Hub → quitter/recharger/reprendre, sans identité/runtime Dungeon.
4. Tests de non-interférence existants : `gens_phase5_gomenu_e2e_browser_v1.test.cjs`, `gens_phase5_gomenu_survival_e2e_browser_v1.test.cjs`, `gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs`, `gens_four_module_noninterference_shell_browser_v11411.test.cjs`, `gens_dungeon_builder_visibility_browser_v11411.test.cjs`.
5. Adapter les sentinelles historiques uniquement à la propriété démontrée ; ne jamais les affaiblir pour passer la CI.
6. Tester localement puis triple CI (Architecture/Browser, Firefox, Tactical) sur SHA exact ; preview publique sur ce SHA ; validation utilisateur ciblée ; checkpoint final.

Aucun merge/deploy de `main` avant approbation spécifique.
