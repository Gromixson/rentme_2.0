import { db } from '../db';
import type { ProviderDoc } from '../types';

export async function getProvider(userId: string): Promise<ProviderDoc | null> {
  const snap = await db().collection('providers').doc(userId).get();
  if (!snap.exists) return null;
  return snap.data() as ProviderDoc;
}

export function isProviderProfileComplete(provider: ProviderDoc | null): boolean {
  if (!provider) return false;
  return provider.hourlyRate > 0 && provider.categories.length > 0;
}

export async function recalcCategoryOnlineCounts(): Promise<void> {
  const categoriesSnap = await db().collection('categories').get();
  const providersSnap = await db().collection('providers').where('isOnline', '==', true).get();

  const counts = new Map<string, number>();
  for (const doc of providersSnap.docs) {
    const p = doc.data() as ProviderDoc;
    for (const catId of p.categories) {
      counts.set(catId, (counts.get(catId) ?? 0) + 1);
    }
  }

  const batch = db().batch();
  for (const cat of categoriesSnap.docs) {
    batch.update(cat.ref, { onlineCount: counts.get(cat.id) ?? 0 });
  }
  await batch.commit();
}

export async function updateProviderRating(providerId: string): Promise<void> {
  const ratingsSnap = await db()
    .collection('ratings')
    .where('providerId', '==', providerId)
    .get();
  const total = ratingsSnap.docs.reduce((sum, d) => sum + (d.data().rating as number), 0);
  const count = ratingsSnap.size;
  const average = count > 0 ? total / count : 0;
  await db().collection('providers').doc(providerId).update({
    averageRating: Math.round(average * 10) / 10,
    ratingCount: count,
  });
}
