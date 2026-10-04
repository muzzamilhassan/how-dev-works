"""Replication topology with real icons — renders 01-replication.svg.

Run:  pip install diagrams && python 01-replication.py  (needs Graphviz installed)
Vendor icons are provider-owned assets: keep them unmodified in published videos.
"""

from diagrams import Cluster, Diagram

from diagrams.onprem.client import Users
from diagrams.onprem.database import PostgreSQL

with Diagram(
    "Replication topology",
    show=False,
    outformat="svg",
    filename="diagram-lab/out/01-replication",
    graph_attr={"bgcolor": "transparent"},
):
    app = Users("App servers")

    with Cluster("DB cluster"):
        primary = PostgreSQL("primary")
        with Cluster("read replicas"):
            r1 = PostgreSQL("replica-1")
            r2 = PostgreSQL("replica-2")

    app >> primary
    primary << r1
    primary << r2
