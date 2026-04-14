import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SuperAppNav } from '@/components/super-app/super-app-nav';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-brand-primary"
          >
            Orvo
          </Link>
          <SuperAppNav />
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-brand-primary mb-6">
            Book local services
            <br />
            in seconds.
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-2xl mx-auto">
            Orvo is the universal booking marketplace connecting you with
            salons, personal trainers, therapists, and hundreds of other local
            service providers — instant booking, secure payments, verified
            reviews.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Orvo · Universal Booking Marketplace
        </div>
      </footer>
    </div>
  );
}
