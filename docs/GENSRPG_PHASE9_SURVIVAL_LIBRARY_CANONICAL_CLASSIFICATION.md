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

Le transport du gros index utilise un workflow ponctuel borné à cette branche, vérifie main et l'empreinte de départ, puis son script se retire dans le commit runtime et son workflow est retiré par le coordinateur avant la triple CI finale. Il ne publie ni main ni Pages. Le diff inverse doit reconstruire exactement les octets de départ.

## État et prochaine étape

Périmètre consigné avant code. Ajouter les deux sentinelles permanentes, obtenir le RED ciblé, puis appliquer le correctif minimal.
Le checkpoint final checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06 ne sera créé qu'après triple CI SUCCESS sur le SHA exact.
Aucun merge ni déploiement. Le retour utilisateur ciblé et les observations personnelles Dungeon PC restent ouverts.

## RED permanent — runtime intact

Le test tests/gens_phase9_survival_library_canonical_classification_v1.test.cjs exécute les vrais propriétaires et la vraie API Capture. Sur 17 profils, la classification canonique et le routage préexistants sont corrects. La liste Survie ajoute à tort capture-new, capture-modules, capture-contradictory et capture-disabled-modules-preset ; l'assertion d'appartenance échoue avec ce diff avant toute mutation de l'index. Capture historique reste correctement exclu.

Le test conserve les vrais chargement/stockage/normaliseur/renderers et observe uniquement les appels au normaliseur. Aucun résultat de famille ou de liste n'est injecté. Le test navigateur permanent utilise le vrai preview.html et les graines actuelles, enrichies par de vrais profils stockés ; il couvre mobile puis PC, les deux listes, rafraîchissement, rechargement et sélection réelle Capture.

Les deux sentinelles sont ajoutées tôt dans Architecture+Browser ; aucune sentinelle existante n'est retirée. Le RED CI est attendu tant que le propriétaire n'a pas été corrigé. Prochaine étape : vérifier ce RED, puis transporter la condition unique avec contrôle d'empreinte et validation réelle RED/GREEN navigateur.

## RED CI confirmé et correctif local vérifié

Architecture 37481119855 : FAILURE attendu sur le test d'appartenance, job 112329182345, commit 15a637a92c37bfaed7a810e9b6a6fbc92d345b5e. Firefox 37481120148 et Tactical 37481120043 : SUCCESS sur le même SHA ; navigateur architecture sauté après le RED unitaire.

La condition unique appliquée à la copie locale reçue fait passer les 17 profils, protège les cartes et ne produit aucune écriture persistante. Candidat : 8165926 octets, blob d721d1665ba937b855d8de6c5b59c8d04d4a2bdf, SHA-256 e08b76f1e3c7e1eb625d764ad665dcffef2c8f14b30b09bc5f8cbe3408ca7768. L'inversion retrouve exactement les octets du ZIP utilisateur.

Le transport vérifie à nouveau le RED VM et le RED navigateur réels avant toute mutation distante. Il n'installe aucune dépendance dans les fichiers suivis, conserve l'index hors connecteur, met à jour les pins sans assouplir les tests, exige le GREEN ciblé et ne publie pas main. Son script s'auto-retire ; son workflow est supprimé via le connecteur avant la triple CI finale afin de séparer les permissions de transport et d'édition des workflows.

## Correctif intégré et preuve TDD réelle — 2026-10-06

- RED CI permanent : commit 15a637a92c37bfaed7a810e9b6a6fbc92d345b5e, Architecture 37481119855, job 112329182345. Échec exact sur l'appartenance de quatre variantes Capture à Survie ; autres identités/routages corrects.
- Transport ponctuel : run 37483773723, https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/37483773723.
- Ce run exige le RED VM et le RED navigateur sur l'index intact, puis GREEN VM et vrai preview.html mobile/PC avant de produire le commit runtime.
- Nouveau runtime : 8165926 octets, blob d721d1665ba937b855d8de6c5b59c8d04d4a2bdf, SHA-256 e08b76f1e3c7e1eb625d764ad665dcffef2c8f14b30b09bc5f8cbe3408ca7768.
- Diff runtime : une seule condition dans survivalProfiles(), +20 octets ; inversion exacte vers l'index utilisateur vérifiée.
- La logique de classification, les normaliseurs, renderers, profils, paramètres et quatre runtimes ne sont pas modifiés.
- 102 fichiers de tests ont seulement leurs empreintes taille/blob repinnées. Quatre métadonnées de cartographie sont repinnées ; aucune assertion de comportement n'est assouplie.
- Le script de transport se retire dans le commit runtime. Le coordinateur retire le workflow ponctuel avec le connecteur avant la triple CI finale ; aucun installateur permanent ajouté.
- Preuves navigateur dans l'artefact gensrpg-survival-library-tdd : membership, stockage, rechargement, sélection Capture et captures des vraies listes.

Le raccord VM couvre 17 profils : 8 Survie, 5 Capture, 4 Dungeon/Manga. Le vrai preview couvre les deux listes sur mobile et PC, rafraîchissement, rechargement, invariance des profils/du profil actif/des sauvegardes avant sélection, puis sélection réelle de Capture via le propriétaire V155 existant. Le chemin actif reste Capture et ne crée pas de runtime Dungeon.

Point de reprise final : checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06. Ce checkpoint est créé uniquement sur le SHA exact dont Architecture+Browser, Firefox wall et Tactical dock terminent tous SUCCESS ; le run de transport seul ne constitue pas ce GREEN final.

Le lien manuel de clôture est fourni sur le SHA validé de preview.html. Le test utilisateur ciblé reste ouvert. Phase 9 non close : autonomie Capture de premier niveau et autres résidus restent distincts. main demeure e8681f9823573ced8aec59c8ddc47a72b02bc663, sans merge ni déploiement.

## Clôture du transport et point de reprise final

- Commit runtime ciblé : a1391b78578e9ea4c25b5f05695e39e049351c11 ; source vérifiée dans GitHub, index blob d721d1665ba937b855d8de6c5b59c8d04d4a2bdf, 8165926 octets.
- Run TDD 37483773723 : SUCCESS. RED VM et RED navigateur exacts sur le fichier intact ; GREEN sur les 17 profils et les deux appareils avec la condition corrigée. Le parcours réel conserve le stockage, recharge, puis sélectionne Capture via Adventure.
- Revue du diff runtime : une ligne retirée / une ligne ajoutée ; les 102 patches de tests sont vérifiés comme remplacements stricts d'empreinte, les quatre cartes de source ne changent que de blob. Aucun autre JS, asset, CSS, seed ou contrat modifié.
- Le script temporaire est absent du commit runtime ; le présent commit retire le workflow de transport. Seules les deux sentinelles permanentes et leur raccord CI restent actifs.
- Les profils de test sont préparés par les API existantes : initialisation des références et seeds, normalisation du profil historique comme dans le duplicateur RPG, pools vides pour Manga. Les assertions comparent toutes les valeurs exactes des clés surveillées ; aucun changement de stockage n'est toléré ou effacé. Cette invariance concerne des profils valides déjà normalisés ; les migrations historiques de version ne sont pas modifiées.

Point de reprise final : checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06, sur le HEAD de clôture documentaire uniquement après ses trois workflows SUCCESS. Le coordinateur vérifie cette condition puis crée le checkpoint exact ; aucun GREEN n'est déduit du seul transport.

Test manuel ciblé : ouvrir la preview du SHA validé, Survie doit présenter 40K et les univers Survie, avec Monster Capture absent ; revenir aux modes, ouvrir Adventure, sélectionner Monster Capture. Capture doit rester accessible et distinct de Dungeon. Le retour utilisateur est encore à recueillir avant publication.

Après ce jalon technique : pré-auditer séparément les consommateurs résiduels de gameStyle et l'autonomie Shell Capture prévue en Phase 9. Ne pas modifier main, reprendre Phase 8 ou rouvrir les laboratoires. Les observations personnelles Dungeon PC restent séparées.
