import { ChatSession } from "@/components/ChatSession";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="shell page">
        <h1>Chat con Groq</h1>
        <p className="lead">Cada envío manda el historial completo al servidor.</p>
        <p>
          La pantalla suma los tokens que vuelven en <span className="mono">usage</span>. La clave, si
          existe, se lee solo en el servidor.
        </p>
        <ChatSession />
        <section className="process" aria-labelledby="proceso-titulo">
          <h2 id="proceso-titulo">Qué ocurre al enviar</h2>
          <ol>
            <li>El mensaje se añade al historial de esta pestaña.</li>
            <li>
              El navegador envía todos los turnos a <span className="mono">/api/chat</span>.
            </li>
            <li>
              El servidor llama a <span className="mono">api.groq.com</span> con{" "}
              <span className="mono">fetch</span> o, si no hay clave, arma una respuesta local.
            </li>
            <li>
              Los tokens de ese turno se suman y el historial queda en{" "}
              <span className="mono">localStorage</span>.
            </li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
