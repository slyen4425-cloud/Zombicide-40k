# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — intégration preview/PWA après Talent

- Fil directeur : **COORDINATEUR actif**.
- Branche : `work/gensrpg-integrate-preview-pwa-after-talent-2026-09-17`.
- Base exacte : checkpoint vert Talent post-4K `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Checkpoint Talent : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`.
- Production sûre `main` : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

## Combat 4K fermé vert

Checkpoint : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17`.

SHA : `c672726b69aa5895d252e2f31084c20740bcc699`.

Inventaire après 4K :

- `dc200StartCombat` : 1 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 4 — définition historique, alias, `cell`, `ambush`.

Ne pas chercher à réduire ces compteurs artificiellement. Le prochain lot combat reste **4L — `ambush` uniquement** ; `cell` reste séparé.

## Talent post-4K — intégré et vert

Le correctif Talent a été reporté proprement depuis la branche Agent 1 sur la base 4K, après caractérisation rouge sur cette base.

Cause : `renderDungeonSkillTree()` écrivait la visibilité de `#dungeonSkillTreePanel`, alors que `applyDungeonSheetTabs()` en est le propriétaire canonique.

Correction : retrait uniquement de cette écriture de visibilité ; aucun Observer, timer, retry, wrapper de réparation ou second renderer ajouté.

Checkpoint vert :

`checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`

SHA exact :

`c52fd9abf8f19c345d1cd7088e86ae3179b42401`

Le SHA final Talent a été validé par : régression Talent dédiée, architecture + Chromium/preview et Firefox.

## Preview/PWA post-Talent — caractérisation

Test permanent :

`tests/gens_preview_chrome_firefox_pwa_characterization_v11411.test.cjs`

Workflow lecture seule :

`.github/workflows/gensrpg-preview-pwa-post-talent.yml`

Caractérisation avant correction :

`59b027209ca23b3b741fc5ae89910ba21051550f`

Run rouge attendu : `35250790568`.

Résultat reproduit :

- profil neuf Chromium : `index.html` frais chargé ;
- profil neuf Firefox : `index.html` frais chargé ;
- avec Service Worker/cache GenSrpG préexistant, Chromium et Firefox pouvaient charger l'ancien `index.html` en cache ;
- la preview lançait la suppression des caches `gensrpg-cache-*` sans l'attendre avant `fetch('index.html')`.

Cette caractérisation prouve une course dans **`preview.html`**. Elle ne doit pas être présentée comme preuve définitive que le symptôme Chrome Android réel en production avait exactement cette cause.

## Correction preview/PWA

Correction homogène et limitée à `preview.html` :

- récupérer les clés de cache avant le chargement de la source ;
- attendre la suppression de tous les caches `gensrpg-cache-*` ;
- seulement ensuite exécuter `fetch('index.html', {cache:'no-store'})`.

Commit runtime preview :

`48f1f50261a88b71bce30fa520bffeeedaa9ff36`

Diff technique depuis le checkpoint Talent :

1. `preview.html` — +4 lignes ;
2. `tests/gens_preview_chrome_firefox_pwa_characterization_v11411.test.cjs` ;
3. `.github/workflows/gensrpg-preview-pwa-post-talent.yml`.

Aucun `index.html`, gameplay, combat, déplacement, stats, XP, sauvegarde, dock Tactical ou Bridge n'est modifié par ce lot.

## Validation technique preview/PWA

Sur `48f1f50261a88b71bce30fa520bffeeedaa9ff36` :

- test stale-cache Chromium/Firefox — **success**, run `35253552569` ;
- architecture + Chromium/preview — **success**, run `35253552456` ;
- Firefox — **success**, run `35253552690`.

Les présents documents créent maintenant le SHA final documentaire. Ce nouveau SHA doit être revalidé intégralement avant checkpoint.

Checkpoint cible :

`checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17`

## Suite après checkpoint preview/PWA

1. vérifier une dernière fois `main` = `e8681f9823573ced8aec59c8ddc47a72b02bc663` ;
2. créer le checkpoint vert preview/PWA sur le SHA documentaire exact validé ;
3. reprendre ensuite Combat **4L — `ambush` uniquement** depuis ce checkpoint ;
4. caractériser `ambush` avant toute modification ;
5. conserver `cell` hors de 4L.

## Jalon UI utilisateur protégé

Dock Tactical `Attaquer / Fin du tour / Capacité` :

- checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` ;
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` ;
- validation utilisateur : « parfait ras tout fonctionne très bien ».

Ne pas casser ce jalon.

## Jalons directeurs verts précédents

- Talent post-4K : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` — `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Combat 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` — `c672726b69aa5895d252e2f31084c20740bcc699`.
- Combat 4J : `checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17` — `b8f5b14f0651479165d35545f3a22db6df8d391f`.
- Combat 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`.
- Combat 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, petit lot homogène, aucun mécanisme de réparation, tests permanents, checkpoint vert sur le SHA exact validé, puis mettre les documents de reprise à jour avant le chantier suivant.
