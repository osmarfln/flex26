import { supabase } from "@/integrations/supabase/client";

export const getResults = async (location: 'rio' | 'capital' = 'rio', date?: string) => {
  let query = supabase
    .from("lottery_results")
    .select("*")
    .eq("location" as any, location)
    .order("date", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;
  return data;
};
