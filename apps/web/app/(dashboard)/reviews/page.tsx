import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { respondToReviewAction } from '@/app/actions/reviews';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_flagged: boolean;
  consumer: { first_name: string | null; last_name: string | null } | null;
  response: { response_text: string } | null;
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id, avg_rating, total_reviews')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!business) redirect('/dashboard/business/new');

  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      `
      id, rating, comment, created_at, is_flagged,
      consumer:profiles!reviews_consumer_id_fkey(first_name, last_name),
      response:review_responses(response_text)
    `,
    )
    .eq('business_id', business.id)
    .eq('is_removed', false)
    .order('created_at', { ascending: false });

  const rows = (reviews ?? []) as unknown as ReviewRow[];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Reviews
        </h1>
        <p className="text-zinc-600 mt-1">
          {business.total_reviews > 0
            ? `${Number(business.avg_rating).toFixed(1)} ★ average from ${business.total_reviews} reviews.`
            : 'No reviews yet.'}
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reviews yet</CardTitle>
            <CardDescription>
              After customers complete a booking, they can leave a review.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => {
            const name =
              [r.consumer?.first_name, r.consumer?.last_name]
                .filter(Boolean)
                .join(' ')
                .trim() || 'Anonymous';
            async function doRespond(formData: FormData) {
              'use server';
              await respondToReviewAction(r.id, formData);
            }
            return (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-amber-500">{stars(r.rating)}</span>
                    <span className="text-zinc-500 text-sm font-normal">
                      {name}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {new Date(r.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {r.comment && (
                    <p className="text-sm text-zinc-800">{r.comment}</p>
                  )}
                  {r.response ? (
                    <div className="border-l-4 border-brand-accent pl-3 bg-zinc-50 p-3 rounded-r">
                      <p className="text-xs font-semibold text-zinc-500 mb-1">
                        Your response
                      </p>
                      <p className="text-sm text-zinc-800">
                        {r.response.response_text}
                      </p>
                    </div>
                  ) : (
                    <form
                      action={doRespond}
                      className="flex flex-col gap-2 border-t border-zinc-200 pt-3"
                    >
                      <Textarea
                        name="response_text"
                        placeholder="Thank the customer or address their feedback…"
                        rows={3}
                        required
                      />
                      <Button type="submit" size="sm" className="self-start">
                        Post response
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
