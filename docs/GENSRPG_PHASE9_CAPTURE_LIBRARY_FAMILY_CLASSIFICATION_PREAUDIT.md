# GenSrpG — Phase 9 — Pré-audit du classement des profils Capture dans le Shell

Date : 2026-10-06. Reprise du fil directeur après arrêt de l'ancien fil confirmé par Sylvain.

## Base et état

- Dépôt : slyen4425-cloud/Zombicide-40k.
- Base GREEN : 168578f4394fc22cb4aec517e052e94847790bd9.
- Dernier GREEN : checkpoint/gensrpg-dungeon-desktop-movement-assets-characterization-green-2026-10-06.
- Checkpoint de départ : checkpoint/gensrpg-start-phase9-capture-library-family-classification-preaudit-2026-10-06.
- Branche : work/gensrpg-phase9-capture-library-family-classification-preaudit-2026-10-06.
- main vérifiée et gelée : e8681f9823573ced8aec59c8ddc47a72b02bc663.
- index.html : 8165906 octets, blob 1e3398755beb751786d825047bc60fe1a7179d79.
- SHA-256 documenté de l'index : 0c98f5490bd0c0397458f136147ca430d047d907c7594ec0eb995d3db748c66d.
- Statut : pré-audit OUVERT ; aucun correctif runtime appliqué et aucun nouveau GREEN revendiqué.

Les trois workflows du HEAD de base sont SUCCESS : Architecture+Browser 37441136353, Firefox 37441136661, Tactical Dock 37441136680. Leur conclusion et le checkpoint final ont été vérifiés directement dans GitHub à la reprise. La Phase 8 ne doit pas être recommencée ; la Phase 9 reste en cours.

## Problème ciblé

Le journal et le signalement de Sylvain indiquent que Monster Capture apparaît encore dans la liste Survie. Le lot précédent était limité au diagnostic Dungeon PC/mobile ; cette anomalie n'a pas été corrigée dans ce lot.

Le but du présent pré-audit est de déterminer le propriétaire du classement de cette liste, puis de sélectionner une correction minimale sur preuve. Ce document ne prétend pas que la cause est déjà démontrée.

La présence de Capture dans Adventure fait partie du routage actuel couvert par les tests. Elle ne constitue pas l'autonomie de premier niveau exigée à terme par la Phase 9. Le présent lot ne doit pas modifier silencieusement ce routage stable ou créer un second système de navigation.

## Périmètre déclaré avant code

| Domaine | Décision |
| --- | --- |
| Module concerné | Shell : classement des profils et listes par famille |
| Identité Capture réutilisée | GensCaptureV1.isProfile(profile), autorité canonique existante |
| Propriétaire candidat du classement | Fonctions inline rpgProfiles(), gensFamilyForProfileId() et rendu de gensFamilyGames ; la fonction fautive précise reste à identifier |
| Autres services réutilisés | Chargement des profils, classification de contenu et stockage déjà existants |
| Mutation actuellement autorisée | Documents de reprise et de pré-audit uniquement |
| Mutation runtime | Après inspection de l'index exact, reproduction ciblée et choix du propriétaire |
| Risque inter-module | Filtrer un profil valide, changer sa famille, sélectionner un mauvais module ou modifier une sauvegarde |

Ne pas modifier : identité canonique Capture, isDungeonMode(), seeds, réglages de profil, sauvegardes, moteur de lancement, mouvement, combat, stats, héros, assets, PWA, Survie, Dungeon, Tactical, PvP ou laboratoires Capture.

Interdits : masque CSS, suppression du profil, migration opportuniste du gameStyle, nouvelle identité Capture, wrapper global, observer, polling, réconciliation différée ou copie de la logique d'identité dans l'UI.

## Preuves accessibles sans relire le gros HTML

1. assets/gensrpg/capture/entry-v1.js exporte GensCaptureV1.isProfile(profile). La fonction est pure : elle reconnaît gameplay.profile === "creature" ou les deux modules capture et controllableCreatures explicitement vrais. Elle ne dépend ni de gameStyle, ni du DOM, ni du stockage.
2. tests/gens_phase9_capture_identity_authority_raccord_v1.test.cjs vérifie la délégation à cette identité dans les consommateurs, y compris gensContentFamilyForProfile(), et la priorité Capture dans le module actif Shell.
3. tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs exige Capture dans Adventure, famille de contenu creature, sans identité Dungeon ni runtime Dungeon créé. Il traverse ensuite le pré-game, la sélection et le lancement Capture.
4. tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs traverse les transitions Survie, Dungeon, retour Survie, Capture et PvP. Les assertions consultées protègent les états actifs et les vues ; elles ne suffisent pas à établir ici la bonne appartenance de chaque carte de profil dans toutes les listes.
5. Le journal et ces tests ne démontrent pas à eux seuls la condition fautive du filtre Survie. L'inspection exacte de son propriétaire inline reste nécessaire.

La sentinelle existante de routage Capture doit être conservée ; ne pas la remplacer par un scénario qui évite Survie ou réécrit artificiellement la liste.

## Tests à définir après inspection

- Reproduire la présence ou le mauvais classement de Capture par la vraie liste Shell, sans injecter un résultat de classification.
- Comparer Capture neuf sans gameStyle, Capture historique avec style Dungeon et Capture reconnu par ses modules ; ne pas retirer la compatibilité des profils historiques.
- Vérifier que Capture est absent de Survie et visible dans sa famille actuellement prévue.
- Vérifier que les profils Survie, Dungeon et personnalisés valides restent accessibles.
- Contrôler les cas contradictoires réellement pris en charge par le format, en donnant priorité à l'identité canonique existante.
- Vérifier que le classement ne modifie ni les profils persistés, ni le profil actif, ni les sauvegardes.
- Conserver les parcours mobiles, la sélection réelle de profil, la frontière des quatre modules et les trois workflows requis.
- Ajouter le RED ciblé avant tout correctif ; corriger le propriétaire démontré, puis retirer une ancienne autorité seulement si elle est effectivement redondante.

## Accès contrôlé à l'index — charte §26

Le fichier utilisateur index.zip décrit le runtime précédent de 8166377 octets / blob 37056722bb0a27f96e26b3ef3b05e9543dc5a223. CURRENT_WORK précise que le runtime actuel a ensuite changé de 471 octets. Cette archive ne doit pas être traitée comme le HEAD actuel.

La copie exacte nécessaire est :

https://github.com/slyen4425-cloud/Zombicide-40k/blob/168578f4394fc22cb4aec517e052e94847790bd9/index.html

Télécharger ce fichier, le compresser en ZIP si nécessaire et le joindre à ce fil. À réception, vérifier les 8165906 octets, le blob Git et le SHA-256 attendus avant inspection ou modification. Aucun transport du HTML de 8 Mo par connecteur n'est tenté dans cette reprise.

## Prochaine étape

Recevoir et vérifier le fichier exact, inspecter le propriétaire de la liste Survie, puis documenter la cause et le prochain correctif concret. Tant que cette inspection manque, le pré-audit reste ouvert.

Le diagnostic Dungeon PC reste clos techniquement, avec retour sur le parcours personnel et visuel précis toujours ouverts. Aucun merge ou déploiement main.

## Inspection exacte et conclusion — 2026-10-06

ZIP reçu : index (1)(3).zip, membre index (1).html. Taille 8165906 octets, blob 1e3398755beb751786d825047bc60fe1a7179d79 et SHA-256 0c98f5490bd0c0397458f136147ca430d047d907c7594ec0eb995d3db748c66d vérifiés. La copie est exactement celle du checkpoint demandé.

Le propriétaire fautif est survivalProfiles(), dans le bloc natif principal du Shell / édition Survie :

```js
return loadGameProfiles().filter(p=>p.gameStyle!=="dungeon").map(ensureSurvivalProfileData);
```

Le même runtime classe déjà Capture correctement via gensContentFamilyForProfile(p), qui délègue à GensCaptureV1.isProfile(p). rpgProfiles() et gensFamilyForProfileId() consomment cette classification canonique. Le rendu Survie appelle survivalProfiles() puis génère les cartes des profils retournés.

L'écart est reproduit en exécutant les fonctions exactes extraites du fichier vérifié, avec la véritable API Capture, sans remplacer leur résultat :

| Profil | Famille canonique | Routage Shell | Liste Survie actuelle |
| --- | --- | --- | --- |
| Survie explicite | survival | survival | présent |
| Profil neutre sans style | survival | survival | présent |
| Dungeon classique | rpg | adventure | absent |
| Capture neuf sans style | creature | adventure | présent — défaut |
| Capture historique style Dungeon | creature | adventure | absent |
| Capture reconnu par ses deux modules | creature | adventure | présent — défaut |

ensureSurvivalProfileData est appelé pour les deux profils Capture indûment inclus. Ce constat explique le doublon signalé et le passage par la normalisation Survie ; il ne démontre pas à lui seul une mutation de la sauvegarde personnelle.

### Correctif sélectionné, dans un lot TDD séparé

Remplacer uniquement le prédicat du filtre de survivalProfiles() par :

```js
p=>gensContentFamilyForProfile(p)==="survival"
```

Le normaliseur Survie et le renderer restent inchangés. Le classement commun reste l'autorité ; aucune logique d'identité Capture n'est copiée, aucun wrapper ou masque visuel n'est ajouté.

activeSurvivalModId() conserve une garde historique par gameStyle ; c'est un résidu distinct non modifié dans ce seam. La création d'une entrée Capture de premier niveau reste un chantier ultérieur de Phase 9. Ne pas élargir cette correction aux choix de navigation ou aux réglages de profil.

### Validation du pré-audit

- Archive et empreintes exactes : vérifiées.
- Inspection et exécution VM sur six profils : défaut reproduit ; classement canonique correct.
- Aucun runtime, asset ou règle modifié dans ce pré-audit.
- Fermeture documentaire sur cette branche ; les trois workflows doivent terminer SUCCESS sur son HEAD avant le checkpoint final.
- Checkpoint final prévu : checkpoint/gensrpg-phase9-capture-library-family-classification-preaudit-green-2026-10-06.
- Ce checkpoint sera créé uniquement sur le SHA dont la triple CI est réellement verte.

Après ce GREEN : créer le checkpoint de départ et la branche du correctif, déclarer le périmètre, ajouter une sentinelle RED qui teste les profils et les cartes réelles, puis appliquer la condition unique et valider. Le fichier exact est désormais reçu ; aucune nouvelle demande du même ZIP n'est nécessaire tant que son blob reste la base du runtime.
