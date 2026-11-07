# 004 Groq live evidence
captured_at: 2026-11-06 08:38:18 CST

## R01: PASS
- command: GET https://api.groq.com/openai/v1/models (Bearer $GROQ_API_KEY; key never logged)
- timestamp_cst: 2026-11-06 08:38:18 CST
- http_status: 200
- latency_ms: 112.4
- model_count: 11
- has_qwen_qwen3_8_27b: True
- key_prefix: gsk_
- key_len: 56
- note: Cuenta Groq de Miguel verificada por clave gsk_ operativa (HTTP 200). No se creó cuenta nueva.

## R02: PASS
- command: test -f .env.local && medir longitud de GROQ_API_KEY (valor redactado)
- timestamp_cst: 2026-11-06 08:38:18 CST
- env_file: .env.local
- bytes: 131
- key_set: True
- key_len: 56
- model: GROQ_MODEL=qwen/qwen3.8-27b
- chat_mode: CHAT_MODE=live
- gitignore_covers_dotenv: True
- note: Clave de Miguel guardada en .env.local del clone local. No se imprime ni se committea.

## R03: PASS
- command: POST chat/completions directo + POST /api/chat Next (CHAT_MODE=live)
- timestamp_cst: 2026-11-06 08:38:18 CST
- note: Fetch real a api.groq.com. Modelo qwen/qwen3.8-27b (sucesor documentado en .env.example; qwen3.6-27b no disponible en esta cuenta).
- direct_http: 200 lat=864.8ms model=qwen/qwen3.8-27b usage={'queue_time': 0.773701038, 'prompt_tokens': 42, 'prompt_time': 3.9459e-05, 'completion_tokens': 12, 'completion_time': 0.041669102, 'total_tokens': 54, 'total_time': 0.041708561}
- direct_excerpt: 'hola desde la prueba live de 004'
- app_http: 200 lat=152.2ms mode=None model=qwen/qwen3.8-27b usage={'prompt_tokens': 21, 'completion_tokens': 3, 'total_tokens': 24}
- app_excerpt: 'LISTO'

## R04: HITL_MIGUEL
- note: v0.dev exige cuenta/acción de Miguel. Fuera de esta tanda Groq.
