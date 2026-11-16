# GenSRPG — Démarrage direct sur l'accueil central, sans manipulation (16 novembre 2026)

## Retour de test utilisateur
Après #498, l'icône Android ouvre une page qui affiche un petit lien en bas (« GenSRPG : accueil / Dungeon »). Le Builder est disponible seulement après un clic sur ce lien. Le fonctionnement demandé est **icône GenSRPG → accueil unique GenSRPG → sélection explicite du module**, avec quatre choix : Monster InvoC (Capture), Dungeon, Survie, PvP, puis leurs éditeurs.

## Cause et périmètre vérifiés
Le lien cité est injecté par `assets/gensrpg/shell/capture-v2-from-main-entry-v1.js` dans la PWA isolée `/preview/capture-v2-pr225/`. Les deux PWAs ont auparavant partagé l'apparence de lancement. Le manifeste d'une installation ancienne peut encore lancer directement la preview, même après son renommage dans #498. Les moteurs ne sont pas en cause.

## Intervention limitée au propriétaire Shell
- Ancienne icône autonome lançant la preview directement : activation automatique du **lien de navigation Shell existant** vers le **root officiel** `/Zombicide-40k/`, avant le bootstrap des modules, sans demander de cliquer le lien inférieur.
- Depuis le root, le choix explicite de Capture (`?entry=gensrpg-main`) reste dans Capture. Un lien direct non installé vers la preview reste fonctionnel ; `?launch=capture` conserve la visite autonome explicitement choisie.
- La source de l'accueil root et les moteurs, paramètres, sauvegardes, IndexedDB, service workers et manifestes d'identité sont strictement inchangés. Aucune deuxième autorité de navigation. Le publisher Pages existant place simplement l'unique script de liaison dans le `head` du document compilé avant les scripts de la preview.
- Contrôles : test du déclenchement autonome / navigation volontaire / root, test de présence en `head` sur le vrai `_site`, scénario Chromium mobile paysage sans clic. Gardes de CI, poids <900 Mio, Browser, Architecture, Pages et HTTPS avant toute publication.

## Traçabilité
Départ `main@51a6aff387cebd599e2cf57a2b42b7971d183be0` après #498 ; checkpoint `checkpoint/gensrpg-before-installed-preview-root-launch-20261116` ; branche `work/gensrpg-installed-preview-root-launch-20261116`.

Limite : le test navigateur simule l'affichage autonome Chromium ; la certification sur le raccourci Android déjà installé nécessite un essai réel de l'utilisateur. Il ne faut jamais prétendre que l'icône Android a été testée à distance.

## Gate d'architecture (validation TDD)
Au premier SHA de test, `tests/gens_architecture_global_side_effect_guard.test.cjs` a correctement rejeté une mutation directe de `location.replace` dans un module Shell. Ce code a été retiré ; la liaison automatique réutilise désormais un lien d'accueil `<a href>` créé par le même propriétaire Shell que le lien de retour déjà validé. Les règles de l'architecture ne sont ni modifiées ni ignorées. Tous les checks doivent repasser sur le nouveau SHA avant merge.
