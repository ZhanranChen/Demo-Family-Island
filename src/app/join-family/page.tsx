import { Card } from "@/components/ui/card";
import { CreateFamilyForm } from "@/features/family/components/create-family-form";
import { JoinFamilyForm } from "@/features/family/components/join-family-form";

export default function JoinFamilyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="font-display text-2xl">Welcome</p>
        <p className="text-ink-600 dark:text-mist-100/70 mt-1 text-sm">
          Start a new island, or join one your family already planted.
        </p>
      </div>

      {/* Two equally-weighted cards rather than a tab switcher — "create"
          and "join" are two different people's first action (whoever sets
          the family up vs. everyone who follows), not two views of the same
          task, so there's no reason to hide one behind a click. */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <p className="font-display text-lg">Start a new island</p>
          <p className="text-ink-600 dark:text-mist-100/70 mt-1 mb-4 text-sm">
            You&apos;ll get an invite code to share with your family.
          </p>
          <CreateFamilyForm />
        </Card>
        <Card>
          <p className="font-display text-lg">Join your family</p>
          <p className="text-ink-600 dark:text-mist-100/70 mt-1 mb-4 text-sm">
            Enter the code someone in your family shared with you.
          </p>
          <JoinFamilyForm />
        </Card>
      </div>
    </main>
  );
}
