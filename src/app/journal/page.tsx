import { NavBar } from "@/components/layout/nav-bar";
import { Card } from "@/components/ui/card";

export default function JournalPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card className="text-center">
          <p className="font-display text-xl">Your private nook</p>
          <p className="text-ink-600 dark:text-mist-100/70 mt-2 text-sm">
            Only you will ever see what you write here — arriving in Phase 5.
          </p>
        </Card>
      </main>
    </>
  );
}
