import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <p className="site-name">Interfaz de chat</p>
        <nav className="site-nav" aria-label="Secciones">
          <Link href="/#conversacion">Conversación</Link>
          <Link href="/#uso">Uso de tokens</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
      </div>
    </header>
  );
}
