# GenSrpG — Candidat de test manuel vert

Date : 2026-09-16

Ce jalon est destiné au test manuel sur téléphone avant la migration des points d'entrée historiques du gros `index.html`.

## Validation automatisée

GitHub Actions run : `35034494407`

- architecture-sentinels : success ;
- browser-sentinel : success ;
- composition preview = composition GitHub Pages (19 modules, même ordre) ;
- loader preview mobile Chromium : success ;
- UI native V114.11 : success ;
- rendu canonique des murs : success ;
- Bridge `requestCombat()` protégé directement par le scope/détection V113 : success.

## Base de production

`main` reste sur la V16.78.114.11 sûre (`e8681f9823573ced8aec59c8ddc47a72b02bc663`).

Le candidat de test ne doit pas remplacer la production avant validation manuelle des mouvements, fiche héros, Save & Quit/reprise, combats, détection, murs et retour exploration.
