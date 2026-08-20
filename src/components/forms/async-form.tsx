"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Alert, Button } from "@reinas/ui";

export function AsyncForm({
  endpoint,
  body,
  children,
  submitLabel,
  onSuccess,
}: {
  endpoint: string;
  body: (form: FormData) => unknown;
  children: ReactNode;
  submitLabel: string;
  onSuccess: (data: unknown) => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body(new FormData(event.currentTarget))),
      });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error((data as { message?: string }).message);
      onSuccess(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {children}
      <Alert>{error}</Alert>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Aguarde..." : submitLabel}
      </Button>
    </form>
  );
}
