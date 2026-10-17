# Phase 12 — Dungeon Tactical V108 / raccord d'activation — correctif borné

**Statut : EN COURS / NON GREEN** — 17 octobre 2026.

Diagnostic utilisateur : pendant Dungeon, après déplacements initiaux, menus Attaque/Arme/Objet manquants et frappes/animations anormales. Les scripts de combat n'ont pas été changés par les extractions R01–R05.

Base §25 : `7ac97a36df9f31f2cc3f7640e857ffc59963574c`, checkpoint `checkpoint/gensrpg-start-phase12-dungeon-tactical-v108-activation-lifecycle-fix-2026-10-17`, branche `work/gensrpg-phase12-dungeon-tactical-v108-activation-lifecycle-fix-2026-10-17`. R05 code `a832da1cbbad39c446f46f1035dbb819aa60ec20` intact ; index 2 781 436 octets / blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`.

Cause étayée par [run 39014482141](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39014482141) : `GensRpgTacticalPolish1678108` est installé avant l'UI lazy-loaded ; `GensRpgTacticalCombatV2Ui.render.__gensRpg108Polish` reste absent, et le panneau disparaît après re-rendu. Un appel manuel d'`install()` dans le test, sans modifier le runtime, fait apparaître le panneau et permet l'attaque normale avec animation de dés, pause `Continuer`, puis dés ennemis.

Correctif projeté : **seulement la jointure après activation de toutes les couches dans `assets/gensrpg/tactical/entry-v1.js`**, avant le callback de lancement. Utiliser le propriétaire UI V108 existant, sans démarrer de nouvel observateur/intervalle ni toucher aux règles des portées, déplacements, dégâts, résistance, sauvegardes, IA ou dés.

Tests à passer sur un même SHA : diagnostic STRICT sans appel manuel, rapprochement légitime puis attaque à portée, sélecteurs attaque/arme/objet visibles, animation des dés héros puis ennemis arrêtée tant que `Continuer` n'est pas appuyé ; Architecture/Chromium, Firefox, Tactical. Aucune déclaration de réparation utilisateur avant retest Android. R06 suspendu. Aucune publication sur `main`.
