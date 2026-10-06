# GenSrpG — Phase 9 — Classement canonique de la bibliothèque Survie

Date : 2026-10-06. Coordinateur : fil de reprise confirmé par Sylvain.

## Base et checkpoints

- Dépôt : slyen4425-cloud/Zombicide-40k.
- Base exacte : b3186266b726b649f7010ca831fe3cfcbc1668df, pré-audit conclu, triple CI vérifiée avant ouverture de ce lot.
- Dernier GREEN : checkpoint/gensrpg-phase9-capture-library-family-classification-preaudit-green-2026-10-06.
- Checkpoint de départ : checkpoint/gensrpg-start-phase9-survival-library-canonical-classification-2026-10-06, créé sur cette base avant le premier changement de code.
- Branche dédiée : work/gensrpg-phase9-survival-library-canonical-classification-2026-10-06.
- main gelée : e8681f9823573ced8aec59c8ddc47a72b02bc663.
- Runtime de départ : 8165906 octets, blob 1e3398755beb751786d825047bc60fe1a7179d79, SHA-256 0c98f5490bd0c0397458f136147ca430d047d907c7594ec0eb995d3db748c66d.
- Archive utilisateur reçue et vérifiée ; aucune nouvelle lecture du gros HTML par connecteur.

## Périmètre déclaré avant code

| Domaine | Décision |
| --- | --- |
| Module concerné | Shell : appartenance des profils à la liste Survie |
| Propriétaire modifié | survivalProfiles(), condition unique de son filtre existant |
| Service partagé réutilisé | gensContentFamilyForProfile(profile), qui délègue à GensCaptureV1.isProfile(profile) |
| Renderer et normaliseur | renderGensSurvivalUniverseCards() et ensureSurvivalProfileData(), inchangés |
| Mutation runtime prévue | Remplacer le filtre par gameStyle par la famille canonique survival |
| Risque | Perdre une carte de profil valide, changer le routage ou passer Capture dans la normalisation Survie |
| Validation permanente | VM sur les fonctions exactes + vrai preview.html ordinateur/mobile + sentinelles existantes |
| Migration de baseline | Empreintes exactes des tests et métadonnées cartographiques, sans affaiblir les assertions |

Cause établie au pré-audit : survivalProfiles() acceptait tout profil dont gameStyle n'était pas dungeon. Capture neuf et Capture reconnu par ses deux modules passaient ce filtre alors que leur famille canonique était déjà creature.

Fonctions protégées : GensCaptureV1.isProfile(), gensContentFamilyForProfile(), rpgProfiles(), gensFamilyForProfileId(), isDungeonMode(), seeds, launch providers, normaliseurs, paramètres, sauvegarde/reprise, stats, héros, mouvement, combat, assets, PWA et quatre runtimes. Aucun laboratoire Capture concerné.

Interdits : copie d'identité dans l'UI, wrapper, timer, observer, masque CSS, migration ou suppression de profil, nouvelle route. La présence de Capture dans Adventure est le routage actuel protégé ; son entrée autonome de premier niveau reste un chantier distinct.

Résidus connus, hors correction : activeSurvivalModId() et gensFamilyForProfile() conservent des gardes historiques par gameStyle. Ne pas élargir ce lot sans pré-audit séparé.

## Tests RED puis GREEN

1. Charger la véritable API Capture et les fonctions exactes du fichier utilisateur vérifié.
2. Vérifier les profils Survie explicites/neutres/personnalisés, Dungeon classique/manga, Capture neuf/historique/par modules et identité Capture avec style Survie contradictoire.
3. Vérifier les combinaisons de modules partiels, faux et non booléens suivant le contrat canonique actuel ; aucun nouveau contrat d'identité.
4. Vérifier cartes Survie, routage Adventure inchangé, exclusion de Capture de la normalisation Survie et absence de mutation persistante ou de sélection par la lecture.
5. Exécuter le test sur le runtime intact et conserver le RED reproduisant les profils Capture inclus.
6. Tester le vrai preview.html sur ordinateur et mobile : racine -> Survie -> retour racine -> Adventure -> rafraîchissement -> Survie -> rechargement ; API et renderers réellement chargés, aucune classification/listes injectées.
7. Appliquer seulement le prédicat prévu, contrôler l'inversion exacte et repinner mécaniquement les empreintes de référence.
8. Conserver tous les anciens tests et vérifier Architecture+Browser, Firefox wall et Tactical dock sur le même SHA final.

Le transport du gros index utilise un workflow ponctuel borné à cette branche, vérifie main et l'empreinte de départ, puis se retire dans le commit runtime. Il ne publie ni main ni Pages. Le diff inverse doit reconstruire exactement les octets de départ.

## État et prochaine étape

Périmètre consigné avant code. Ajouter les deux sentinelles permanentes, obtenir le RED ciblé, puis appliquer le correctif minimal.
Le checkpoint final checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06 ne sera créé qu'après triple CI SUCCESS sur le SHA exact.
Aucun merge ni déploiement. Le retour utilisateur ciblé et les observations personnelles Dungeon PC restent ouverts.

## RED permanent — runtime intact

Le test tests/gens_phase9_survival_library_canonical_classification_v1.test.cjs exécute les vrais propriétaires et la vraie API Capture. Sur 17 profils, la classification canonique et le routage préexistants sont corrects. La liste Survie ajoute à tort capture-new, capture-modules, capture-contradictory et capture-disabled-modules-preset ; l'assertion d'appartenance échoue avec ce diff avant toute mutation de l'index. Capture historique reste correctement exclu.

Le test conserve les vrais chargement/stockage/normaliseur/renderers et observe uniquement les appels au normaliseur. Aucun résultat de famille ou de liste n'est injecté. Le test navigateur permanent utilise le vrai preview.html et les graines actuelles, enrichies par de vrais profils stockés ; il couvre mobile puis PC, les deux listes, rafraîchissement, rechargement et sélection réelle Capture.

Les deux sentinelles sont ajoutées tôt dans Architecture+Browser ; aucune sentinelle existante n'est retirée. Le RED CI est attendu tant que le propriétaire n'a pas été corrigé. Prochaine étape : vérifier ce RED, puis transporter la condition unique avec contrôle d'empreinte et validation réelle RED/GREEN navigateur.
