import { supabase } from "@/integrations/supabase/client";

const FREE_DAILY_LIMIT = 3;

export interface UserCredits {
  balance: number;
  free_cleans_today: number;
  last_free_reset: string;
}

/** Fetch (or auto-create) the credit row for the current user, resetting daily frees if needed. */
export async function getCredits(userId: string): Promise<UserCredits> {
  const today = new Date().toISOString().slice(0, 10);

  // Try to fetch existing row
  let { data, error } = await supabase
    .from("user_credits")
    .select("balance, free_cleans_today, last_free_reset")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch credits:", error);
    return { balance: 0, free_cleans_today: 0, last_free_reset: today };
  }

  // Auto-create if missing
  if (!data) {
    const { data: inserted, error: insertErr } = await supabase
      .from("user_credits")
      .insert({ user_id: userId, balance: 5, free_cleans_today: 0, last_free_reset: today })
      .select("balance, free_cleans_today, last_free_reset")
      .single();

    if (insertErr) {
      console.error("Failed to create credits:", insertErr);
      return { balance: 5, free_cleans_today: 0, last_free_reset: today };
    }
    data = inserted;
  }

  // Reset daily free counter if new day
  if (data.last_free_reset < today) {
    const { error: updateErr } = await supabase
      .from("user_credits")
      .update({ free_cleans_today: 0, last_free_reset: today, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (!updateErr) {
      data.free_cleans_today = 0;
      data.last_free_reset = today;
    }
  }

  return {
    balance: data.balance,
    free_cleans_today: data.free_cleans_today,
    last_free_reset: data.last_free_reset,
  };
}

/** Check if user can clean a file (has free cleans or paid balance). */
export function hasCreditsAvailable(credits: UserCredits): boolean {
  return credits.free_cleans_today < FREE_DAILY_LIMIT || credits.balance > 0;
}

/** Returns how many total cleans are available. */
export function availableCleans(credits: UserCredits): number {
  const freeRemaining = Math.max(0, FREE_DAILY_LIMIT - credits.free_cleans_today);
  return freeRemaining + credits.balance;
}

/** Deduct one credit: use free daily first, then paid balance. */
export async function useCredit(userId: string): Promise<boolean> {
  const credits = await getCredits(userId);

  if (credits.free_cleans_today < FREE_DAILY_LIMIT) {
    const { error } = await supabase
      .from("user_credits")
      .update({
        free_cleans_today: credits.free_cleans_today + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return !error;
  }

  if (credits.balance > 0) {
    const { error } = await supabase
      .from("user_credits")
      .update({
        balance: credits.balance - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return !error;
  }

  return false;
}
