import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Eco leve usado para medir a latência real entre navegador e servidor. */
export const pingServer = createServerFn({ method: "GET" }).handler(async () => ({
  at: Date.now(),
}));

/** Exclui definitivamente a conta de um usuário (somente administradores). */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("userId obrigatório");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    return { ok: true as const };
  });

/** Limpa o histórico de trilhas de navegação (um usuário ou todos). */
export const clearUserActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId?: string | null }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("user_activity").delete();
    query = data.userId
      ? query.eq("user_id", data.userId)
      : query.gte("created_at", "1970-01-01T00:00:00Z");
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const, scope: data.userId ? "user" : "all" };
  });
