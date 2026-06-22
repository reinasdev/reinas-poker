"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authenticatedBackPath } from "@/domain/navigation";

export function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const backPath = authenticatedBackPath(pathname);

  async function signOut() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) router.replace("/");
  }

  return (
    <nav aria-label="Navegação principal" className="flex flex-wrap gap-2">
      {backPath && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(backPath)}
        >
          Voltar
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/rooms")}
      >
        Minhas salas
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push("/rooms/new")}
      >
        Criar sala
      </Button>
      <Button type="button" variant="ghost" onClick={signOut}>
        Sair
      </Button>
    </nav>
  );
}
