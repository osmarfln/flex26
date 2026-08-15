import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analises")({
  beforeLoad: () => {
    throw redirect({ to: "/estatisticas" });
  },
  component: () => null,
});
