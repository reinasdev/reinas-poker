"use client";

import { useRouter } from "next/navigation";
import { Field, Input, Select } from "@reinas/ui";
import { AsyncForm } from "./async-form";

export function CreateRoomForm() {
  const router = useRouter();
  return (
    <AsyncForm
      endpoint="/api/rooms"
      body={(f) => ({
        name: f.get("name"),
        slug: f.get("slug"),
        password: f.get("password"),
        style: f.get("style"),
      })}
      submitLabel="Criar sala"
      onSuccess={(value) => {
        const data = value as { room: { slug: string } };
        router.push(`/${data.room.slug}`);
      }}
    >
      <Field label="Nome" htmlFor="room-name">
        <Input id="room-name" name="name" required maxLength={100} />
      </Field>

      <Field
        label="Link personalizado"
        htmlFor="room-slug"
        hint="Até 6 letras, números ou hífen."
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="rounded-md border border-[var(--technical-border)] bg-[var(--technical)] px-3 py-2 text-sm text-[var(--primary)]"
          >
            /
          </span>
          <Input
            id="room-slug"
            name="slug"
            required
            maxLength={6}
            pattern="[a-zA-Z0-9-]{1,6}"
          />
        </div>
      </Field>

      <Field label="Senha de 4 dígitos" htmlFor="room-password">
        <Input
          id="room-password"
          name="password"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          className="tracking-[0.3em]"
        />
      </Field>

      <Field label="Estilo de votação" htmlFor="room-style">
        <Select id="room-style" name="style" defaultValue="SCRUM">
          <option value="SCRUM">Scrum</option>
          <option value="FIBONACCI">Fibonacci</option>
          <option value="TSHIRT">Camisetas</option>
        </Select>
      </Field>
    </AsyncForm>
  );
}

export function JoinRoomForm({ roomId }: { roomId: string }) {
  const router = useRouter();
  return (
    <AsyncForm
      endpoint={`/api/rooms/${roomId}/join`}
      body={(f) => ({ password: f.get("password") })}
      submitLabel="Entrar na sala"
      onSuccess={() => router.refresh()}
    >
      <Field label="Senha de 4 dígitos" htmlFor="join-password">
        <Input
          id="join-password"
          name="password"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoFocus
          className="text-center text-lg tracking-[0.3em]"
        />
      </Field>
    </AsyncForm>
  );
}
