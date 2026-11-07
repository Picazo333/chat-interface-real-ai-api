import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="shell page prose">
        <h1>Esa ruta no existe</h1>
        <p className="lead">No hay una página en esta dirección.</p>
        <p>
          <Link href="/">Volver al chat</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
