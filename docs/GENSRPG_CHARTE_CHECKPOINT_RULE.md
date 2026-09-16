## Règle permanente — checkpoints de début et de fin de chantier

Cette règle doit être intégrée à `GENSRPG_CHARTE.md` :

- avant le premier changement de chaque nouveau chantier, créer un checkpoint de départ sur le SHA exact servant de base ;
- utiliser un nom lisible et stable : `checkpoint/gensrpg-start-<chantier>-YYYY-MM-DD` ;
- créer ensuite la branche de travail depuis exactement ce checkpoint ;
- mettre à jour `docs/GENSRPG_CURRENT_WORK.md` avec branche, SHA de base, dernier checkpoint vert, objectif, périmètre, tests, risques et prochaine étape ;
- si le chantier est long, créer des checkpoints intermédiaires à chaque jalon structurel vert ;
- à la fin, créer `checkpoint/gensrpg-<chantier>-green-YYYY-MM-DD` sur le SHA exact validé ;
- ne jamais commencer le chantier suivant avant d'avoir créé son checkpoint de départ ;
- si le checkpoint de départ a été oublié, le recréer rétroactivement sur le vrai SHA de base et le documenter comme tel.

Objectif : permettre une reprise immédiate dans un nouveau fil sans devoir reconstruire l'historique à partir de messages anciens.
