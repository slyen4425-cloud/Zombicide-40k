# GenSrpG — Politique de checkpoints et reprise de chantier

Cette politique complète la charte permanente et doit être appliquée à tous les futurs chantiers.

## Au démarrage d'un chantier

Avant le premier changement de code ou de configuration :

1. identifier le dernier SHA vert servant de base ;
2. créer un checkpoint de départ explicite : `checkpoint/gensrpg-start-<chantier>-YYYY-MM-DD` ;
3. créer la branche de travail dédiée depuis exactement ce SHA ;
4. mettre à jour `docs/GENSRPG_CURRENT_WORK.md` avec le chantier, la branche, le checkpoint de départ, le SHA de base, le dernier checkpoint vert, le périmètre, les invariants et la prochaine étape.

Le checkpoint de départ ne doit jamais être créé après plusieurs modifications en prétendant représenter le début : s'il a été oublié, il doit pointer rétroactivement sur le vrai SHA de base.

## Pendant le chantier

- créer des checkpoints intermédiaires pour les jalons structuraux importants si le chantier est long ;
- ne jamais réutiliser le même nom pour deux états différents ;
- garder `GENSRPG_CURRENT_WORK.md` suffisamment court pour servir de point de reprise immédiat dans un nouveau fil.

## À la fin d'un jalon vert

Après tests et CI verts :

1. créer `checkpoint/gensrpg-<chantier>-green-YYYY-MM-DD` sur le SHA exact validé ;
2. noter les tests/runs utiles et le lien manuel de test quand il existe ;
3. mettre à jour `GENSRPG_CURRENT_WORK.md` ;
4. ne commencer le chantier suivant qu'après avoir créé son propre checkpoint de départ.

## Objectif

À tout moment, un nouveau fil doit pouvoir reprendre le développement en lisant seulement :

1. `docs/GENSRPG_CHARTE.md` ;
2. `docs/GENSRPG_CURRENT_WORK.md` ;
3. le checkpoint de départ ou le dernier checkpoint vert qui y est indiqué.
