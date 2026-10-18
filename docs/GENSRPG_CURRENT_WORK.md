# GenSrpG — CURRENT_WORK officiel (18 octobre 2026)

## R09 — EN COURS : isolation du gestionnaire de vagues / apparitions Survie

- Base technique exacte : checkpoint GREEN R08 `f458f0dce79a6bf0034c69bca36313f671d51fc4`, `index.html` **2 131 805 octets**, blob `6eeed45a0a12085c1b107ee6c24b49040277ca54`, confirmé sur l'archive utilisateur `d7.zip` conformément au §26.
- START §25 : `checkpoint/gensrpg-start-phase12-r09-survival-wave-spawn-2026-10-18` créé **avant toute modification** depuis le SHA R08 GREEN ; branche dédiée `work/gensrpg-phase12-r09-survival-wave-spawn-2026-10-18` issue du même SHA.
- Module / propriétaire : **Survie**. Périmètre prévu : extraire en script classique synchrone les déclarations des fonctions de configuration de réserve, profils et sets de vagues, pioche d'apparition et présentation de l'apparition depuis le grand script historique mixte ; préserver les constantes partagées en place, l'ordre des initialisations, les fonctions et règles identiques, le retour arrière octet-exact.
- Protégés : Dungeon (mouvement/combat Tactical et récompenses), Capture, PvP non jouable, Shell, Core storage, sauvegardes, PWA, laboratoires, assets et 32 images Survie historiques ; `main` gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- Tests obligatoires : préflight source+rollback SHA et syntaxe JS, ordonnancement de scripts, fixtures d'éditeur de vagues / réserve / apparition en vrai navigateur, sentinelles transversales Architecture+Chromium, Firefox, Tactical et source/rollback **SUCCESS sur le même SHA**. Pas de checkpoint GREEN ni de preview de validation sans preuves. Si risque transverse détecté, corriger soustractivement ou revenir à R08.
- Statut : branche préparée, cible R09 identifiée ; aucune modification runtime certifiée à ce stade.

# GenSrpG — CURRENT_WORK officiel (18 octobre 2026)

## R08 — ACTIVE / NON GREEN — bibliothèque capacités et compétences

Dernier checkpoint GREEN et manuellement accepté : checkpoint/gensrpg-phase12-r07-magic-audio-data-green-2026-10-18, SHA 17a1def7a514478fec08025f354a4a1b17aa14f5 (R07 validé par l'utilisateur le 18/10/2026).

START §25 : checkpoint/gensrpg-start-phase12-r08-shared-ability-skill-catalog-2026-10-18 sur 17a1def7a514478fec08025f354a4a1b17aa14f5 ; branche work/gensrpg-phase12-r08-shared-ability-skill-catalog-2026-10-18, issue exactement de ce checkpoint. Aucun D10/micro-lot concurrent.

Source §26 utilisateur : d6.zip / index.html(4).txt, **2 217 805 octets**, blob Git aca31c540d61c81e1504d3b915b034b372103b5b strictement R07 GREEN. Projet R08 : extraire 57 fonctions et constantes bibliothèque/édition des capacités et compétences du second script anonyme vers assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js (86 082 octets), **sans déplacer le listener Escape d'origine**, et garder exactement la composition classique synchrone. Index projeté **2 131 805 octets** (–86 000), blob 6eeed45a0a12085c1b107ee6c24b49040277ca54, rollback R08→R07 octet-exact prévu. Les 57 fonctions ne sont pas modifiées.

Application exclusivement par workflow contrôlé de la branche R08 avec contrôle strict d'entrée/sortie. **Non GREEN tant que les sentinelles Architecture + Chromium, Firefox, Tactical, préflight R08 et rollback historique ne passent pas sur le même SHA**. Éditeur capacités, sauvegardes, Shell/Dungeon/Survie/Capture, PWA, Tactical, PvP non jouable, deux laboratoires et 32 visuels historiques Survie protégés. Aucun merge main ; main reste gelée à e8681f9823573ced8aec59c8ddc47a72b02bc663.

Rapport : docs/GENSRPG_PHASE12_R08_SHARED_CATALOG_2026-10-18.md.
