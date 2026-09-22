# GenSrpG — Phase 4 — Pré-audit Event Bus & utilitaires communs

Date : 2026-09-22

## 1. Gouvernance

Mission : pré-audit documentaire / diagnostic uniquement.

Branche :
`work/gensrpg-phase4-event-bus-utilities-preaudit-agent1-2026-09-22`

Checkpoint de départ créé avant tout travail :
`checkpoint/gensrpg-start-phase4-event-bus-utilities-preaudit-agent1-2026-09-22`

Checkpoint GREEN de base :
`checkpoint/gensrpg-phase4-progression-xp-first-raccord-preaudit-green-2026-09-22`

SHA exact de base :
`e85b9cb4e93c38595f29b27738a823a8ac4954bd`

Production gelée :
`main = e8681f9823573ced8aec59c8ddc47a72b02bc663`
— V16.78.114.11.

Checkpoint GREEN cible :
`checkpoint/gensrpg-phase4-event-bus-utilities-preaudit-agent1-green-2026-09-22`

Ce lot ne modifie :
- aucun runtime ;
- aucun comportement ;
- aucune formule ;
- aucun raccord ;
- aucun service Progression, Dice, Stats, Inventory ou Storage ;
- aucun `index.html` ;
- aucun mécanisme de chargement production.

Il ne crée aucun Event Bus.

## 2. Base exacte et méthode

Le gros fichier `index.html` a été contrôlé conformément à la règle 26 de la charte.

Copie locale exacte vérifiée :
- taille : **8 174 648 octets** ;
- blob Git : `2d7677950f04e9a3290ff0062e157a126123891d` ;
- commit de référence : `e85b9cb4e93c38595f29b27738a823a8ac4954bd`.

La copie utilisée provient du fichier utilisateur `index_w_11.zip` et correspond byte pour byte au blob attendu.

État de composition protégé par la cartographie actuelle :
- 95 fichiers JS physiques sous `assets/gensrpg/` + `assets/dungeon/` ;
- 77 fichiers JS atteignables par le graphe production ;
- 33 entrées JS locales directes uniques dans la composition finale ;
- 130 blocs `<script id=...>` inline cartographiés, dont 120 actifs et 10 explicitement désactivés.

Le pré-audit distingue systématiquement :
1. événements métier ;
2. notifications publiques de module ;
3. événements UI / DOM natifs ;
4. transport réseau ;
5. callbacks locaux ;
6. hooks / wrappers ;
7. timers / retries ;
8. registries métier ;
9. utilitaires purs.

La présence du mot « event », « hook » ou « listener » n'est jamais considérée à elle seule comme la preuve d'un Event Bus.

## 3. Conclusion principale

**Il n'existe actuellement aucun Event Bus générique GenSrpG unique.**

Les mécanismes événementiels réels sont hétérogènes et appartiennent à des propriétaires différents.

Créer maintenant un bus global qui recevrait indistinctement tous ces mécanismes produirait une seconde autorité transverse et violerait les principes de la charte.

Le premier micro-lot futur recommandé pour ce domaine n'est donc **pas** un Event Bus.

Le premier micro-lot réellement sûr est un **contrat d'utilitaire texte pur**, limité à l'échappement HTML déjà dupliqué à l'identique dans plusieurs propriétaires actifs.

L'étude d'un vrai transport Event Bus partagé doit rester différée jusqu'à ce qu'au moins deux modules indépendants aient un besoin métier commun prouvé, avec un producteur et un consommateur explicites qui ne possèdent pas déjà un seam direct plus simple.

## 4. Inventaire des mécanismes événementiels actuels

### 4.1 Notification métier locale Dungeon — fin d'attaque ennemie

Nom actuel :
`gensrpg:enemy-attack-resolved`

Transport :
`document.dispatchEvent(new CustomEvent(...))`

Émetteurs inline exacts : **2**.

1. `closeSpecialRoll()`
   - émet lorsque le résultat visible peut réellement être fermé ;
   - refuse de fermer tant qu'un dommage héros est encore en attente.

2. `dungeonConfirmPendingHeroDamage()`
   - applique les dégâts ;
   - ferme le résultat ;
   - rafraîchit le combat ;
   - émet ensuite le même signal de fin.

Consommateur inline exact : **1**.

Le bloc `dungeonCore303TimelineRootFix` écoute :
`gensrpg:enemy-attack-resolved`
et appelle `completeAi(T.aiToken)`.

Classification :
- événement métier **Dungeon local** ;
- rôle : synchroniser la fin réelle d'une attaque ennemie visible avec la timeline IA ;
- pas un Event Bus Core ;
- ne doit pas être déplacé en Core tant que le propriétaire timeline/combat reste Dungeon/Tactical.

Point de vigilance :
les deux émetteurs ne sont pas une preuve automatique de duplication incorrecte. Ils correspondent à deux chemins de fermeture distincts, dont l'un bloque lorsqu'un dommage doit encore être confirmé.

### 4.2 Notifications de cycle de vie Tactical

Propriétaire :
`GensRpgTacticalCombatV2Bridge`.

Deux `CustomEvent` publics sont émis :

- `gensrpg:tactical-combat-ready`
  - payload actuel : `{version}`.

- `gensrpg:tactical-combat-finished`
  - payload actuel : `{winner, summary, reason}`.

Le Bridge possède parallèlement un seam direct :
`onFinish`.

La chaîne actuelle est :
Tactical UI
→ callback local `onFinish`
→ Bridge `finishExploration()`
→ notification publique `gensrpg:tactical-combat-finished`.

Le callback et le CustomEvent n'ont donc pas la même responsabilité :
- callback : contrôle direct du cycle de fermeture Tactical ;
- CustomEvent : notification externe après traitement du Bridge.

Classification :
- notifications publiques du domaine **Tactical** ;
- candidates à un futur contrat public Tactical ;
- pas une justification suffisante pour un bus Core générique.

Un ancien garde de session V114.4, actuellement hors graphe de production, contient un listener de `gensrpg:tactical-combat-ready`. Sa présence physique ne doit pas être interprétée comme un consommateur actif actuel.

Aucun listener inline de ces deux événements Tactical n'a été trouvé dans l'index exact audité.

### 4.3 Transport réseau multijoueur historique

Le monolithe possède déjà un système nommé :
- `z40kBroadcastEvent(type,payload)` ;
- `z40kSubscribe()` ;
- `z40kHandleSharedEvent(ev)`.

Ce système utilise Supabase :
- table `z40k_sync_state` ;
- `upsert` d'un objet `{id,type,payload,ts}` ;
- abonnement `postgres_changes` filtré par `room_id`.

Types de messages émis explicitement dans l'index exact :
- `attack_roll` ;
- `armor_roll` ;
- `special_roll` ;
- `special_effect` ;
- `zombie_wave` ;
- `turn_popup` ;
- `popup_close`.

Nombre de callsites `z40kBroadcastEvent(...)` avec type littéral : **9**.
Nombre de types distincts : **7**.

Ce mécanisme possède :
- authentification ;
- identifiant de salle ;
- persistance réseau ;
- déduplication par identifiant d'événement ;
- application distante ;
- effets UI distants ;
- synchronisation d'état de partie.

Classification :
- **transport/session multijoueur existant** ;
- pas un Event Bus Core ;
- les payloads sont principalement Survival/Zombicide et UI ;
- la partie transport/session devra être reclassée lors de l'extraction Shell/multijoueur, tandis que les sémantiques métier doivent rester au module concerné.

Il serait dangereux de remplacer ce système par un Event Bus local : le transport réseau et la notification mémoire n'ont pas le même contrat.

### 4.4 Callbacks directs

Plusieurs callbacks directs sont utilisés et doivent rester distingués d'un bus.

#### Tactical UI
- `onFinish` ;
- `onCancel`.

Ils décrivent un cycle de vie local et explicite entre l'UI Tactical et son appelant.

#### Dés / animation
Les fonctions d'animation utilisent notamment `onDone`.

Ce sont des callbacks de fin d'animation ; ils ne transportent pas un événement métier global.

#### Modales / flows
Plusieurs flux utilisent `onDone` ou callbacks de fermeture.

Classification :
- hooks locaux ;
- bons seams lorsqu'il n'existe qu'un appelant direct ;
- ne doivent pas être convertis automatiquement en publish/subscribe.

## 5. Événements UI / DOM natifs

Le code contient de nombreux :
- `DOMContentLoaded` ;
- `click` ;
- `change` ;
- `input` ;
- `pointerdown` / `pointerup` ;
- `keydown` ;
- `touchstart` / `touchend` ;
- `load` ;
- `pageshow`.

Dans l'index exact, `addEventListener` apparaît 81 fois.

Ces listeners appartiennent à la couche UI ou au cycle navigateur.

Ils ne constituent pas un Event Bus métier.

Exemple explicite :
`dungeon-room-visual-hotfix-167827.js`
déclenche synthétiquement :
`new Event("change",{bubbles:true})`
pour réutiliser le cycle DOM d'un contrôle.

Classification :
- DOM natif / UI ;
- propriétaire : module qui possède le contrôle ;
- pas Core.

## 6. Événements PWA / navigateur

`service-worker.js` possède les événements natifs :
- `install` ;
- `activate` ;
- `message` ;
- `fetch`.

Le message `SKIP_WAITING` appartient au protocole Service Worker.

L'index utilise également les événements PWA/navigateur tels que :
- `beforeinstallprompt` ;
- `appinstalled` ;
- `updatefound` ;
- `statechange` ;
- `controllerchange` ;
- `pageshow`.

Classification :
- infrastructure PWA / Shell ;
- explicitement hors Event Bus métier Core.

## 7. Bibliothèques d'« événements » Dungeon

Dungeon possède un véritable concept métier d'événement de jeu :

- `dungeonBuiltinEvents()` ;
- bibliothèque RPG d'événements ;
- `triggerDungeonTurnEvent(...)` ;
- `applyDungeonTurnEvent(...)` ;
- événements de cases authored ;
- spawn, pièges, soins, loot, marchand, etc.

Ce sont des **objets de gameplay** et des résolveurs Dungeon.

Ils ne sont pas un système publish/subscribe.

Classification :
- propriétaire : Dungeon / Builders pour l'édition ;
- interdit de les déplacer dans un Event Bus Core ;
- Core peut au maximum fournir plus tard des contrats de données génériques si plusieurs modules prouvent un besoin commun, jamais la résolution Dungeon.

## 8. Registries

Plusieurs « registries » existent :
- définitions Stats ;
- sets d'équipement ;
- bibliothèques d'objets ;
- bibliothèques d'événements RPG ;
- catalogues héros/ennemis/abilities.

Un registry de données n'est pas un Event Bus.

Classification :
- propriété du domaine de la donnée ;
- Core seulement lorsque le modèle lui-même est déjà un service commun validé ;
- aucune migration supplémentaire dans ce lot.

## 9. Hooks, wrappers et monkey-patches

Le runtime historique utilise de nombreux wrappers de fonctions.

Exemples de responsabilités stratifiées déjà cartographiées :
- rendu combat ;
- timeline ;
- navigation ;
- fiches ;
- équipement ;
- Builder ;
- détection Tactical.

Un wrapper n'est pas un abonnement événementiel.

Il réécrit directement l'autorité d'une fonction.

Classification :
- dette de raccord / compatibilité ;
- à retirer uniquement lorsque le propriétaire est réellement extrait ;
- ne jamais remplacer mécaniquement ces wrappers par des messages Event Bus, car cela conserverait deux autorités au lieu d'en supprimer une.

## 10. Timers / retries

La cartographie Phase 2 a déjà démontré une forte présence de :
- `setTimeout` ;
- retries d'installation ;
- réassertions de wrappers ;
- animations ;
- watchdogs.

Un timer n'est pas un Event Bus.

Catégories à préserver séparément :
1. timing gameplay ;
2. timing animation ;
3. debounce UI ;
4. bootstrap différé ;
5. retry de compatibilité ;
6. watchdog.

Les catégories 4–6 sont souvent de la dette architecturale, mais cette dette doit être corrigée au propriétaire, pas convertie en messages asynchrones Core.

## 11. Propriétaires actuels et classification cible

| Mécanisme | Propriétaire actuel | Classe | Cible |
| --- | --- | --- | --- |
| `gensrpg:enemy-attack-resolved` | Dungeon Core 3.03 + fermeture jet/dégâts | métier local | Dungeon/Tactical seam, pas Core global |
| `gensrpg:tactical-combat-ready` | Tactical Bridge | notification publique | contrat public Tactical |
| `gensrpg:tactical-combat-finished` | Tactical Bridge | notification publique | contrat public Tactical |
| `onFinish/onCancel` Tactical | Tactical UI / Bridge | callback local | rester direct |
| `z40kBroadcastEvent` | runtime multijoueur historique | transport réseau | Shell/session + adaptateur module, pas Event Bus Core |
| `z40kSubscribe` | runtime multijoueur historique | transport réseau | Shell/session + adaptateur module |
| listeners DOM | chaque UI/module | UI native | rester module-local |
| Service Worker events | PWA | infrastructure | Shell/PWA |
| événements de tour Dungeon | Dungeon | gameplay | Dungeon |
| événements authored | Dungeon/Builders | gameplay/authoring | Dungeon + Builders |
| timers d'animation | UI/Dice/Tactical | animation | propriétaire UI |
| retries de wrappers | compatibilité historique | dette | suppression au raccord, pas bus |
| registries Stats/Equipment | domaine concerné | données | service propriétaire existant |
| navigation globale future | Shell | cycle application | Shell, pas Core gameplay |

## 12. Risques de double autorité

### R1 — Callback + bus sur la même fin Tactical

Le flux Tactical possède déjà :
- callback direct pour contrôler la fermeture ;
- notification publique de fin.

Créer un nouveau bus intermédiaire entre les deux sans retirer un propriétaire produirait potentiellement :
- double commit ;
- double popup ;
- double récompense ;
- double notification.

Le callback direct doit rester l'autorité de cycle tant qu'un contrat de remplacement n'est pas explicitement validé.

### R2 — Deux émetteurs Dungeon pour la même notification

`gensrpg:enemy-attack-resolved` est émis depuis :
- fermeture simple du jet ;
- confirmation de dommages.

Les fusionner ou republier sans conserver leurs préconditions pourrait avancer deux fois la timeline IA.

### R3 — Confondre réseau et mémoire locale

`z40kBroadcastEvent` persiste/transporte à travers Supabase.

Un Event Bus local ne garantit :
- ni livraison distante ;
- ni déduplication ;
- ni auth ;
- ni room ;
- ni état persistant.

Les deux ne sont pas interchangeables.

### R4 — Utiliser un bus pour masquer les problèmes de lifecycle

Les observers, retries et listeners globaux historiques ne doivent pas être redirigés vers un bus comme stratégie de réparation.

Le bon objectif reste :
- un propriétaire ;
- install explicite ;
- dispose explicite ;
- appel direct lorsqu'un appelant unique suffit.

### R5 — Transformer le DOM en API métier

Les événements `click`, `change`, `pointer*` ou `DOMContentLoaded` sont des détails UI/navigation.

Les republier sous forme d'événements Core dupliquerait l'UI dans le domaine commun.

## 13. Candidats utilitaires communs

### 13.1 Candidat sûr — échappement HTML pur

Plusieurs propriétaires actifs possèdent la même transformation pure :

`String(value ?? "").replace(/[&<>"']/g, ...)`

Elle est notamment dupliquée dans :
- World Builder ;
- Room Creator ;
- Stats UI ;
- Tactical Stats ;
- autres éditeurs Dungeon.

Caractéristiques :
- déterministe ;
- aucun DOM ;
- aucun stockage ;
- aucun état global ;
- aucun gameplay ;
- aucun RNG ;
- aucune temporisation ;
- aucune connaissance de module.

C'est le meilleur premier candidat du domaine « utilitaires communs ».

### 13.2 `num` / conversion numérique

Très dupliqué :
`Number.isFinite(Number(v)) ? Number(v) : fallback`.

Cependant il ne doit pas être sélectionné en premier.

Raison :
les services Dice ont déjà démontré que la coercion historique et les contrats stricts du Core peuvent volontairement diverger sur :
- `undefined` ;
- `NaN` ;
- infinities ;
- chaînes/coercions.

Centraliser `num` trop tôt pourrait modifier des frontières de gameplay.

### 13.3 `clamp`

Très dupliqué et pur, mais ses bornes appartiennent souvent au domaine :
- chance ;
- HP ;
- dodge ;
- stats ;
- coordonnées ;
- tailles UI.

La fonction mathématique est triviale ; son extraction ne doit pas inciter à déplacer les politiques de bornes dans Core.

Candidat possible plus tard, non prioritaire.

### 13.4 clone JSON

Plusieurs helpers utilisent `JSON.parse(JSON.stringify(...))`, mais leurs contrats diffèrent :
- certains catchent l'erreur ;
- certains retournent la valeur d'origine ;
- certains traitent `null` explicitement ;
- d'autres laissent l'exception remonter.

Pas candidat au premier micro-lot.

### 13.5 `arr` / `str`

Helpers courts particulièrement présents dans Tactical.

Ils sont essentiellement des convenances locales.

Les centraliser créerait plus de couplage qu'ils n'en retireraient.

Pas candidats.

## 14. Éléments explicitement NON candidats Core Event Bus

Ne doivent pas entrer dans un éventuel Event Bus Core :

- clics/pointers DOM ;
- `DOMContentLoaded` ;
- événements Service Worker ;
- PWA install/update ;
- événements Dungeon de gameplay ;
- bibliothèque d'événements RPG ;
- pièges / coffres / spawn ;
- résultats de dés comme animations ;
- timers/retries ;
- MutationObservers ;
- navigation Shell ;
- callbacks à appelant unique ;
- Supabase Realtime ;
- auth/session réseau ;
- stockage des messages réseau ;
- registries métier ;
- wrappers de compatibilité ;
- rendu Tactical ;
- résolution de combat ;
- récompenses ;
- progression/XP.

## 15. Faut-il créer un Event Bus Core maintenant ?

**Non.**

Preuve actuelle :
- un événement local Dungeon a un producteur/consommateur précis ;
- Tactical possède deux notifications publiques propres à son domaine ;
- le réseau historique possède déjà un transport Supabase spécialisé ;
- le reste est majoritairement DOM, callback direct, gameplay ou dette de lifecycle.

Aucun besoin n'a été démontré où :
1. plusieurs modules indépendants ;
2. doivent consommer le même événement métier ;
3. sans qu'un contrat direct soit plus simple ;
4. et sans qu'un propriétaire public existe déjà.

Créer un `publish/subscribe` générique à ce stade serait spéculatif.

## 16. Premier micro-lot futur recommandé

### U1 — Core Text Utility v1 / échappement HTML pur

But :
créer uniquement un petit contrat pur, par exemple :

`assets/gensrpg/core/text-utils-v1.js`

API initiale unique proposée :
`escapeHtml(value)`.

Le nom de fichier/API exact pourra être validé par le coordinateur avant RED.

Contrat comportemental à préserver :
- `null` / `undefined` → chaîne vide ;
- conversion via `String(...)` ;
- `&` → `&amp;` ;
- `<` → `&lt;` ;
- `>` → `&gt;` ;
- `"` → `&quot;` ;
- `'` → `&#39;` ;
- autres caractères inchangés.

Ce premier lot doit être **contrat pur et inert uniquement**.

Il ne doit raccorder aucun consommateur dans le même commit/lote.

Pourquoi ce choix :
1. comportement déjà dupliqué à l'identique ;
2. aucune règle gameplay ;
3. aucune dépendance DOM ;
4. aucune dépendance Storage ;
5. aucune concurrence avec Progression/Dice/Stats/Inventory ;
6. aucune nouvelle architecture événementielle spéculative ;
7. rollback trivial ;
8. permet de définir le standard des futurs utilitaires Core avant de toucher aux seams plus sensibles.

## 17. TDD proposé pour U1

### RED

Créer une sentinelle dédiée qui exige :
1. existence du service pur ;
2. export public explicite ;
3. aucune auto-installation ;
4. aucun DOM ;
5. aucun storage ;
6. aucun listener ;
7. aucun event dispatch ;
8. aucun timer/retry ;
9. aucun RNG ;
10. aucune navigation ;
11. aucun gameplay.

Matrice de parité :
- `null` ;
- `undefined` ;
- chaîne vide ;
- nombres ;
- booléens ;
- texte normal ;
- `&` ;
- `<` ;
- `>` ;
- guillemet double ;
- apostrophe ;
- chaînes contenant les cinq caractères ;
- chaîne déjà échappée, afin de préserver le comportement historique de double échappement.

Comparer la sortie aux implémentations actives représentatives sans les modifier.

### GREEN

Créer uniquement le service pur.

Le service doit rester :
- hors `index.html` ;
- hors `preview.html` ;
- hors injection Pages ;
- hors runtime bootstrap ;
- hors Service Worker si le contrat de Phase 4 inert le requiert.

Le graphe production doit rester inchangé.

### Lot suivant, séparé

Seulement après GREEN du contrat :
- sélectionner **un seul consommateur UI à faible risque** ;
- caractériser sa parité ;
- raccorder ce consommateur ;
- retirer son implémentation locale ;
- valider navigateur.

Ne pas raccorder World Builder + Room Creator + Stats + Tactical dans un seul lot.

## 18. TDD futur si un Event Bus devient réellement nécessaire

Ce lot n'est **pas sélectionné maintenant**.

Avant toute création future d'un bus, un nouveau pré-audit doit prouver :
- nom d'événement exact ;
- propriétaire producteur ;
- au moins deux consommateurs légitimes ;
- payload versionné ;
- synchronicité attendue ;
- ordre attendu ;
- gestion d'erreurs ;
- cycle install/dispose ;
- comportement si aucun listener ;
- comportement si un listener échoue ;
- absence de doublon avec callback direct ;
- absence de transport réseau implicite ;
- aucune dépendance DOM.

Un bus futur ne devra pas utiliser le DOM comme transport interne par défaut.

## 19. Frontières à ne pas franchir

Pour le présent domaine :

- ne pas toucher au lot Progression en cours ;
- ne pas toucher Dice ;
- ne pas toucher Stats ;
- ne pas toucher Inventory/Equipment ;
- ne pas toucher Storage ;
- ne pas modifier `index.html` ;
- ne pas connecter un nouveau service ;
- ne pas modifier les événements Tactical existants ;
- ne pas modifier `gensrpg:enemy-attack-resolved` ;
- ne pas modifier le multijoueur Supabase ;
- ne pas ajouter de listener global ;
- ne pas ajouter de wrapper ;
- ne pas ajouter de MutationObserver ;
- ne pas ajouter de timer/retry ;
- ne pas corriger les dettes observées dans ce pré-audit ;
- ne pas fusionner dans `main`.

## 20. Sentinelle de pré-audit

Sentinelle structurelle/documentaire :
`tests/gens_phase4_event_bus_utilities_preaudit_v1.test.cjs`.

Elle verrouille notamment :
- blob/taille exacts de l'index audité ;
- inventaire de la notification Dungeon locale ;
- transport réseau `z40kBroadcastEvent/z40kSubscribe` ;
- les 7 types de messages réseau littéraux ;
- les deux notifications Tactical ;
- callbacks directs Tactical ;
- distinction événement DOM synthétique ;
- événements natifs Service Worker ;
- duplication représentative de l'échappement HTML ;
- absence d'infrastructure Event Bus dans plusieurs services Core purs existants.

Elle ne réimplémente aucun gameplay.

## 21. Verdict

Le domaine « Event Bus / utilitaires communs » ne doit pas démarrer par un bus.

L'état réel montre quatre catégories indépendantes :
1. notification métier locale Dungeon ;
2. lifecycle public Tactical ;
3. transport réseau Supabase ;
4. DOM/PWA/callbacks locaux.

Les réunir aujourd'hui sous un `publish/subscribe` Core créerait une autorité artificielle.

Le premier lot réellement sûr est donc :

**U1 — contrat pur d'échappement HTML commun, inert, sans aucun raccord runtime.**

Ensuite seulement, un raccord unique pourra être choisi.

La question d'un Event Bus Core devra être réouverte plus tard uniquement si un besoin inter-module concret et partagé est démontré.

Aucun runtime n'a été modifié par ce pré-audit.
