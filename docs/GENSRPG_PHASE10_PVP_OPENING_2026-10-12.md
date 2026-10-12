# Phase 10 / S0 — Autorité de session PvP autonome

Date : 12 octobre 2026. Branche : `work/gensrpg-phase10-pvp-ownership-bootstrap-2026-10-12`.

La carte Duel/PvP du Hub reste intentionnellement **« PVP — À VENIR »**. Aucune session réelle, aucun combat ni UI PvP n'existait lors de l'ouverture de la Phase 10 : `entry-v1.js` était un stub inerte et `module-contract-v1.json` un contrat non chargé.

Ce premier lot ajoute `assets/gensrpg/pvp/session-v1.js` comme **propriétaire privé d'état de session** testable sur demande ; ce fichier **n'est PAS chargé en production**. Son installation et démarrage nécessitent un adapter explicite : `activeModule() === "pvp"`. Ses données de participants par camp et règles sont données par configuration, clonées et gelées ; aucune formule de combat n'est inventée. Arrêt et destruction n'ont aucune autorité sur le Shell ni les autres modules. Contrat : `session-contract-v1.json`.

Sentinelle déterministe : `tests/gens_phase10_pvp_session_owner_v1.test.cjs`. Elle protège l'absence d'auto-install, d'accès au DOM/stockage ou d'effet sur les globals étrangers, la garde du mode PvP, l'immuabilité des règles, les camp/participants sans doublons, l'arrêt/dispose et l'absence de double session. Ajoutée aux tests d'architecture.

**Non réalisé / ne pas sur-vendre :** aucun raccord Shell, aucune sauvegarde PvP persistée, aucune UI, aucun calcul de dégâts/initiative, aucun combat jouable. Ces propriétés doivent être ajoutées ultérieurement via API Core/contrats configurables et le vrai parcours utilisateur ; l'accès exact à `index.html` suivra impérativement la charte §26.

Base de départ : `7c01025a88bbdd0fb5ecc4bf534d0f0c3a4c9912`, checkpoint `checkpoint/gensrpg-start-phase10-pvp-ownership-bootstrap-2026-10-12`. `main` gelée, laboratoires intacts. CI requise : Architecture/Chromium, Firefox, Tactical, même SHA.
