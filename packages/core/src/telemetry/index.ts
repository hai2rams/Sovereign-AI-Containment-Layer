/** M0 placeholder — telemetry event shape. */
export type TelemetryEvent = {
  ts: string;
  kind: string;
  payload: Record<string, unknown>;
};

export function placeholderTelemetryEvent(kind = 'm0.stub'): TelemetryEvent {
  return { ts: new Date().toISOString(), kind, payload: {} };
}
