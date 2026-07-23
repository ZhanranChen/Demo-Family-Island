import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodaySummary } from "@/features/check-in/api";
import { CheckInCard } from "@/features/check-in/components/check-in-card";
import { NavBar } from "@/components/layout/nav-bar";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .limit(1)
    .maybeSingle();

  // A signed-in user with no family yet belongs on the onboarding flow, not
  // a broken "today" page — this keeps that redirect co-located with the
  // one place that actually discovers "no family" instead of scattering
  // the check throughout the tree.
  if (!membership) redirect("/join-family");

  const day = await getTodaySummary(membership.family_id);
  if (!day) redirect("/join-family");

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <CheckInCard day={day} />
      </main>
    </>
  );
}
