# GenSrpG — Phase 9 — Frontière canonique de l’éditeur Survie

Date : 2026-10-06.

## Base et périmètre déclaré avant code

Branche : work/gensrpg-phase9-survival-editor-canonical-boundary-2026-10-06.
Départ : checkpoint/gensrpg-start-phase9-survival-editor-canonical-boundary-2026-10-06, créé avant code sur 797316634b1354522adee616c637013aad69a1eb.
Dernier GREEN : checkpoint/gensrpg-phase9-survival-editor-family-boundary-preaudit-green-2026-10-06, même SHA ; Architecture+Browser 37492464948, Firefox 37492464522, Tactical dock 37492464844 SUCCESS.
main gelée : e8681f9823573ced8aec59c8ddc47a72b02bc663.
Index exact vérifié : 8165926 octets / blob d721d1665ba937b855d8de6c5b59c8d04d4a2bdf / SHA-256 e08b76f1e3c7e1eb625d764ad665dcffef2c8f14b30b09bc5f8cbe3408ca7768.
Sylvain a validé le classement Survie précédent et demandé la poursuite suivant charte/plan.

Responsabilité : frontière de l’éditeur natif Survie, fonctions natives du bloc principal. Autorité réutilisée : gensContentFamilyForProfile() -> GensCaptureV1.isProfile(). Aucune identité ou implémentation concurrente.

Douze fonctions autorisées, conditions uniquement :
- activeSurvivalModId(), setActiveSurvivalMod(), currentSmodProfile(), avec fallback classé ;
- selectSurvivalModProfile(), rejet avant modification de smodEditingId ;
- saveSurvivalModPools(), addSurvivalThreatLevel(), removeSurvivalThreatLevel(), saveSurvivalModIdentity(), saveSurvivalModProgression(), saveSurvivalModRules(), saveSurvivalModWaveRules(), garde au prédicat natif de recherche ;
- duplicateSurvivalModProfile(), rejet quand la lecture de fallback ne correspond pas à l’identifiant demandé.

Déclarations complémentaires : repins mécaniques taille/blob des anciens tests et des quatre métadonnées de source ; composition exacte de l’inversion du seam dans la preuve historique openSessionDungeonSetup(), sans modification de fixture, de ses 18 cas ni des blobs cibles immuables. Corriger le compteur documentaire du préaudit : 31 fonctions exactes et non 30, preuve inchangée.

## Invariants et risques

Protéger survivalProfiles() et son filtre GREEN, classifier, identité Capture, gensFamilyForProfile(), routes, seeds, applyGameProfile(), stockage/migrations, gameplay, quatre runtimes, mouvement, combat, stats, assets, PWA et laboratoires. Corps de calcul et rendu inchangés. Aucun wrapper, observer, timer, masque ou réconciliation.

Un profil étranger ne doit pas être sélectionné ni modifié par l’éditeur Survie. Les écrivains refusent un smodEditingId devenu étranger. Le fallback garde son sens de lecture mais n’autorise pas une duplication étrangère ou absente. Survie conserve ses paramètres personnalisés, pools, duplication et suppression. Compatibilité Capture historique via l’autorité existante.

Risques : régression d’édition Survie, profil valide perdu, écriture Capture/Dungeon/Manga, mauvaise application du fallback, paramètres implicites, preuve historique assouplie.

## TDD et validation

1. RED permanent VM sur fonctions exactes + vraie API Capture : sélection/lecture, état stale, neuf sans survival et résidu historique, flags stricts, Survie, sept écrivains, duplication/suppression, paramètres personnalisés et zéro write étrangère.
2. RED preview.html réel mobile/PC : vrais boutons Survie, paramètres sauvegardés puis relus après reload, profil devenu Capture pendant l’édition via stockage réel, écrivains natifs refusés, sélection Capture réelle et frontière de lecture.
3. Constater les RED exacts avant mutation runtime.
4. Gardes natives, empreintes, inverse intégral et assertions historiques conservées.
5. GREEN VM et navigateur ciblés ; retrait du transport ponctuel ; triple CI du HEAD final et checkpoint/gensrpg-phase9-survival-editor-canonical-boundary-green-2026-10-06.

Le runtime de 8 Mo ne transite pas par connecteur. Le transport CI ponctuel applique uniquement les fragments vérifiés puis se retire. Aucun merge ni déploiement main.

## État

Lot ouvert, tests RED à ajouter, aucun correctif runtime. Phase 9 en cours ; autonomie Capture au premier niveau et observations personnelles Dungeon PC distinctes.

## Sentinelles permanentes ajoutées

VM local RED exact : « Capture must not be selected by the Survival editor », profil Capture renvoyé à la place de 40K. Les tests utilisent les fonctions exactes et l’API réelle ; les ports DOM/rendu/application du VM sont observés, tandis que le navigateur traverse la composition complète sans remplacer les propriétaires. Aucun runtime modifié. Le RED CI et le RED navigateur doivent précéder le correctif.
