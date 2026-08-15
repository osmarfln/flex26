import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/arquivo")({
  beforeLoad: () => {
    throw redirect({ to: "/historico" });
  },
  component: () => null,
});
