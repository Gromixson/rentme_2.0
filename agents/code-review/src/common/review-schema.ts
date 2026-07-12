import { z } from 'zod';

function scoreField(label: string, score1: string, score10: string) {
  return z.number().int().min(1).max(10).describe(`${label}: 1 = ${score1}; 10 = ${score10}`);
}

export const REVIEW_SCHEMA = z.object({
  scores: z.object({
    implementationCorrectness: scoreField(
      'Poprawność implementacji',
      'Logika błędna, regresje, naruszenie kontraktu API/Firestore, brak obsługi edge caseów',
      'Logika poprawna, zgodna z PRD/MVP, transakcje Firestore spójne, brak oczywistych regresji',
    ),
    idiomaticity: scoreField(
      'Idiomatyczność (Angular + Functions)',
      'Obce wzorce (np. @angular/fire, Firestore w komponencie, monolityczne handlery)',
      'Standalone components, ApiService, injected Firebase tokens, cienkie route handlery — AGENTS.md',
    ),
    complexity: scoreField(
      'Złożoność / czytelność',
      'Nadmiarowa abstrakcja lub spaghetti; trudny do review diff bez planu',
      'Minimalny scope, czytelny podział core/features/shared i functions/src/services',
    ),
    testRiskCoverage: scoreField(
      'Testy i pokrycie ryzyka',
      'Brak testów przy zmianie krytycznej ścieżki (auth, booking, timeout)',
      'Vitest/Karma/Playwright tam gdzie test-plan.md wymaga; characterization tests przed refaktorem',
    ),
    documentation: scoreField(
      'Dokumentacja / kontekst change',
      'Brak komentarzy przy nieoczywistej logice; brak aktualizacji verification.md lub plan.md',
      'Change folder uzupełniony; nieoczywiste decyzje udokumentowane; odwołania @path zamiast duplikacji',
    ),
    securitySafety: scoreField(
      'Bezpieczeństwo',
      'Brak auth na route, wyciek sekretów, client-side trust, logowanie haseł/tokenów',
      'requireAuth na API, rules Firestore/Storage, brak sekretów w repo, walidacja wejścia',
    ),
  }),
  verdict: z
    .enum(['pass', 'fail'])
    .describe('pass gdy wszystkie kryteria ≥7 i żadne ≤4; inaczej fail'),
  summaryMarkdown: z.string().describe('Markdown po polsku: tabela wyników, findingi, werdykt'),
});

export type Review = z.infer<typeof REVIEW_SCHEMA>;

export const PASS_THRESHOLD = 7;
export const FAIL_FLOOR = 4;

export function deriveVerdict(scores: Review['scores']): 'pass' | 'fail' {
  const values = Object.values(scores);
  if (values.some((s) => s <= FAIL_FLOOR)) return 'fail';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg >= PASS_THRESHOLD ? 'pass' : 'fail';
}

export const CRITERIA_LABELS: Record<keyof Review['scores'], string> = {
  implementationCorrectness: 'Poprawność implementacji',
  idiomaticity: 'Idiomatyczność',
  complexity: 'Złożoność',
  testRiskCoverage: 'Testy / ryzyko',
  documentation: 'Dokumentacja',
  securitySafety: 'Bezpieczeństwo',
};

export const SYSTEM_PROMPT = `Jesteś doświadczonym recenzentem kodu w projekcie RentMe 2.0 (Angular 21 + Firebase Cloud Functions).

Przeanalizuj podany git diff i oceń zmiany według sześciu kryteriów (skala 1–10). Każde kryterium ma rubrykę w schemacie (1 = źle, 10 = dobrze).

## Definition of Done (DoD)
- Diff nie wprowadza regresji w auth, booking, timeout requestu.
- Zmiany krytyczne mają testy (Vitest Functions / Karma / Playwright gdy dotyczy).
- Brak sekretów w repo, brak Firestore w komponentach Angular, brak POST /api/auth/login.
- Werdykt **pass** tylko gdy każde kryterium ≥7 i żadne ≤4.

## Hard rules RentMe (AGENTS.md)
- Auth w kliencie: signInWithEmailAndPassword — nie POST /api/auth/login.
- Domain data: tylko ApiService → environment.apiUrl; nie Firestore w komponentach.
- Inject FIREBASE_* z core/firebase; nie @angular/fire.
- Functions: requireAuth na chronionych route; błędy { error: string }.

## Kryteria parked (poza scope — nie oceniaj, nie obniżaj werdyktu)
- businessAlignment — zgodność z roadmap/PRD biznesowym
- architecturalFit — dopasowanie do DDD / architect-report

Skup się wyłącznie na diffie (i opcjonalnym opisie PR). Nie wymyślaj plików spoza diffa.
summaryMarkdown — po polsku, z tabelą wyników i konkretnymi findingami.`;
