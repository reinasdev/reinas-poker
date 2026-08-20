"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Field, Input, ThemeToggle } from "@reinas/ui";
import { authenticatedBackPath } from "@/domain/navigation";

export function AppNavigation({ userName }: { userName?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const backPath = authenticatedBackPath(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState(userName ?? "");
  const [saving, setSaving] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    function close(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      )
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [profileOpen]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });
    setSaving(false);
    if (response.ok) {
      setProfileOpen(false);
      router.refresh();
    }
  }

  async function signOut() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) return;
    const { redirectTo } = (await response.json()) as { redirectTo?: string };
    // Sair de verdade passa pelo reinas-id: só apagar o cookie local faria o
    // próximo redirecionamento reautenticar em silêncio.
    window.location.assign(redirectTo ?? "/");
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {backPath && (
          <Link href={backPath}>
            <Button type="button" variant="ghost">
              Voltar
            </Button>
          </Link>
        )}
        <Link href="/rooms" prefetch>
          <Button type="button" variant="outline">
            Minhas salas
          </Button>
        </Link>
        <Link href="/rooms/new" prefetch>
          <Button type="button" variant="outline">
            Criar sala
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={profileRef}>
          <Button
            type="button"
            variant="outline"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="max-w-40 truncate">{userName ?? "Perfil"}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </Button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-xl shadow-black/30"
            >
              <form onSubmit={saveName} className="space-y-3">
                <Field label="profile.name" htmlFor="profile-name">
                  <Input
                    id="profile-name"
                    name="name"
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </Field>
                <Button className="w-full" disabled={saving}>
                  {saving ? "Salvando..." : "Trocar nome"}
                </Button>
              </form>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={signOut}
          aria-label="Sair"
          title="Sair"
        >
          <LogOut size={16} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
