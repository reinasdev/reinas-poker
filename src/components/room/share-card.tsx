"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useMemo, useState } from "react";
import { Button, Card, CardHeader } from "@reinas/ui";

/**
 * O QR só existe para o administrador e pesa mais que o resto da tela inteira,
 * então entra por import dinâmico, sem SSR.
 */
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="h-28 w-28 animate-pulse rounded bg-[var(--surface)]" />
    ),
  },
);

function ShareCardImpl({
  slug,
  accessCode,
  origin,
}: {
  slug: string;
  accessCode?: string | null;
  /** Vem do servidor (APP_URL): o link fica certo já na primeira pintura,
   *  e continua certo atrás de um proxy reverso. */
  origin: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const base = `${origin}/${slug}`;
    return accessCode
      ? `${base}?senha=${encodeURIComponent(accessCode)}`
      : base;
  }, [origin, slug, accessCode]);

  const copyInvite = useCallback(async () => {
    await navigator.clipboard.writeText(
      `Entre aqui na votação: ${shareUrl}\nSenha de acesso: ${accessCode ?? "indisponível"}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }, [shareUrl, accessCode]);

  return (
    <Card tone="technical">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_132px] md:items-center">
        <div className="space-y-3">
          <CardHeader eyebrow="rooms.share" title="Compartilhar sala" />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-[var(--border-strong)] bg-[var(--technical)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">link</p>
              <p className="mt-1 truncate text-sm text-[var(--foreground)]">
                {shareUrl}
              </p>
            </div>
            <div className="rounded-md border border-[var(--border-strong)] bg-[var(--technical)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">senha</p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                {accessCode ?? "indisponível"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={copyInvite}>
              Copiar convite
            </Button>
            <span
              aria-live="polite"
              className="text-xs text-[var(--muted-foreground)]"
            >
              {copied ? "Convite copiado." : ""}
            </span>
          </div>
        </div>
        <div className="flex h-32 w-32 items-center justify-center rounded-md border border-[var(--border-strong)] bg-white p-2">
          <QRCodeSVG
            value={shareUrl}
            size={112}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            aria-label="QR code da sala"
          />
        </div>
      </div>
    </Card>
  );
}

export const ShareCard = memo(ShareCardImpl);
