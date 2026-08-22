import { supabase } from "@/integrations/supabase/client";

export async function checkLocationColumn() {
  const { data, error } = await supabase
    .from("lottery_results")
    .select("location")
    .limit(1);
  
  if (error) {
    console.error("Error checking location column:", error);
    return { exists: false, error: error.message };
  }
  return { exists: true, data };
}
