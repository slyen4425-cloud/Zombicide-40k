# Publisher PWA — Vague incendiaire, icône Boule de feu (22 novembre 2026)

## Contexte et contrat
- Départ du publisher : `main@4f7ee709512efe4a5195d9af76c724c198f1a041`, checkpoint `checkpoint/gensrpg-start-vague-icon-publisher-20261122`, branche `work/gensrpg-vague-icon-publisher-20261122`.
- PR Combat #378 sur `main@34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0`, CI PR `45011273821` verte, pages Lab `45016265046` réussies. La source Capture V2 est portée par PR #605 et publiée via le pin `tools/capture_v2_pages_preview_pin.json` du publisher, aucune copie de moteurs.
- Le seul changement de gameplay visible est **l'icône de Vague incendiaire** (`cap_fire_atk_5`) : de Dôme vers `pack:capture:icon-skill-fireball-01`. Ne pas modifier le sprite `pack:capture:sprite-fire-bubble-expansion-01`, les dégâts ou les statuts.
- Préserver le SHA Exploration `de86b04f35f96df3783f1f953c7f138bc44a28f8` (ponts et escaliers), les cinq compétences Polocendre et toutes les modifications présentes dans le pin source `7b0231691f2510978c3616402a779e51349a2a41`.
- Aucune modification du service worker source, du root Shell, des sauvegardes ou des autres modules ; cache de preview publié par le mécanisme préexistant `capture_v2_pwa_release.mjs`.
- Tests physiques : `tests/gens_capture_v2_isolated_pages_preview.test.cjs` vérifie la compétence `cap_fire_atk_5` dans le véritable dossier `vendor/combat-lab`, son sprite et ses dégâts ; CI publisher, GitHub Pages, HTTP HTTPS et provenance des SHAs requis avant statut GREEN.
