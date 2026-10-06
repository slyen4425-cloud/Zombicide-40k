# GenSrpG — Phase 9 — Préaudit de la frontière de l’éditeur Survie

Date : 2026-10-06. Validation du lot précédent par Sylvain : « Oui c est fixé , reprend la restructuration en suivant la charte et le plan », à 17:51 Europe/Paris.

## Base et checkpoint

- Dépôt : slyen4425-cloud/Zombicide-40k.
- Base exacte : 7d317cc77683f1c3ce0f5e8696984f8c9b65a2a7.
- Dernier GREEN : checkpoint/gensrpg-phase9-survival-library-canonical-classification-green-2026-10-06.
- Checkpoint de départ : checkpoint/gensrpg-start-phase9-survival-editor-family-boundary-preaudit-2026-10-06.
- Branche : work/gensrpg-phase9-survival-editor-family-boundary-preaudit-2026-10-06.
- main vérifiée et gelée : e8681f9823573ced8aec59c8ddc47a72b02bc663.
- Index vérifié localement contre l’arbre GitHub : 8165926 octets / blob d721d1665ba937b855d8de6c5b59c8d04d4a2bdf / SHA-256 e08b76f1e3c7e1eb625d764ad665dcffef2c8f14b30b09bc5f8cbe3408ca7768.
- Triple CI de base : Architecture+Browser 37485298316, Firefox 37485298290, Tactical dock 37485298338, SUCCESS sur ce SHA.
- Statut : préaudit ouvert ; aucun runtime modifié.

Le fichier local est le résultat vérifié du lot précédent issu du ZIP utilisateur. Son blob égale celui du checkpoint actif. Aucun nouvel accès au HTML de 8 Mo par connecteur ni nouvelle demande de ce même contenu n’est nécessaire.

## Périmètre déclaré avant code

Responsabilité : frontière de sélection, lecture et écriture de l’éditeur natif Survie, propriétaire Shell/éditeur Survie dans le bloc principal. Autorité de famille à réutiliser : gensContentFamilyForProfile() -> GensCaptureV1.isProfile(), déjà validée.

Consommateurs à caractériser : activeSurvivalModId(), setActiveSurvivalMod(), currentSmodProfile(), selectSurvivalModProfile(), et les écritures dépendant de smodEditingId. Vérifier séparément les références de gensFamilyForProfile() ; sa suppression ou modification n’est pas présumée nécessaire.

Mutation de ce préaudit : documents uniquement. Les exécutions de caractérisation utilisent les fonctions exactes du fichier vérifié et la vraie identité Capture ; seuls les ports DOM/navigation peuvent être observés ou simulés, jamais la classification ni le résultat attendu.

Protégés : survivalProfiles() et son filtre GREEN, classifier, identité Capture, seeds, routage et lancement, stockage/migrations, réglages et calculs, mouvement, combat, stats, assets, PWA, quatre modules et laboratoires externes. Aucun schéma ni valeur de gameplay changé.

Risques : profil Capture reconnu comme Survie, édition étrangère, normalisation ou écriture dans un univers Capture, mauvaise sélection active, perte d’un profil Survie valide, incompatibilité historique.

## Questions à résoudre

1. Que renvoie l’éditeur lorsque Capture est actif, avec ou sans ancien style Dungeon ?
2. La liste correcte empêche-t-elle réellement les écritures sur un profil étranger ?
3. Quels écrivains utilisent directement smodEditingId au lieu d’une sélection classée ?
4. Quelle responsabilité native doit recevoir la garde, sans wrapper ni seconde identité ?
5. Quels usages de gensFamilyForProfile() existent dans la composition chargée ?
6. Quel lot TDD minimal préserve Survie et toutes les représentations Capture historiques ?

## Contrôles prévus et suite

Cartographie des fonctions et de leurs consommateurs, VM des sources exactes sur profils Survie/Capture/Dungeon/Manga, observation des lectures/écritures et des appels de sélection, vérification d’empreintes et de l’absence de mutation runtime. Documenter une décision unique sur preuve, puis triple CI du HEAD documentaire et checkpoint GREEN avant tout lot correctif.

L’autonomie Capture de premier niveau reste le but Phase 9. Ce préaudit ne change pas Adventure. Le déplacement et le visuel du PC personnel restent distincts. Phase 8 fermée. Aucun merge ni déploiement main.
