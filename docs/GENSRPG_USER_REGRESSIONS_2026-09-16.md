# GenSrpG — Régressions UI signalées pendant la restructuration

Ces points ont été signalés par l'utilisateur après validation du checkpoint combat lot 3. Ils sont enregistrés ici pour diagnostic ultérieur, sans être corrigés dans le chantier de migration des points d'entrée combat tant que leur cause n'est pas démontrée.

## 1. Barre de commandes flottantes absente

Les commandes qui étaient auparavant flottantes au-dessus de l'interface et suivaient le scroll ne sont plus présentes du tout :

- Attaque ;
- Fin de tour ;
- Capacité.

Ce n'est pas seulement une perte de comportement `position: fixed/sticky` : les contrôles sont entièrement absents de l'interface observée.

Conformément à la charte, le futur diagnostic doit d'abord identifier le propriétaire d'affichage et le premier changement responsable, sans recréer une seconde barre ni ajouter de timer/observer de réparation.

## 2. Flash ponctuel d'éléments Talent sur la fiche personnage

Lors d'un premier passage sur la fiche personnage, des éléments liés aux talents sont apparus brièvement puis ont disparu. Le phénomène n'a pas été reproduit au second essai.

Hypothèse à vérifier, sans la considérer comme acquise : concurrence de renderers / ancien rendu transitoire avant le renderer canonique.

Le diagnostic futur doit privilégier l'ordre de rendu, les propriétaires actifs et les couches UI avant toute modification fonctionnelle de la fiche personnage.

## Statut

- Signalé utilisateur : 2026-09-16.
- Checkpoint observé : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16`.
- Hors périmètre du prochain lot combat tant que la cause n'est pas isolée.
