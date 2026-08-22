import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getSyncStatus = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    location: z.enum(['rio', 'capital']).optional().default('rio')
  }).parse(data))
  .handler(async ({ data: { location } }) => {

    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("location", location)

      .order("started_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  });
