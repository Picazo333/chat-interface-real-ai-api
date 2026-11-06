"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: "#F7F8FA",
          color: "#18202B",
          fontFamily: "Arial, Helvetica, sans-serif",
          lineHeight: 1.5,
        }}
      >
        <main style={{ maxWidth: "68ch", margin: "0 auto", padding: "48px 16px" }}>
          <h1 style={{ fontSize: "2rem", lineHeight: 1.15 }}>No se pudo cargar la aplicación</h1>
          <p>Recarga la página. Esta vista no muestra el detalle interno del fallo.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: 44,
              background: "#B53A17",
              color: "#FFFFFF",
              border: "1px solid #B53A17",
              borderRadius: 8,
              padding: "0 16px",
              font: "inherit",
              fontWeight: 700,
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
