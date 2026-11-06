import Link from "next/link";
import { MotionPreference } from "./MotionPreference";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="lockup">
          {/* next/image puede reescribir el SVG. El lockup tiene que servirse byte a byte. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="lockup-horizontal"
            src="/brand/lockups/signal-horizontal.svg"
            width={400}
            height={64}
            alt="4Geeks por Divinivid"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="lockup-stacked"
            src="/brand/lockups/signal-stacked.svg"
            width={280}
            height={140}
            alt="4Geeks por Divinivid"
          />
          <p className="caption">Crédito visual del encargo académico. No declara una asociación oficial.</p>
        </div>
        <div className="footer-meta">
          <nav aria-label="Pie">
            <Link href="/">Inicio</Link>
            <Link href="/privacidad">Privacidad de este prototipo</Link>
          </nav>
          <MotionPreference />
        </div>
      </div>
    </footer>
  );
}
