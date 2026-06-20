/** M0 placeholder — audit record shape. */
export type AuditRecord = {
  id: string;
  action: string;
  ts: string;
};

export function placeholderAuditRecord(action = 'm0.stub'): AuditRecord {
  return { id: 'm0', action, ts: new Date().toISOString() };
}
