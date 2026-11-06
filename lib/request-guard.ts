export type RequestTicket = {
  id: number;
  signal: AbortSignal;
};

/**
 * Una sola petición vigente. start() aborta la anterior.
 * isCurrent() deja ignorar la respuesta si el usuario ya limpió o reenvió.
 */
export function createRequestGuard() {
  let seq = 0;
  let controller: AbortController | null = null;

  return {
    start(): RequestTicket {
      controller?.abort();
      controller = new AbortController();
      seq += 1;
      return { id: seq, signal: controller.signal };
    },
    isCurrent(id: number): boolean {
      return id === seq;
    },
    cancel(): void {
      controller?.abort();
      controller = null;
      seq += 1;
    },
  };
}
