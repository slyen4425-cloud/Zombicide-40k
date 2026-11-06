# Monster Capture — audit du multijoueur déjà présent dans Survie (2026-11-06)

## Contexte, branche et autorité
- Audit en lecture seule du code de production `main@916099fa5c7466361592b4655e72571bb259b29f`.
- Reprise du lot source sur `work/gensrpg-capture-session-multiplayer-contract-2026-11-06`, checkpoint START `checkpoint/gensrpg-start-capture-session-multiplayer-contract-2026-11-06` @ `7d7f1f20eb16f10fc28f75f15b68d287954f2a13`. PR #294 **draft, non publiée**.
- Charte §1, §3, §24, §25, §27 : Core réseau partagé réutilisable par des interfaces **distinctes** ; autorité du gameplay Monster Capture, Combat et Exploration inchangée ; pas de copie de bibliothèque ni de fusion sans preuves.

## Système retrouvé côté Survie / 40K
Sources effectives :
- `assets/gensrpg/core/legacy-cloud-sync-backup-v1.js` : **implémentation** des salles, authentification, abonnement et synchro.
- `assets/gensrpg/gens-multiplayer-entry-167831.js` : **boutons seulement** ; délègue à `z40kOpenOnline()` et ne crée aucun second client.
- `tests/gens_multiplayer_entry_v167831.test.cjs` : confirme les entrées UI, **pas une connexion réseau entre deux navigateurs**.
- `tests/gens_survival_shell_launch_browser_v11411.test.cjs` et `tests/gens_savequit_resume_shell_browser_v11411.test.cjs` : le transport externe Supabase est simulé ou hors périmètre ; ne prouvent pas le service en ligne actif.

Transport trouvé :
1. `z40kEnsureAuth()` réutilise `auth.getSession()` ou appelle `auth.signInAnonymously()`.
2. `z40kCreateRoom()` appelle `rpc('z40k_make_room')` ; `z40kJoinRoom()` appelle `rpc('z40k_join_room',{p_code:code})`. Le contrat historique utilise un **code de 6 caractères**, pas celui de 8–12 caractères du nouveau prototype de lobby : adapter/choisir UNE convention avant de raccorder.
3. `z40kSubscribe()` écoute les changements `public.z40k_sync_state` par `room_id` et se désabonne à la sortie.
4. `z40kInviteUrl()`, `z40kShareInvite()`, `z40kShowQR()` génèrent une invitation via lien/QR.
5. L'ancien chemin de synchronisation publie `state_key='game'` et des événements sous `state_key='event'`. Il partage également des créations et participants par clés spécifiques.

## GROS RISQUE : protocole de sauvegarde non transportable vers Capture
- `z40kSnapshot()` parcourt le `localStorage` global et exporte presque toutes les clés. Il ne sélectionne pas un état de jeu Monster Capture autorisé.
- `z40kApplySnapshot()` supprime les clés locales absentes de l'état distant et applique les valeurs reçues.
- `z40kJoinRoom()` et l'abonnement appellent ce mécanisme sur `state_key='game'`, déclenchant même `resumeGame()` générique.
- `Storage.prototype.setItem/removeItem` est wrappé pour pousser automatiquement ces changements.
- Brancher Monster Capture directement sur `z40kJoinRoom`, `z40kPushState`, `z40kSubscribe` ou `z40kApplySnapshot` serait une **régression potentiellement destructrice** pour les sauvegardes et violerait l'autorité du module.

**Décision** : ne jamais transmettre `AdventureSave` ou l'inventaire global comme des snapshots distants ; ne jamais écraser `localStorage`/IndexedDB à l'arrivée d'un autre participant ; ne pas installer de wrappers globaux supplémentaires. Les sessions personnelles restent auprès du Core Storage de chaque joueur.

## Réutilisation permise : les contrats, pas les fonctions globales
- Garder **le même fournisseur réseau validé** si disponible (Supabase), le même principe de salon/invitation, le même cycle authentification → rejoindre → s'abonner → quitter.
- Un adaptateur explicite `CaptureRoomTransportV1` devra recevoir le client réseau via injection, avec `connect/create/join/observe/leave/dispose`, sans toucher au `z40k*` global ni à la session Survie.
- Ne pas réutiliser les RPC actuels pour une partie Capture tant que leurs fonctions SQL et politiques RLS n'ont pas été auditées ; sinon on ne pourrait pas garantir le propriétaire du salon, la capacité, les permissions et l'isolation des données.
- Transporter uniquement messages **versionnés et typés**, identités authentifiées, ordre/révision et états de présence/positions autorisés. La position de l'avatar doit être validée par le propriétaire Exploration et non pas écrite arbitrairement dans la sauvegarde. Les rencontres/combats doivent passer par le contrat Combat officiel.
- Envisager les canaux Realtime **privés** et Broadcast, recommandés par la documentation Supabase actuelle pour l'échelle et la sécurité, sous politiques d'autorisation RLS propres à la salle.
- Le code d'invitation et les règles du lobby restent des données de gameplay configurables et doivent être normalisés une seule fois. `sessionControl.creatorId` est une identité de sauvegarde locale (générée lors de la création) : **ne pas** la comparer directement à `auth.uid()`.

## Audit backend non terminé
- Dans le dépôt public, une seule URL Supabase est configurée pour le chemin en ligne historique (ancien client).
- Le connecteur Supabase renvoie `INACTIVE` pour le projet correspondant lors de la vérification, et refuse lecture de tables/migrations ; cela n'invalide pas des essais fonctionnels faits auparavant, mais **ne permet pas de revendiquer actuellement une liaison réelle certifiée**.
- Il manque la preuve du SQL des deux RPC, de la RLS, de la structure de `z40k_sync_state`, de la souscription Realtime active et d'un test réel à deux appareils. Aucun changement backend ni restauration de projet dans ce lot.

## Plan par jalons, sans duplication
1. **C2-A (PR #294)** : modèle de lobby éphémère, TDD RED/GREEN, garde anti-snapshot et périmètre exact des acteurs. Déjà engagé, ne fusionner qu'après GREEN SHA exact.
2. **C2-B** : audit serveur des RPC et RLS ; créer ou adapter le contrat d'autorisation hôte/invité et un transport Core injecté ; suite serveur refusant usurpation et révisions périmées. Pas de fusion à l'aveugle vers l'ancienne table.
3. **C2-C** : deux navigateurs avec deux identités distinctes, créer/rejoindre/quitter, présence et reconnexion, A/B sur PC et Android paysage ; vérification des sauvegardes locales intactes.
4. **C2-D** : synchronisation des acteurs en exploration via les APIs officielles Exploration, puis demande de duel/rencontre entre joueurs via le Combat officiel, sans activation du module Duel/PvP.

## Critères de sortie
- Deux joueurs réellement présents dans la **même partie Monster Capture** avec authentification prouvée.
- Aucun autre module ou espace de stockage ne subit d'écriture distante non sollicitée.
- Une modification d'inventaire/XP/récompenses n'est appliquée qu'au bon propriétaire via Core Storage après une action de jeu autorisée.
- Fermeture/reconnexion et désabonnement sans observers persistants.
- CI au SHA exact, revue des frontières, HTTPS/Android/PC, rollback, et validation manuelle du créateur.
