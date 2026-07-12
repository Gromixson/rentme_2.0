import { z } from 'zod';

export const REVIEW_SCHEMA = z.object({
  scores: z.object({
    correctness: z.number().int().min(1).max(10),
    security: z.number().int().min(1).max(10),
    maintainability: z.number().int().min(1).max(10),
    conventions: z.number().int().min(1).max(10),
    testCoverage: z.number().int().min(1).max(10),
  }),
  verdict: z.enum(['pass', 'fail']),
  summary: z.string().describe('Markdown summary of the review'),
});

export type Review = z.infer<typeof REVIEW_SCHEMA>;

export const SYSTEM_PROMPT = `Jesteś doświadczonym recenzentem kodu w projekcie RentMe 2.0 (Angular 21 + Firebase Functions).

Przeanalizuj podany git diff i oceń zmiany według pięciu wymiarów (skala 1–10):
- correctness — logika, błędy, edge case'y
- security — auth, sekrety, reguły dostępu
- maintainability — czytelność, spójność, dług techniczny
- conventions — zgodność z konwencjami projektu (AGENTS.md)
- testCoverage — czy zmiany mają sensowne pokrycie testami

Verdict:
- pass — brak krytycznych problemów; drobne uwagi dopuszczalne
- fail — krytyczne błędy, naruszenie hard rules lub brak testów przy ryzykownej zmianie

summary — zwięzłe podsumowanie w Markdown (nagłówki, listy, konkretne uwagi).

Skup się wyłącznie na diffie. Nie wymyślaj plików spoza diffa.`;
