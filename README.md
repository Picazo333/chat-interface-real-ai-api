# Chat con Groq

Prototipo de interfaz de chat en Next.js. El navegador guarda la conversación y muestra el uso de tokens de la sesión. El servidor reenvía el historial a la API de Groq con `fetch` cuando hay una clave. Sin clave, responde en un modo de demostración explícito.

## Cómo ejecutarlo

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

La aplicación queda en `http://localhost:3000`.

Comprobaciones:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Variables de entorno

| Variable | Dónde se lee | Función |
| --- | --- | --- |
| `GROQ_API_KEY` | Solo el servidor | Bearer token de Groq. Si está vacía y `CHAT_MODE=auto`, se usa el modo demostración. |
| `GROQ_MODEL` | Solo el servidor | Id de modelo enviado a Groq. Por defecto `qwen/qwen3.6-27b`. |
| `CHAT_MODE` | Solo el servidor | `auto`, `mock` o `live`. |
| `MOCK_LATENCY_MS` | Solo el servidor | Espera artificial del modo demostración, para ver “Pensando…”. No es latencia de Groq. |

Plantilla: `.env.example`. `.env` y `.env.local` están en `.gitignore`.

## Adaptación de seguridad

El enunciado pone como ejemplo `NEXT_PUBLIC_GROQ_API_KEY`. Ese prefijo de Next.js copia la variable al JavaScript que descarga el navegador, así que cualquiera que abra la página podría leer la clave.

En este repositorio la clave se llama `GROQ_API_KEY` y solo la lee `app/api/chat/route.ts`. El navegador llama a `/api/chat` con el historial. Esa ruta hace el `fetch` a `https://api.groq.com/openai/v1/chat/completions` y pone a mano estas cabeceras:

```text
Authorization: Bearer <GROQ_API_KEY>
Content-Type: application/json
```

No hay SDK de Groq. El cuerpo lleva `model` y `messages` con todos los turnos de usuario y asistente. La respuesta JSON hacia el navegador no incluye la clave.

## Discrepancia del modelo

El brief del enunciado pide el modelo `qwen/qwen3.6-27b`. Más adelante, la lista de tareas dice que se use “el modelo Llama 3 de Meta disponible en Groq”, sin dar un id.

Decisión: `GROQ_MODEL` vale `qwen/qwen3.6-27b` si no se define otra cosa, porque es el único id que el enunciado escribe. No se cambió en silencio a un Llama 3.

La página pública de deprecaciones de Groq, consultada el 2026-11-06, indica el apagado de `qwen/qwen3.6-27b` el 2026-09-14 y recomienda `qwen/qwen3.8-27b`. También da por retirados, el 2026-08-16, `llama-3.1-8b-instant` y `llama-3.3-70b-versatile`. Esta implementación no hizo una llamada real para comprobar qué id acepta una cuenta. Si Groq rechaza el id por defecto, se puede fijar en `.env.local`:

```bash
GROQ_MODEL=qwen/qwen3.8-27b
```

El detalle está en `ASSUMPTIONS.md`.

## Modo demostración

Sin `GROQ_API_KEY`, o con `CHAT_MODE=mock`, `/api/chat` no llama a Groq. Devuelve un texto que dice que es una respuesta de demostración y unos conteos de tokens calculados en local (`longitud / 4`). La interfaz lo rotula como demostración. Esas cifras no son consumo real.

`CHAT_MODE=live` sin clave responde 503 y no inventa un mensaje del modelo.

El botón “Probar error de la API” solo aparece en modo demostración. Fuerza un error legible para comprobar el aviso y el reintento. En modo live se ignora y la petición sigue hacia Groq.

No hay clave en el entorno de esta entrega, así que no hay una respuesta real del modelo ni un objeto `usage` observado desde Groq.

## Qué hace la interfaz

- Campo Mensaje y botón Enviar mensaje. Enter envía; Mayús+Enter añade una línea.
- Historial con turnos de “Tú” y “Asistente”.
- Estado “Pensando…” mientras la petición está en curso. El envío se desactiva para no duplicarlo.
- Si la respuesta no es 2xx, se muestra un mensaje legible y se puede reintentar. El mensaje del usuario permanece.
- Totales de sesión: tokens de prompt, tokens de completado y total. Salen de sumar el `usage` de cada respuesta, sin recalcular el total si no cuadra con la suma.
- Métricas extra de la última respuesta: modelo, tiempo de la petición y tokens por segundo.
- Tabla con el desglose de cada respuesta.
- `localStorage` (`groq-chat-session-v1`) al montar y después de cada cambio del historial.
- Borrar conversación pide confirmación, aborta una petición en curso y elimina la clave de `localStorage`.
- Exportar historial (`.json`) descarga el historial, el desglose y los totales. El archivo se genera en el navegador.

Una petición nueva aborta la anterior. Si la respuesta vieja llega después, no se añade al historial.

## Estructura

```text
app/page.tsx                 Página del chat
app/privacidad/page.tsx      Qué se guarda y cuándo el texto sale hacia Groq
app/api/chat/route.ts        Proxy: lee la clave y llama a Groq, o responde en demostración
app/not-found.tsx            HTTP 404
components/ChatSession.tsx   useState, useEffect, envío y persistencia
lib/chat-completion.ts       fetch a Groq y modo demostración
lib/metrics.ts               Acumulado de usage
lib/session-storage.ts       Lectura y borrado de localStorage
lib/request-guard.ts         Cancelación de respuestas obsoletas
lib/export-session.ts        JSON de exportación
styles/                      Tokens SIGNAL, copiados sin modificar
public/brand/lockups/        Lockups usados en el pie, bytes originales
```

## Interfaz inicial

El enunciado pide generar el primer layout con v0.dev. No se usó: exige una cuenta externa y esta entrega no crea cuentas ni simula esa herramienta. La interfaz está escrita en este repositorio, con los tokens del paquete SIGNAL (Arial/Helvetica, colores y espaciado de `styles/tokens.css`).

## Límites

- No hay respuesta real de Groq mientras falte `GROQ_API_KEY`.
- El modo demostración no estima el tokenizador del proveedor. Solo ejercita el mismo camino de acumulación y de pantalla.
- No hay dominio público confirmado: las páginas llevan `noindex` y no hay canonical ni sitemap.
