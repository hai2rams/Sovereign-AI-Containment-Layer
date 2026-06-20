"""Graphviz workflow graph for containment pipeline (read-only presentation)."""

from __future__ import annotations

from typing import Any

from services.workflow_state import (
    CONTROL_PLANE_NODES,
    EXTERNAL_NODES,
    NODE_LABELS,
    NODE_ORDER,
    UNTRUSTED_NODES,
    WorkflowStatus,
)

STATUS_COLORS: dict[str, str] = {
    "passed": "#90EE90",
    "confirmed": "#90EE90",
    "blocked": "#FFB6B6",
    "escalated": "#FFD580",
    "warning": "#FFD580",
    "skipped": "#D3D3D3",
    "pending": "#FFF9C4",
}

STATUS_BORDER: dict[str, str] = {
    "passed": "#2E7D32",
    "confirmed": "#2E7D32",
    "blocked": "#C62828",
    "escalated": "#EF6C00",
    "warning": "#EF6C00",
    "skipped": "#9E9E9E",
    "pending": "#F9A825",
}


def _node_style(node_id: str, status: WorkflowStatus) -> str:
    fill = STATUS_COLORS.get(status, "#FFFFFF")
    border = STATUS_BORDER.get(status, "#455A64")
    if node_id in UNTRUSTED_NODES:
        border = "#C62828" if status in {"warning", "blocked"} else "#EF6C00"
    elif node_id in CONTROL_PLANE_NODES:
        border = "#2E7D32" if status in {"passed", "confirmed"} else border
    penwidth = "2.5" if node_id == "untrusted_model_output" else "1.8"
    return (
        f'fillcolor="{fill}", color="{border}", style="filled,rounded", '
        f'fontname="Helvetica", penwidth={penwidth}'
    )


def build_workflow_dot(workflow_state: dict[str, Any]) -> str:
    node_status: dict[str, str] = workflow_state["node_status"]
    lines = [
        "digraph containment_workflow {",
        "  rankdir=LR;",
        '  graph [bgcolor="#FAFAFA", fontname="Helvetica", splines=ortho];',
        '  node [shape=box, margin="0.18,0.10"];',
        '  edge [color="#607D8B", arrowsize=0.7];',
        "",
        '  subgraph cluster_untrusted {',
        '    label="UNTRUSTED MODEL SPACE";',
        '    color="#EF6C00"; style=dashed; fontsize=11;',
    ]

    for node_id in UNTRUSTED_NODES:
        label = NODE_LABELS[node_id]
        status = node_status.get(node_id, "pending")
        lines.append(f'    {node_id} [label="{label}\\n({status})", {_node_style(node_id, status)}];')

    lines.extend(
        [
            "  }",
            "",
            '  subgraph cluster_control {',
            '    label="TRUSTED CONTROL PLANE";',
            '    color="#2E7D32"; style=dashed; fontsize=11;',
        ],
    )

    for node_id in CONTROL_PLANE_NODES:
        label = NODE_LABELS[node_id]
        status = node_status.get(node_id, "pending")
        lines.append(f'    {node_id} [label="{label}\\n({status})", {_node_style(node_id, status)}];')

    lines.extend(
        [
            "  }",
            "",
            '  subgraph cluster_external {',
            '    label="EXTERNAL / ANCHORING LAYER";',
            '    color="#1565C0"; style=dashed; fontsize=11;',
        ],
    )

    for node_id in EXTERNAL_NODES:
        label = NODE_LABELS[node_id]
        status = node_status.get(node_id, "pending")
        lines.append(f'    {node_id} [label="{label}\\n({status})", {_node_style(node_id, status)}];')

    lines.append("  }")
    lines.append("")

    flow_edges = list(zip(NODE_ORDER, NODE_ORDER[1:]))
    for src, dst in flow_edges:
        lines.append(f"  {src} -> {dst};")

    lines.append("}")
    return "\n".join(lines)


def required_node_labels() -> list[str]:
    return list(NODE_LABELS.values())


def render_workflow_graph(workflow_state: dict[str, Any]) -> None:
    import streamlit as st

    dot = build_workflow_dot(workflow_state)
    st.subheader("Containment workflow trace")
    st.graphviz_chart(dot, use_container_width=True)
