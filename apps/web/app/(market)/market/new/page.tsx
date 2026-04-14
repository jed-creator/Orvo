/**
 * New-listing page stub. A fuller form (with validation + submit to
 * `/api/market/listings`) is wired in the follow-up task; this scaffold
 * just proves the route renders so Phase 4 smoke tests can assert
 * reachability.
 */
export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Create a listing</h1>
        <p className="text-sm text-muted-foreground">
          Publish an item or service for sale in the marketplace.
        </p>
      </header>
      <p className="text-sm text-muted-foreground">
        The form is wired in the next task.
      </p>
    </div>
  );
}
