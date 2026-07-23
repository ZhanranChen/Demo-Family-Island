import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  { href: "/today", label: "Today" },
  { href: "/island", label: "Island" },
  { href: "/journal", label: "Journal" },
];

export function NavBar() {
  return (
    <header className="border-sand-200 dark:border-dusk-500 border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/today"
          className="font-display shrink-0 whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg"
        >
          Family Island
        </Link>

        {/* Single row on all breakpoints — three links never need a burger
            menu, and a persistent nav keeps the "everyone shows up" ritual
            one tap away instead of hidden behind an icon. */}
        <nav className="flex min-w-0 items-center gap-0 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-600 hover:text-ink-900 dark:text-mist-100/70 dark:hover:text-mist-100 rounded-pebble px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle className="ml-1 hidden sm:inline-flex" />
        </nav>
      </div>
    </header>
  );
}
