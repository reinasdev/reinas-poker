"use client";

import { Button } from "@reinas/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">Algo deu errado</h1>
        <p className="my-4 text-[var(--muted)]">Tente novamente.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
