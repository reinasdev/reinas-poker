"use client";

import { useRouter } from "next/navigation";
import { AsyncForm } from "./async-form";
import { Input } from "@/components/ui/input";

const labelClass =
  "block text-xs font-semibold uppercase text-[var(--muted)]";
const selectClass =
  "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--technical)] px-3 text-sm text-[var(--foreground)] shadow-inner shadow-black/20 focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]";

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
        const d = value as { room: { slug: string } };
        router.push(`/${d.room.slug}`);
      }}
    >
      <label htmlFor="room-name" className={labelClass}>
        Nome
      </label>
      <Input id="room-name" name="name" required maxLength={100} />

      <label htmlFor="room-slug" className={labelClass}>
        Link personalizado
      </label>
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

      <label htmlFor="room-password" className={labelClass}>
        Senha de 4 dígitos
      </label>
      <Input
        id="room-password"
        name="password"
        required
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        className="tracking-[0.3em]"
      />

      <label htmlFor="room-style" className={labelClass}>
        Estilo de votação
      </label>
      <select id="room-style" name="style" className={selectClass}>
        <option value="SCRUM">Scrum</option>
        <option value="FIBONACCI">Fibonacci</option>
        <option value="TSHIRT">Camisetas</option>
      </select>
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
      <label htmlFor="join-password" className={labelClass}>
        Senha de 4 dígitos
      </label>
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
    </AsyncForm>
  );
}
