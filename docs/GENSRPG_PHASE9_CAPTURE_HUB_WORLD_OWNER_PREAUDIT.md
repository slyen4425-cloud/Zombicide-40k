# GenSrpG — Phase 9 — Préaudit ownership Hub / Monde Monster Capture

Date : 2026-10-09. **Périmètre documentaire, aucun changement runtime.**

## Départ vérifié

- Checkpoint GREEN fonctionnel : `checkpoint/gensrpg-phase9-capture-screen-return-owner-transfer-green-2026-10-08`.
- SHA de départ : `8b33eddbc8e57453e7cf5159c07e04762aa64827`.
- Checkpoint de démarrage : `checkpoint/gensrpg-start-phase9-capture-hub-world-owner-preaudit-2026-10-09`, même SHA.
- Branche isolée : `work/gensrpg-phase9-capture-hub-world-owner-preaudit-2026-10-09`.
- CI du point de départ : Architecture + Browser `37838853571` SUCCESS ; Firefox `37838853606` SUCCESS ; Tactical `37838853693` SUCCESS.
- Validation smartphone utilisateur (8 octobre 2026) : retour Capture / parcours testé et Builder OK.
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Périmètre architectural et provenance

Sources légères consultées sur le checkpoint :
- `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md` : Capture autonome possède monde/exploration, UI et lifecycle, sans identité Dungeon ni runtime Survie ;
- `docs/GENSRPG_PHASE9_CAPTURE_SCREEN_RETURN_OWNER_TRANSFER_REPORT.md` : le dernier lot a extrait **l'enregistrement** du retour vers le Hub ; le rendu `captureEnterWorld139()` reste explicitement inchangé dans la closure historique ;
- `assets/gensrpg/capture/screen-return-v1.js` : délégation explicite `bindings.enterWorld()`, garde session active + identité Capture ;
- `assets/gensrpg/capture/entry-v1.js` : entrée publique distincte `isProfile/startModuleSession` ;
- `assets/gensrpg/capture/module-contract-v1.json` : Capture possède ses services de session/retour, mais demeure `partial-runtime-loaded` ;
- `tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs`, `tests/gens_phase5_gomenu_e2e_browser_v1.test.cjs`, `tests/gens_capture_current_shell_browser_v11411.test.cjs` et `tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs` : non-régression des transitions à conserver.

**Conclusion avérée :** la frontière de retour écran et le démarrage sont déjà possédés par les fichiers Capture dédiés. Le rendu / entrée dans le Hub-Monde reste lié à `captureEnterWorld139()` dans le gros historique `index.html`. Il ne faut ni déplacer à nouveau le provider de retour ni supposer qu'une simple copie du renderer rend Capture autonome.

**Question non résolue :** quels morceaux de `captureEnterWorld139()` sont UI, modèle monde, stockage, reprise, effets de bord ou couplages Dungeon ? Ce préaudit documentaire ne suffit pas à choisir un seam. Les précédents scans `isDungeonMode()` (~126 appels historiques) ne justifient aucun nettoyage global.

## Vérification Rule 26 préalable à toute inspection / mutation du gros index

Le checkpoint actuel référence `index.html` taille **8 165 823 octets**, blob Git **`26421e0347305437fe2b1dc149b3e4fb8b3761bd`** (rapports et sentinelles de la dernière extraction).

Lien immuable pour une prochaine inspection exacte :
https://github.com/slyen4425-cloud/Zombicide-40k/blob/8b33eddbc8e57453e7cf5159c07e04762aa64827/index.html

La copie `indexH.txt` reçue pour le **lot précédent** (8 165 794 octets, blob `462abc...`) n'est **pas** le runtime actuel. La charte §26 impose de télécharger / recevoir le fichier exact du nouveau checkpoint, puis de comparer taille et Git blob **avant** de lire les corps historiques. Interdit de reconstruire l'index courant par approximation ou de transporter ses ~8 Mo via GitHub API.

## Prochaine séquence bornée

1. Cartographier dans l'index vérifié les appels entrants de `captureEnterWorld139()` et le corps propriétaire réel ; classer UI / monde / stockage / session / Hub / navigation.
2. Déterminer si la première extraction sûre peut être une interface **owner-local** Capture minuscule et testable ; si aucune extraction sûre ne ressort, conclure sans mutation runtime.
3. Définir une seule autorité après migration, un seul seam, un RED TDD prouvant la propriété historique, puis son GREEN sans supprimer les gardes Capture.
4. Ajouter une preuve de rollback byte-exact ; maintenir les anciennes E2E de retour/reprise, création du monde et absence de contamination Dungeon/Survie/PvP, y compris Builder Dungeon.
5. Travail runtime uniquement dans **un nouveau lot séparé** après checkpoint GREEN de ce préaudit, jamais dans ce lot d'étude.
6. Exiger triple CI sur HEAD exact, preview smartphone, validation utilisateur avant tout checkpoint final fonctionnel.

## Interdictions et invariants

Aucune modification de `index.html`, `capture/entry-v1.js`, `capture/screen-return-v1.js`, du démarrage SessionStart, des sauvegardes, données creatures, combats, Dungeon, Survie, Tactical, PvP ou labos. Aucun nouveau `goMenu`, wrapper, observer, timer, polling, seconde autorité de navigation / stockage, fallback inter-module, reformat du gros index ni merge/deploy `main`.

**État : préaudit documentaire lancé, propriétaire Hub exact non encore caractérisé ; aucun runtime modifié.**


## Règle 26 — fichier exact reçu et contrôlé

L'utilisateur a fourni `worki.zip`, qui contient `indexI.txt`.
- Décompression réussie : **8 165 823 octets** ;
- empreinte Git blob SHA-1 : **`26421e0347305437fe2b1dc149b3e4fb8b3761bd`** ;
- SHA-256 du contenu : `89704c9587837a65f18d6b5925a1c566f95426aad4461e0c815dd83a39da7d72` ;
- référence du checkpoint source : `8b33eddbc8e57453e7cf5159c07e04762aa64827`.
- Le commit documentaire d'ouverture `403dc14a0084db7e144a518c62b82573b42e3030` n'a pas touché le fichier `index.html`. Les premiers runs sur ce commit ont été vérifiés GREEN : Architecture + Browser `37913279541`, Firefox `37913279456`, Tactical Dock `37913279515`.

## Localisation exacte des propriétaires et graphe d'appels

Caractérisation faite sur les **octets réels** reçus, pas par déduction d'un ancien rapport.

1. `captureFix139`, lignes 27037–27092 : `window.captureEnterWorld139=function(){...}` aux lignes 27043–27057. Le corps ne fait que l'orchestration UI :
   - fermer la popup de tour, sans bloquer si une erreur survient ;
   - masquer sept panneaux `pregameSetup`, `sessionHeroSetup`, `sessionObjectSetup`, `sessionWaveSetup`, `sessionDungeonSetup`, `sheet`, `setup`, avec `display:none!important` ;
   - afficher `menu`, appeler `renderMenuStatuses()` puis `renderCaptureWorldHub()`, chacune des deux invocations protégée contre une erreur ;
   - forcer `captureGameHub` visible, puis défiler vers lui dans `requestAnimationFrame`.
2. Dans ce fichier, **une seule définition** de `window.captureEnterWorld139`, et **deux appels** via les dépendances `enterWorld:()=>captureEnterWorld139()` :
   - `GensCaptureSessionStartV1.install(...)` (Capture139, ligne 27079) ;
   - `GensCaptureScreenReturnV1.install(...)` (Capture139, ligne 27089).
   Les deux modules propriétaires sont déjà installés ; il ne faut pas recréer le lancement ni le registre de retour Shell.
3. `renderCaptureWorldHub()` est une **autre autorité**, définie dans le runtime historique (lignes 6815–6840) : elle appelle `captureEnsureStarterKitsForParticipants()` **deux fois**, `captureEnsureDefaultLocations()`, lit `captureWorldState()`, le héros et l'économie, et construit l'UI du monde, des tours, de l'équipe et des rencontres. Elle n'est **pas** un renderer purement visuel ; son extraction exige un lot distinct de propriété données/services/effets.
4. `gensStability151` enveloppe encore `window.renderCaptureWorldHub` (lignes 28102–28111), le bloque hors `gensMode151()==="capture"`, et cache le Hub lorsqu'un autre module est actif. Ce garde continue à protéger Dungeon / Survie : **ne pas le supprimer dans un lot de transition UI**.
5. `captureFix138` détient encore un wrapper legacy `window.startConfiguredGame` (lignes 26903–26920) avec un `setTimeout(...,30)` qui effectue un autre rafraîchissement vers le Hub. Il faut qualifier si cette voie est réellement atteignable via le Shell actuel **avant tout retrait** : l'existence du code ne prouve pas sa redondance.

## Sentinelle de caractérisation ajoutée

`tests/gens_phase9_capture_hub_world_owner_characterization_v1.test.cjs` :
- échoue si la taille / le Git blob de l'index change, ou si la propriété et les appels existants divergent sans migration délibérée ;
- localise le corps historique réel et l'exécute en VM **sans le réécrire** ; vérifie le masquage de chaque panneau exactement une fois, l'ordre rendu / menu, l'affichage puis le scroll asynchrone ;
- vérifie aussi le cas DOM incomplet et les erreurs tolérées, sans espionner ni modifier de stockage ;
- caractérise la garde V151 et le second chemin legacy V138 pour interdire une suppression silencieuse ;
- n'introduit aucune autorité en production.

**Résultat local du test VM : GREEN**, 14 événements attendus sur la transition normale, gestion des absences de DOM et des erreurs conservée. La CI GitHub du commit contenant cette sentinelle doit encore confirmer le même résultat.

## Décision de frontière et prochain lot potentiel

Le premier micro-lot runtime viable **à examiner en TDD séparé** est la seule orchestration UI de `captureEnterWorld139`, à déplacer sous un propriétaire explicite Capture avec `install()/dispose()` et des dépendances injectées, **en retirant la définition legacy au même commit**. Condition : aucune seconde inscription Shell ; SessionStart et ScreenReturn doivent appeler une unique interface d'entrée dans le Hub, sans réimplémenter `renderCaptureWorldHub`.

Le déplacement du renderer complet, la mutation d'état monde/kits/lieux, le garde V151, le wrapper de lancement V138 et la gestion du stockage **ne font pas partie de ce micro-lot**. Le chemin réel doit être testé en navigateur avec démarrage, retour, reprise, anciennes sauvegardes Capture, changement de module et Dungeon Builder. Préparer RED, rollback byte-exact, CI et preview smartphone **avant validation de tout chantier runtime**.

**Statut de ce lot : préaudit et sentinelle, pas de changement runtime.**
