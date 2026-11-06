# Adopción SIGNAL en este prototipo

Autoridad aplicada: el enunciado del chat manda sobre el brief académico SIGNAL, y ese brief manda sobre DESIGN.md cuando se oponen.

| Regla | Decisión | Motivo |
| --- | --- | --- |
| Hero asimétrico y arte principal | No aplicado | La pantalla es la herramienta de chat. El brief académico pide no imponer un hero comercial a una aplicación operativa. |
| Puntero sobre el arte (S-POINTER) | No aplicado | No hay una pieza gráfica principal. Mover el layout con el cursor no explica el chat. |
| Registro de scroll (S-SECTION) | No aplicado | La lista “Qué ocurre al enviar” ya se lee completa. Ocultarla o desplazarla al entrar no aporta el dato. |
| Mensaje nuevo (S-STATE) | Aplicado | 8 px y 180 ms al añadirse el último turno. El texto no se oculta. |
| Controles (S-CONTROL) | Aplicado | Color y borde en 120 ms. El área del botón no se mueve. |
| `prefers-reduced-motion` y preferencia local | Aplicado | CSS del paquete, script mínimo antes de pintar y control en el pie. La preferencia del sistema no se anula. |
| Lockup en el pie | Aplicado | Horizontal o apilado según el ancho, con los SVG originales. |
| SEO de landing | No aplicado | No hay dominio confirmado. `noindex` en las páginas. Sin canonical, sitemap ni schema. |
| Banner de cookies | No aplicado | La aplicación no escribe cookies. La preferencia de animación usa `localStorage`. |
