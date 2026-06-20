# M4.5 Control Plane Boundary (M0 placeholder)

## Principle

The Streamlit dashboard is a **read-mostly control plane**. It must not weaken containment boundaries for UI convenience.

## Rules

1. Dashboard reads telemetry and validated traces — it does not execute tools or payments.
2. All writes go through backend services with policy + token gates (future milestones).
3. `safe_render` redacts secrets before display.
4. Fixture data only in M0 — no live agent loop.

## M0

Component shells exist under `dashboard/components/`. Services return placeholders.
