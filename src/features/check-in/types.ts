/**
 * Feature-level types are kept separate from `Database["public"]["Tables"]`
 * on purpose. The DB row is a storage detail; this is the shape components
 * actually work with. Today that's a near 1:1 mapping, but it means a
 * schema change (e.g. splitting `media_url` into `media_path` + a signed
 * URL resolved at read time) only touches the mapping function in api.ts,
 * not every component that renders an entry.
 */
export type EntryKind = "text" | "voice" | "photo";

export interface FamilyMemberStatus {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  hasCheckedIn: boolean;
}

export interface CheckInDaySummary {
  id: string;
  date: string;
  promptText: string | null;
  status: "open" | "unlocked";
  members: FamilyMemberStatus[];
}
