# GenSrpG — Candidat de test manuel vert

Date : 2026-09-16
Commit candidat validé : `656e020f3b7052cff63f00a4af1cc2a493ed9b3e`
Run GitHub Actions : `35034494407`

Ce commit est le jalon manuel à tester avant de poursuivre la migration des points d'entrée historiques du gros `index.html`.

Validation :
- architecture-sentinels : success ;
- browser-sentinel : success ;
- composition preview = GitHub Pages (19 modules, même ordre) ;
- loader preview mobile Chromium : success ;
- UI native V114.11 : success ;
- rendu canonique des murs : success ;
- Bridge `requestCombat()` protégé directement par le scope/détection V113 : success.

`main` reste sur la V16.78.114.11 sûre (`e8681f9823573ced8aec59c8ddc47a72b02bc663`).
