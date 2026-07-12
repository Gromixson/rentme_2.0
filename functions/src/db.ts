import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

export const db = () => getFirestore();

export { FieldValue, Timestamp };

export const REQUEST_TIMEOUT_MS = 120_000;

export const CATEGORY_SEED = [
  { name: 'Sprzątanie', parentId: null },
  { name: 'Gotowanie', parentId: null },
  { name: 'Naprawy domowe', parentId: null },
  { name: 'Transport', parentId: null },
  { name: 'Edukacja / korepetycje', parentId: null },
  { name: 'Opieka nad zwierzętami', parentId: null },
  { name: 'Ogrodnictwo', parentId: null },
  { name: 'IT / komputer', parentId: null },
];
