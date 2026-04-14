'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function respondToReviewAction(
  reviewId: string,
  formData: FormData,
): Promise<void> {
  const responseText = formData.get('response_text')?.toString() ?? '';
  if (!responseText.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert response (one response per review)
  const { data: existing } = await supabase
    .from('review_responses')
    .select('id')
    .eq('review_id', reviewId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('review_responses')
      .update({ response_text: responseText })
      .eq('review_id', reviewId);
  } else {
    await supabase.from('review_responses').insert({
      review_id: reviewId,
      business_owner_id: user.id,
      response_text: responseText,
    });
  }

  revalidatePath('/dashboard/reviews');
}
