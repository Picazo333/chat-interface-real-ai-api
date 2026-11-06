"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.digest ?? "app-error");
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="shell page prose">
        <h1>No se pudo mostrar esta pantalla</h1>
        <p className="lead">El fallo queda en el servidor de la aplicación, sin el detalle técnico aquí.</p>
        <p>
          <button type="button" className="button button-primary" onClick={() => reset()}>
            Reintentar esta pantalla
          </button>
        </p>
        <p>
          <Link href="/">Volver al chat</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
