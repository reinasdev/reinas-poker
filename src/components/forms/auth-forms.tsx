"use client";

import { useRouter } from "next/navigation";
import { AsyncForm } from "./async-form";
import { Input } from "@/components/ui/input";
import { pathWithReturn, safeReturnPath } from "@/domain/navigation";

const labelClass =
  "block text-xs font-semibold uppercase text-[var(--muted)]";

export function EmailForm({ nextPath = "/rooms" }: { nextPath?: string }) {
  const router = useRouter();
  const safeNext = safeReturnPath(nextPath);
  return (
    <AsyncForm
      endpoint="/api/auth/request"
      body={(f) => ({ email: f.get("email") })}
      submitLabel="Enviar código"
      onSuccess={() => {
        const email = (
          document.querySelector("[name=email]") as HTMLInputElement
        ).value;
        router.push(
          `${pathWithReturn("/verify", safeNext)}&email=${encodeURIComponent(email)}`,
        );
      }}
    >
      <label htmlFor="email" className={labelClass}>
        Email
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="voce@empresa.com"
      />
    </AsyncForm>
  );
}

export function CodeForm({
  email,
  nextPath = "/rooms",
}: {
  email: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const safeNext = safeReturnPath(nextPath);
  return (
    <AsyncForm
      endpoint="/api/auth/verify"
      body={(f) => ({ email, code: f.get("code") })}
      submitLabel="Entrar"
      onSuccess={(value) => {
        const d = value as { needsProfile: boolean };
        router.push(
          d.needsProfile ? pathWithReturn("/onboarding", safeNext) : safeNext,
        );
      }}
    >
      <label htmlFor="code" className={labelClass}>
        Código mágico
      </label>
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        placeholder="000000"
        className="text-center text-lg tracking-[0.25em]"
      />
    </AsyncForm>
  );
}

export function ProfileForm({ nextPath = "/rooms" }: { nextPath?: string }) {
  const router = useRouter();
  const safeNext = safeReturnPath(nextPath);
  return (
    <AsyncForm
      endpoint="/api/auth/profile"
      body={(f) => ({ name: f.get("name") })}
      submitLabel="Continuar"
      onSuccess={() => router.push(safeNext)}
    >
      <label htmlFor="name" className={labelClass}>
        Como devemos chamar você?
      </label>
      <Input
        id="name"
        name="name"
        minLength={2}
        maxLength={100}
        required
        autoComplete="name"
      />
    </AsyncForm>
  );
}
