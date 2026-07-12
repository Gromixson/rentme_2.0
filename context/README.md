# Context — RentMe 2.0

Katalog na dokumenty kursu 10xDevs i artefakty planowania/implementacji.

## Mapa repozytorium (M4L2)

**[`map/repo-map.md`](map/repo-map.md)** — operacyjna mapa projektu (teren, struktura, kontrybutorzy, ryzyka).  
Artefakty pośrednie: [`map/artifact-1-territory.md`](map/artifact-1-territory.md), [`map/artifact-2-structure.md`](map/artifact-2-structure.md), [`map/artifact-3-contributors.md`](map/artifact-3-contributors.md).

## Raport architekta (M4L5 — zamknięcie Modułu 4)

**[`architect-report.md`](architect-report.md)** — synteza L2–L5 (mapa, S-06, plan refaktoru, DDD).

## Domena DDD (M4L5)

**[`domain/README.md`](domain/README.md)** — destylacja domeny, niezmienniki, Anti-Corruption Layer.

## Champion — AI Internal Builders (M5L1)

**[`champion/opportunity-map.md`](champion/opportunity-map.md)** — mapa możliwości (sygnały tarcia, Kup/Uzupełnij/Zbuduj).  
**[`champion/mom-test-questions.md`](champion/mom-test-questions.md)** — pytania Mom Test (draft).  
Digest statusu: `npm run status:digest` → [`scripts/mission-status.mjs`](../scripts/mission-status.mjs); opcjonalny zapis: `npm run status:digest:write`.  
**M5L4:** [`changes/ai-toolkit-registry/`](changes/ai-toolkit-registry/) — paczka `@rentme/ai-toolkit`; `npm run toolkit:install`.

## Podkatalogi

| Katalog                      | Opis                                                   |
| ---------------------------- | ------------------------------------------------------ |
| [`champion/`](champion/)     | M5L1 — opportunity map, helper digest, Mom Test        |
| [`foundation/`](foundation/) | PRD, tech-stack, roadmap, test-plan — dokumenty „żywe” |
| [`changes/`](changes/)       | plany i weryfikacje per change ID                      |
| [`deployment/`](deployment/) | deploy plan i wyniki                                   |
| [`archive/`](archive/)       | zamknięte zmiany (immutable)                           |
| [`map/`](map/)               | repo-map i skany M4L2+                                 |
| [`domain/`](domain/)         | destylacja domeny, agregaty, ACL (M4L5)                |
