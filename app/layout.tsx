import type { Metadata } from "next";
import { MOTION_STORAGE_KEY } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chat con Groq — prototipo de sesión y tokens",
    template: "%s — Chat con Groq",
  },
  description:
    "Prototipo de chat que reenvía el historial a la API de Groq desde el servidor y muestra los tokens acumulados de la sesión.",
  robots: { index: false, follow: false },
};

const motionBoot = `try{if(localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})==="reduced"){document.documentElement.setAttribute("data-motion","reduced")}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        <noscript>
          <p className="banner shell noscript-banner">
            Para enviar mensajes hace falta JavaScript. El texto de esta página sigue disponible.
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
