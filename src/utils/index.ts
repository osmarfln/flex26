export const createPageUrl = (pageName: string) => {
  const mapping: Record<string, string> = {
    AnalisesIA: "/analises",
    PalpiteDoDia: "/palpite",
    ArquivoResultados: "/arquivo",
    CalendarioResultados: "/calendario",
    CadastroManual: "/cadastrar",
    Admin: "/admin",
    Home: "/",
  };
  return mapping[pageName] || "/";
};
