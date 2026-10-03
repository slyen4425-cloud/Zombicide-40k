# GenSrpG — Phase 9 — Raccord public-entry Capture — 2026-10-03

## Base

- GREEN : `checkpoint/gensrpg-phase9-capture-public-entry-ownership-preaudit-green-2026-10-03`
- SHA : `ef0af616851f143a1a3ef34469a972b06666706a`
- start : `checkpoint/gensrpg-start-phase9-capture-public-entry-raccord-2026-10-03`
- branche : `work/gensrpg-phase9-capture-public-entry-raccord-2026-10-03`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Contrat du micro-lot

Le micro-lot déplace uniquement la frontière publique de lancement Capture.

Avant :
```text
Shell -> provider inline Capture139 -> référence stable Capture139
```

Après :
```text
Shell -> GensCaptureV1 provider -> référence stable Capture139
```

Le corps legacy Capture139 reste inchangé comme propriétaire de session.

## Invariants

- un seul provider public Capture ;
- Shell ne lit aucun état privé Capture ;
- l'entrée Capture ne lit ni DOM, ni storage, ni état gameplay ;
- l'entrée ne crée ni timer, ni observer, ni listener global ;
- le binding legacy est explicite et idempotent ;
- aucun fallback vers un second provider ;
- aucune dette Dungeon inventoriée au pré-audit n'est retirée ici.

## Validation GREEN

SHA validé :
`c2d80eea97d1b9111f2a1ec506dafde9c2eb772e`

Checkpoint :
`checkpoint/gensrpg-phase9-capture-public-entry-raccord-green-2026-10-03`

CI :
- Architecture + Browser `37107319589` — SUCCESS ;
- Firefox `37107319397` — SUCCESS ;
- Tactical Dock `37107319444` — SUCCESS.

Le raccord public-entry est clos GREEN.

Le provider public Capture appartient maintenant à `GensCaptureV1`.
Capture139 reste temporairement l'unique initialiseur legacy de session.
Aucune autre dette Dungeon/Capture n'a été retirée dans ce micro-lot.

## RED attendu

La sentinelle doit échouer sur la base GREEN parce que :
- `capture/entry-v1.js` n'est pas chargé ;
- il n'expose pas `GensCaptureV1` ;
- Capture139 possède encore directement le provider et son `register("capture", ...)`.

Le RED ne doit pas demander de changement gameplay.
