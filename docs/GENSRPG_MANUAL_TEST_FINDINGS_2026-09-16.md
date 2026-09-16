# GenSrpG — retour test manuel du 16/09/2026

Candidat testé : preview restructurée issue du jalon V114.11 / architecture cleanup.

## Positif
- Dungeon très fluide sur Firefox mobile.
- Application globalement réactive et stable.

## Anomalies signalées et état de traitement
1. **Survie / Zombie : aucun visuel observé.**
   - Caractérisé : le dépôt contient actuellement 134 assets visuels physiques, tous sous le périmètre Dungeon ; il n'existe pas encore de bibliothèque `assets/survival/` et `index.html` ne référence aucun chemin d'image Zombie/Survie.
   - Conclusion : ce n'est pas un chemin cassé du jalon restructuré mais un contenu visuel Survie non encore créé/migré. À traiter en phase de restructuration des assets avec resolver Survie dédié, sans fallback Dungeon.
2. **Combat : raccourcis Attaque / Fin de tour absents ; futur emplacement Compétences à préserver.**
   - Reconnecté au renderer canonique et verrouillé par tests.
3. **Résultat D100 : explication du toucher présente, mais pas le détail dégâts.**
   - Reconnecté : puissance brute, bonus de stat, armure et dégâts finaux sont exposés par le chemin canonique.
4. **Victoire : XP/drop non visibles lors du test.**
   - Reconnecté : victoire Tactical -> XP partagé + drops -> résumé Dungeon ; protection contre double crédit.
5. **Progression : passage de niveau manuel ne semble pas créditer les points de statistiques.**
   - Reconnecté via le moteur canonique de progression : XP manuel -> synchronisation -> niveau -> points -> sauvegarde/rendu.
6. **Stats combat : Agilité / toucher semble incohérent.**
   - Verrouillé : Agilité canonique -> toucher distance expliqué, sans ancien coefficient caché concurrent.
7. **Fiche héros en jeu : image instable / saute dans la section stats.**
   - Cause caractérisée : V102 et V99 écrivaient tous deux directement la même image et empilaient les mêmes hooks de fiche.
   - Corrigé : V99 est désormais l'unique propriétaire direct de l'image de fiche ; V102 ne fait plus que déléguer et ne wrappe plus les cycles de fiche. Test runtime : source canonique écrite une seule fois malgré plusieurs rerenders.
8. **Stats éditeur vs stats en jeu : incohérence d'affichage/valeurs.**
   - Sémantique verrouillée : éditeur = valeur de base du héros ; jeu = valeur totale/effective après bonus/effets.
9. **Murs : blancs, texture non visible.**
   - Reconnecté au renderer mural canonique après rendu Dungeon ; autorité murale unique conservée.

## Règle de travail
La migration du gros `index.html` reste suspendue tant que ce cycle de validation manuelle n'est pas refermé par un nouveau jalon Firefox. Tous les correctifs restent isolés de `main` et respectent la charte : caractérisation avant changement, propriétaire unique, pas de nouvel observer global, tests + checkpoint vert.
