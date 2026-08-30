import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildFederalIntel } from "./federal-intel.server";

export const getFederalIntel = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        position: z.number().int().min(0).max(5).optional().default(0),
        weekday: z.enum(["all", "wed", "sun"]).optional().default("all"),
        window: z.number().int().min(0).max(5000).optional().default(0),
        dateStart: z.string().optional(),
        dateEnd: z.string().optional(),
        topN: z.number().int().min(3).max(25).optional().default(10),
      })
      .optional()
      .default({})
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => buildFederalIntel(data as any));
