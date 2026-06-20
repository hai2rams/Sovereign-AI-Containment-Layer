"""Backend client — read-only anchor status from telemetry snapshot."""


def get_anchor_status() -> dict:
    from services.telemetry_reader import latest_control_plane_snapshot

    snapshot = latest_control_plane_snapshot()
    roots = snapshot.get("roots", {})
    anchored = any(value != "—" for value in roots.values())
    return {
        "status": "anchored" if anchored else "pending",
        "writable": False,
        "roots": roots,
    }
