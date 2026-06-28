"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function AsyncForm({
  endpoint,
  body,
  children,
  submitLabel,
  onSuccess,
}: {
  endpoint: string;
  body: (form: FormData) => unknown;
  children: React.ReactNode;
  submitLabel: string;
  onSuccess: (data: unknown) => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body(new FormData(e.currentTarget))),
      });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error((data as { message?: string }).message);
      onSuccess(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {children}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)]"
        >
          {error}
        </p>
      )}
      <Button className="w-full" disabled={loading}>
        {loading ? "Aguarde..." : submitLabel}
      </Button>
    </form>
  );
}
