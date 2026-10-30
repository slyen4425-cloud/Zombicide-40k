# GenSrpg — retrait des sentinelles CI périmées, 2026-10-30

- START : 856e69be736ab68e91eac5357881acb6b54d17cb ; checkpoint checkpoint/gensrpg-start-retired-ci-2026-10-30 ; branche work/gensrpg-retired-ci-contracts-2026-10-30.
- RED prouvé sur le HEAD main 856e69be736ab68e91eac5357881acb6b54d17cb, runs 41043406380 et 41043406428.
- Cause Builder : la sentinelle exigeait une mention textuelle V16.78.102 sur le bridge, alors que la version actuelle V16.78.114.11 possède une frontière graphique plus stricte (la fiche héroïque appartient au renderer natif).
- Correction : vérifier la responsabilité native de la fiche ainsi que les contrats de chargement et l'absence d'observer global; ne pas réintroduire de deuxième propriétaire.
- Cause Tactical : la CI exécutait un test d'un ancien guard Survie, dont le module a été retiré pendant Phase 6 par décision d'architecture.
- Correction : vérifier l'absence du module et le maintien des frontières Shell/Survie/Tactical avec les tests Phase 6 canoniques. Aucun module historique réintroduit.
- Tests PR : Builder Events, V113 Tactical Runtime, architecture/dungeon/shell. GREEN seulement après runs vérifiés sur le SHA exact.
