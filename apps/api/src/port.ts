export const DEFAULT_API_PORT = 4100;

export function resolveApiPort(envPort: string | undefined = process.env.PORT): number {
  const portParsed = Number(envPort);
  return Number.isInteger(portParsed) && portParsed > 0 && portParsed <= 65535
    ? portParsed
    : DEFAULT_API_PORT;
}
