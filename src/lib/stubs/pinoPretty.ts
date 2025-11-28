/**
 * Lightweight placeholder for `pino-pretty` that mirrors the callable API
 * and returns a basic passthrough transform stream. This keeps optional
 * logging dependencies from blocking web builds in test environments.
 */
const pinoPretty = () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  transform: (chunk: unknown) => chunk
});

export default pinoPretty;
