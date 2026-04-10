import { supabase } from "@/integrations/supabase/client";

export interface ProcessingRecord {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  cleaned_at: string;
  fields_removed: number;
}

export async function getHistory(): Promise<ProcessingRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("processing_history")
    .select("id, file_name, file_type, file_size, fields_removed, cleaned_at")
    .eq("user_id", user.id)
    .order("cleaned_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
  return data ?? [];
}

export async function addHistoryEntry(entry: {
  fileName: string;
  fileType: string;
  fileSize: number;
  fieldsRemoved: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("processing_history").insert({
    user_id: user.id,
    file_name: entry.fileName,
    file_type: entry.fileType,
    file_size: entry.fileSize,
    fields_removed: entry.fieldsRemoved,
  });

  if (error) console.error("Failed to log history:", error);
}

export async function clearHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("processing_history")
    .delete()
    .eq("user_id", user.id);

  if (error) console.error("Failed to clear history:", error);
}
