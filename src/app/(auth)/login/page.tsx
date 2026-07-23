import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <p className="font-display text-2xl">Family Island</p>
        <p className="text-ink-600 dark:text-mist-100/70 mt-1 text-sm">
          One small moment a day, shared together.
        </p>
        <LoginForm />
      </Card>
    </main>
  );
}
