import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/css-logo.png" alt="CSS Club Logo" width={48} height={48} priority />
          <span className="text-xl font-bold tracking-wide">CSS Club Sportif Sfaxien</span>
        </Link>
        <nav className="flex gap-6 text-lg font-semibold items-center">
          <Link href="/events">Events</Link>
          <Link href="/tickets">Tickets</Link>
          <Link href="/venues">Venues</Link>
          <Link href="/users">Users</Link>
        </nav>
      </div>
    </header>
  );
} 