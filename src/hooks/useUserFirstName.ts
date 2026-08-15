import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function firstNameFrom(value?: string | null) {
  if (!value) return null;
  const clean = value.trim().split(/\s+/)[0];
  if (!clean) return null;
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/** Primeiro nome do usuário logado (perfil > metadata > email) */
export function useUserFirstName() {
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || !active) return;

      const metaName =
        firstNameFrom(user.user_metadata?.['display_name'] as string | undefined) ??
        firstNameFrom(user.user_metadata?.['full_name'] as string | undefined) ??

        firstNameFrom(user.email?.split("@")[0]);

      if (active) setFirstName(metaName);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      const profileName = firstNameFrom(profile?.display_name);
      if (active && profileName) setFirstName(profileName);
    })();

    return () => {
      active = false;
    };
  }, []);

  return firstName;
}
