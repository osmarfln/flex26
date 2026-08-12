import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getSyncStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  });
