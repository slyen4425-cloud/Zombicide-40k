# Checkpoint — import volontaire des potions dans un univers existant (23 novembre 2026)

- Source candidate Capture V2 `848fb3201df200c53b756ef8004eee6712558faf`, base `work/capture-v2-source-stairs-authoring-20261123`.
- Lot isolé, sans action sur les laboratoires, la PWA publisher, le multijoueur ni les assets.
- La seule autorité des deux modèles est `SHOWCASE_ADVENTURE_RULES_V1.loot.items` dans `adventure-contract-v1.mjs`. Aucune liste dupliquée et aucun import automatique sur les anciennes parties.
- Un bouton explicite dans la **Bibliothèque d'objets** copie seulement les deux IDs manquants dans le brouillon `AdventureRules.loot.items`. Tout ID existant reste INTACT, même s'il correspond à un objet personnalisé ; les drops, fragments, marchands et anciennes sauvegardes ne sont pas modifiés.
- L'auteur doit encore cliquer **Enregistrer les paramètres**. Un deuxième clic d'import n'ajoute rien ; le moteur de consommables déjà présent utilise les effets canoniques (soin 20, réanimation 35 %).
- Contrats testés : idempotence, collision de nom/ID, ancienne partie, préservation des drops et source d'autorité UI.
- Ne prétend pas réparer l'ouverture PNJ marchand qui reste un chantier indépendant de #629.
- Gardes : CI GREEN exact SHA avant fusion source ; repin séparé à la PWA et preuve HTTPS avant annoncer une publication.
