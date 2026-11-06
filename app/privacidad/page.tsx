import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SESSION_STORAGE_KEY } from "@/lib/types";

export const metadata: Metadata = {
  title: "Privacidad de este prototipo",
  description:
    "Qué guarda el prototipo de chat en el navegador y cuándo el servidor reenvía el texto a Groq.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="shell page prose">
        <h1>Privacidad de este prototipo</h1>
        <p className="lead">Describe solo lo que hace esta aplicación.</p>
        <p>
          No es una política legal de 4Geeks Academy ni de Divinivid. No hay cuenta de usuario ni
          analítica.
        </p>
        <h2>Qué se guarda en el navegador</h2>
        <p>
          La conversación y las métricas de cada respuesta se escriben en{" "}
          <span className="mono">{SESSION_STORAGE_KEY}</span> de <span className="mono">localStorage</span>.
          Permanecen en este navegador hasta que pulsas Borrar conversación o eliminas los datos del sitio.
        </p>
        <p>
          La preferencia “Reducida en este navegador” usa la clave{" "}
          <span className="mono">signal-motion</span>. Esta aplicación no crea cookies.
        </p>
        <h2>Qué sale del navegador</h2>
        <p>
          Al enviar, el texto de los turnos va a la ruta <span className="mono">/api/chat</span> de este
          mismo servidor. Esa ruta no devuelve la clave.
        </p>
        <p>
          Si <span className="mono">GROQ_API_KEY</span> está configurada y el modo no es demostración, el
          servidor reenvía el historial a <span className="mono">
            https://api.groq.com<wbr />/openai<wbr />/v1<wbr />/chat<wbr />/completions
          </span>.
          Groq es el tercero que recibe el texto en ese caso. Sin clave, la respuesta se calcula en el
          servidor y el texto no se envía a Groq.
        </p>
        <h2>Cómo borrarlo</h2>
        <p>
          En la página de inicio, Borrar conversación elimina el historial del estado y de{" "}
          <span className="mono">localStorage</span>.
        </p>
        <p>
          <Link href="/">Volver al chat</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
