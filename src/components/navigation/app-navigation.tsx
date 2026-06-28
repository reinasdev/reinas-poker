"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authenticatedBackPath } from "@/domain/navigation";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export function AppNavigation({ userName }: { userName?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const backPath = authenticatedBackPath(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState(userName ?? "");
  const [saving, setSaving] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      )
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

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
    if (response.ok) router.replace("/");
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4"
    >
      <div className="flex flex-wrap items-center gap-2">
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
            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
          </Button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-xl shadow-black/30"
            >
              <form onSubmit={saveName} className="space-y-3">
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-semibold uppercase text-[var(--muted)]"
                >
                  profile.name
                </label>
                <Input
                  id="profile-name"
                  name="name"
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
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
          onClick={signOut}
          aria-label="Sair"
          title="Sair"
          className="w-10 px-0"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </Button>
      </div>
    </nav>
  );
}
