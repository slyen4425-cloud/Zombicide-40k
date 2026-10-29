# Monster Capture — migration de sauvegarde vers le Combat officiel du Labo (V1)

## État, périmètre et source d'autorité

Contrat `gensrpg-capture-lab-profile-migration-v1`, porté par
`assets/gensrpg/capture/saved-profile-lab-migration-v1.mjs`, testé contre le
vrai propriétaire des sauvegardes
`assets/gensrpg/capture/team-roster-v1.js`, la vraie autorité du World
`world-exploration-v1.js` et l'exporteur auteur épinglé du Labo Combat
`main@65e21792ff74aea9862e528c8dbfdb22797b6693`.

**Non actif dans le `index.html` public.** Uniquement une proposition de
migration lancée par l'interface de démonstration indépendante
`capture-lab-saved-hub-preview.html`. Ni synchronisation automatique, ni
mutation à l'ouverture du profil, ni remplacement du moteur de combat
historique. Les autres modes et le service worker restent inchangés.

## Chemin testé et conservation des données

1. Le World Capture expose une rencontre sauvage sauvegardée; le roster
   propriétaire lit l'unique créature active. `prepare()` récupère les
   définitions de **cette espèce** et de l'adversaire **réel de ce World**
   via `createCaptureLabAuthoredSourceV1.buildEncounter`, donc l'exporteur
   officiel V3, sans fabriquer de capacités, PV, espèces ou cibles.
2. Si l'identité, l'équipe/réserve, les PV, les talents ou allocations
   ne sont pas compatibles, la préparation refuse avec un diagnostic.
   Aucun accès direct à localStorage dans l'adaptateur. La rencontre et les
   anciennes données restent intactes.
3. Si la créature possède une ancienne définition de PV ou de capacités,
   un rapport en lecture seule expose **avant/après** : espèce et UID
   inchangés, anciens PV, nouvelle jauge et capacités auteur.
   Le nombre de PV est converti proportionnellement à la jauge passée,
   puis borné dans la jauge officielle (ex. 17/17 → 150/150,
   9/18 → 75/150). Aucun calcul de dégâts ou règle de combat n'est
   introduit ici.
4. **Seulement après clic de confirmation sur le rapport présenté**,
   `commit(plan,{acknowledged:plan.consentText})` refait une lecture
   fraîche du profil et de la rencontre et refuse tout changement
   concurrent. Un appel unique à **saveHeroCreatureState** conserve
   l'identité, le niveau, l'XP, les autres champs du monstre, l'inventaire,
   l'or et le monde. Les capacités actives et connues adoptent
   exactement le loadout de l'exporteur auteur.
5. Le même enregistrement sauvegardé contient
   `captureLabProfileMigrationV1` : schéma/version, SHA officiel, UID,
   ancienne instance complète, instance migrée et empreinte logique
   du contexte World. **Aucune deuxième clé de sauvegarde**.
   Ce certificat fournit la preuve de migration et le retour arrière.
6. Avant le combat, `inspectRollback()` prépare le retour volontaire.
   `rollback` exige à nouveau confirmation, constate que la créature
   est encore identique à celle migrée et que la rencontre n'a pas changé.
   La restauration passe par **le même écrivain roster**, en préservant
   le reste du profil actuel. Elle est refusée après le combat, si le World
   a changé ou si la créature a évolué ou été modifiée : ne jamais effacer
   des progrès acquis après migration.

## Périmètre refusé par la V1

- Deux actifs, une réserve non vide ou plusieurs créatures dans l'équipe;
- espèce ou adversaire manquant dans les transferts auteur validés;
- PV invalides, KO, personnalisation statistique allouée ou talents actifs
  qui n'ont pas encore de représentation validée dans le Labo;
- profil modifié entre lecture et consentement; résultat d'un ancien
  combat déjà enregistré; plan périmé;
- ancienne copie de `index.html`, transfert d'espèces par ressemblance,
  substitution de capacité, fusion d'inventaires, conversion au chargement.

Ce refus fermé est volontaire. La prise en charge des réserves, du 2v2,
des autres créatures du créateur, des statuts, talents, XP et du véritable
écran de consentement dans GenSrpg demandera des contrats versionnés
distincts. La version V1 ne doit pas être annoncée comme migration
universelle des anciennes sauvegardes.

## Vérification et prévisualisation

`COMBAT_LAB_ROOT` doit pointer sur la source officielle au SHA précité.
Exécuter `node --test tests/gens_capture_world_lab_wild_transaction_v1.test.cjs`
puis le workflow `Capture official Combat runtime` pour la construction
source-pinned et les parcours Chromium/Firefox tactiles. L'artefact
`capture-lab-preview` contient `capture-lab-saved-hub-preview.html`,
le rapport avant/après, la confirmation volontaire et le refus explicite
de restauration après combat. Servir l'artefact par HTTP local, pas en
ouvrant le HTML comme fichier local. L'artefact n'est **pas** le GenSrpg
public et ne contient aucune sauvegarde utilisateur.

Le prochain lot d'intégration C3 doit transférer la fonction propriétaire
`captureStartWildBattle` dans le vrai Hub sans deuxième global ou
fallback ancien, prévoir les exports auteur pour toutes les espèces
supportées et vérifier le cycle réel sauvegarde/reprise/PWA avant toute
publication de `main`.
