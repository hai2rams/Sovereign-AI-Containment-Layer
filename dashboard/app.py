"""Sovereign AI Containment Layer — M0 dashboard shell."""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import streamlit as st

from components.header_matrix import render_header_matrix
from components.split_panels import render_split_panels
from services.telemetry_reader import read_telemetry_tail

st.set_page_config(page_title="Containment Layer", layout="wide")

st.title("Sovereign AI Containment Layer")
st.caption("M0 control-plane shell — read-only, no payment or tool execution.")

render_header_matrix()
render_split_panels(read_telemetry_tail())
