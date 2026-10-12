# GenSrpG — Phase 10 S1 : provider Shell PvP (non composé)

Date : 12 octobre 2026. Base S0 et checkpoint d'entrée : checkpoint/gensrpg-phase10-pvp-session-s0-green-2026-10-12 au SHA 2a464acab5ed8080bbc9081d148742c72ee7773c.

Checkpoint S1 de départ : checkpoint/gensrpg-start-phase10-pvp-shell-provider-s1-2026-10-12.
Branche de travail : work/gensrpg-phase10-pvp-shell-provider-s1-2026-10-12.

## Portée

Le nouveau module assets/gensrpg/pvp/module-launch-v1.js expose un provider qui ne s'enregistre qu'avec install({shell,session,...}) explicite, vérifie activeModule() === 'pvp', prépare des sessions données par l'appelant, et délègue les opérations à GensPvpSessionV1. Aucun moteur de combat, aucune UI et aucune formule de règles ne sont ajoutés.

Le Shell courant n'expose pas de contrat unregister confirmé : après dispose, le callback enregistré devient inerte et tout nouveau register dans la même page est interdit, sans surcouche ou double autorité.

Le provider demeure non composé en production. La vignette « PVP — À VENIR » n'est pas modifiée. Le futur vrai raccordement de l'index exige la copie exacte selon §26, puis des sentinelles navigateur et un test manuel.

## Critère GREEN

Node VM déterministe avec DOM et stockage interdits, absence de mutation des globals étrangers, parcours PvP seul, start/stop/dispose, immutabilité, garde d'identité, aucune composition automatique, sentinelle historique du placeholder et triple CI au même SHA.
