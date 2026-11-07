# Decisiones

## Clave de Groq

El enunciado ejemplifica `NEXT_PUBLIC_GROQ_API_KEY`. Esa variable quedaría en el cliente. Aquí la clave es `GROQ_API_KEY`, leída solo en `app/api/chat/route.ts`. El navegador no la recibe. No había clave en el entorno de esta implementación: no se creó una cuenta ni se hizo una llamada real a Groq.

## Modelo

Hay dos indicaciones en el enunciado:

1. El brief pide `qwen/qwen3.6-27b`.
2. La lista de la interfaz pide “el modelo Llama 3 de Meta disponible en Groq”, sin id.

Se envía el valor de `GROQ_MODEL`. Si no existe, el defecto es `qwen/qwen3.6-27b`, el único id escrito en el enunciado.

Consulta del 2026-11-06 a la documentación pública de Groq (`https://console.groq.com/docs/deprecations`): `qwen/qwen3.6-27b` figura con apagado el 2026-09-14 y reemplazo `qwen/qwen3.8-27b`. `llama-3.1-8b-instant` y `llama-3.3-70b-versatile` figuran con apagado el 2026-08-16. No se comprobó en vivo qué id acepta una clave actual. Quien tenga clave puede cambiar `GROQ_MODEL` sin tocar el código. Si Groq responde 404, la interfaz dice que se revise el modelo.

No se eligió un id Llama 3 por defecto porque contradiría el id explícito del brief y esos ids públicos ya constan como retirados en la misma página.

## v0.dev

No se generó la interfaz con v0.dev. Habría hecho falta una cuenta externa. El layout está escrito en este repositorio.

## Métricas en modo demostración

Los tokens de demostración son `ceil(caracteres / 4)` por texto, sumados en el historial. El tiempo de demostración es `min(800, 120 + tokens de completado)` milisegundos. Los tokens por segundo salen de esa cifra. No se presentan como medición de Groq. La pantalla lo dice cuando el origen del turno es `mock`.

## Totales

Los totales de sesión suman `prompt_tokens`, `completion_tokens` y `total_tokens` tal como llegaron en cada turno. Si `total_tokens` no coincide con la suma de los otros dos, se muestra un aviso y no se corrige la cifra.

## Persistencia

`useEffect` carga `groq-chat-session-v1` al montar. Otro `useEffect` guarda después de cada cambio, una vez hidratado. Si el JSON guardado no cumple el formato, no se sobrescribe hasta que la persona borra la conversación. Borrar elimina la clave.

## Diseño

La pantalla es una herramienta de chat, no una landing. No hay hero comercial ni seguimiento del puntero: no hay una pieza gráfica principal a la que aplicarlo. El movimiento es el asentamiento de 8 px del mensaje nuevo (180 ms) y el cambio de color de los botones (120 ms). `prefers-reduced-motion` y la preferencia local del pie lo anulan. Los tokens y los lockups del pie son los archivos del paquete SIGNAL, sin regenerarlos.

## Idioma de la interfaz

Los textos de la aplicación están en español. El enunciado existe en inglés y en español; el comportamiento pedido no depende del idioma.
