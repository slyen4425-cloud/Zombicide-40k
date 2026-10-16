# GenSrpG — CURRENT_WORK LIVE (16 octobre 2026)

**Phase 12 : D1–D9 + R01 GREEN ; audit R02 du grand monolithe ouvert, PAS d'extraction R02. D10 Core203 suspendu.**

## Dernier GREEN — R01 manifeste PWA

- Triple CI SUCCESS même SHA **`1b0fa3a718059242507d3e95de45033bba57ea24`** : [Architecture 38897048039](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897048039), [Firefox 38897047733](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047733), [Tactical 38897047747](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047747).
- Checkpoint final `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16` sur ce SHA.
- `c4.zip` certifié D9 : 7 703 979 octets. Extraction byte-identique du manifeste PWA (734 440 octets) ; index R01 **6 969 593 octets** / Git blob **`caf31c121d926b7b76b9bb05688fab8f2839814e`** ; net **−734 386 octets**. Pré-cache PWA ajusté. Test manuel Android installation/mise à jour encore conseillé avant mise en production.

## Chantier courant R02 — bornage uniquement

- **Base §25** : SHA R01 GREEN `1b0fa3a718059242507d3e95de45033bba57ea24` ; checkpoint de départ `checkpoint/gensrpg-start-phase12-r02-megablock-boundary-audit-2026-10-16` créé avant toute édition ; branche dédiée `work/gensrpg-phase12-r02-megablock-boundary-audit-2026-10-16`.
- **Source §26 certifiée** : `c5.zip` / `index.html(14).txt`, **6 969 593 octets**, blob `caf31c121d926b7b76b9bb05688fab8f2839814e`.
- **Grand script anonyme** : 5 364 441 octets / blob `181ec13091f7dfeb5dde173af99dbe1aeecb07c2`, cinq images data URI = 4 100 280 caractères base64 ; autre JS/texte ~1 264 047 octets. Survie / Dungeon / Capture / Shell / IndexedDB / éditeurs sont mêlés.
- **Décision** : aucun déplacement mécanique des 5,36 Mo ni création de propriétaire fictif. Caractériser les références d'image et les frontières de responsabilités, l'ordre parser et les handlers, puis préparer des sous-lots réversibles par propriétaire. Les scripts Core numérotés restent dépriorisés.
- **Document source R02** : `docs/GENSRPG_PHASE12_R02_MEGABLOCK_BOUNDARY_2026-10-16.md`. Audit général A/B/C : `docs/GENSRPG_PHASE12_REMAINING_INLINE_EXIT_BOUNDARY_AUDIT_2026-10-16.md`.
- **Protections** : `main` gelé SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; laboratoires, modes, sauvegardes, icônes PWA et 32 images Survie inchangés.
- **Tests à effectuer avant toute extraction** : références/exports des cinq images, navigateur vrai parcours, rollback byte-exact, Architecture/Chromium + Firefox + Tactical SUCCESS au même SHA et checkpoint final GREEN après contrôle. Aucun runtime R02 testé ou modifié à ce stade.

## Bilan Phase 12

**D1–D9 + R01 = 965 159 octets de JS externalisés ; 964 611 octets nets supprimés d'index.html.** La Phase 12 EXIT reste ouverte. Prévoir regroupements cohérents (audit initial estimait 12–20 lots, non garanti), pas 80–100+ micro-lots.
