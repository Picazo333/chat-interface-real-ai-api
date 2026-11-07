# 004 — revisión de propuesta visual v0 / Vercel

**Fecha de comprobación:** 2026-11-06, CDMX.
**URL aportada por el alumno:** https://chat-interface-04.vercel.app/
**Vercel (consulta autenticada):** proyecto `chat-interface-04`, despliegue `dpl_HHvwnZdyQVCH4AmrTvMRTH4oCTVn`, producción `READY`, `source=cli`; framework Next.js.
**Importante:** este despliegue es independiente del repositorio académico `Picazo333/chat-interface-real-ai-api` y su PR #1. La URL demuestra un artefacto desplegado, no por sí sola la procedencia histórica de la generación en v0 ni su incorporación al PR.

## Código de la propuesta inspeccionado

El árbol de fuentes del despliegue incluye `src/components/chat/chat-panel.tsx`, `chat-header.tsx`, `chat-input.tsx`, `chat-message.tsx`, `chat-states.tsx`, `message-list.tsx`, `model-indicator.tsx`, `token-usage.tsx`, `types.ts` y `src/components/chat-demo.tsx`.

`ChatPanel` acepta `messages`, `model`, `usage`, `status`, `error` y callbacks `onSend`, `onClear`, `onRetry`. Es una propuesta de **componente presentacional reutilizable**. El archivo `chat-demo.tsx` declara expresamente `mockReply` y un controlador de demostración: no es evidencia de chat real con Groq ni debe sustituir la lógica existente.

## Decisión de integración y seguridad

- Preservar `components/ChatSession.tsx`, el proxy server-side a Groq, manejo de errores, persistencia y métricas validadas en el PR.
- Evaluar adoptar `ChatPanel` y sus subcomponentes solo si hay beneficio visual comprobable y los props se adaptan a los contratos de la app. El demo `mockReply` no se integra como implementación final.
- No publicar ni copiar `GROQ_API_KEY`; ninguna clave debe estar en archivos `NEXT_PUBLIC_*` ni en código cliente.
- No declarar que v0 generó históricamente la app previa. La generación actual debe acreditarse con URL de proyecto de v0 o evidencia equivalente, si el profesor la exige.

**Estado:** despliegue inspeccionado; revisión del patrón de componentes realizada. **Pendiente:** preservar la fuente/exportación de v0 en la rama académica, decidir implementación de cambios visuales y ejecutar QA de no regresión. La disponibilidad de la URL no equivale a cierre R04.
