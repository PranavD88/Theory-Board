import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import cytoscape from "cytoscape";
import RichTextEditor from "./RichTextEditor";

export interface GraphViewHandles {
  addNode: (newNote: any) => void;
  addEdge: (fromNoteId: number, toNoteId: number) => void;
  removeNode: (noteId: number) => void;
  removeEdge: (fromNoteId: number, toNoteId: number) => void;
  clearGraph: () => void;
}

type SelectedEdge = {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
} | null;

const GraphView = forwardRef<GraphViewHandles>((props, ref) => {
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNote, setSelectedNote] = useState<{
    id: number
    title: string
    content: string
    tags?: string[]
  } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Initialize Cytoscape
  const initializeCytoscape = () => {
    if (!graphContainerRef.current) return;
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    cyRef.current = cytoscape({
      container: graphContainerRef.current,
      layout: { name: "preset" },
      elements: [],
      // Graph style
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#131821",
            color: "#ff005d",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "6px",
            "border-style": "solid", "border-width": "1px","border-color": "#ff005d"
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#ff005d",
            "curve-style": "bezier",
          },
        },
      ],
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  };

  // Initial fetch only – complete graph load.
  const updateGraph = (data: any) => {
    if (!data || !data.nodes || !data.links) {
      console.error("Invalid graph data received:", data);
      return;
    }
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.batch(() => {
      cy.elements().remove();

      // Add nodes
      const nodes = data.nodes.map((note: any, index: number) => ({
        data: { id: `n${note.id}`, label: note.title },
        position: { x: index * 120, y: index * 80 },
      }));

      // Add edges
      const edges = data.links.map((link: any) => ({
        data: { source: `n${link.from_note_id}`, target: `n${link.to_note_id}` },
      }));

      cy.add([...nodes, ...edges]);
    });

    cy.layout({ name: "cose", animate: true, fit: true, padding: 50 }).run();

    setTimeout(() => {
      cy.fit();
      cy.center();
      cy.resize();
    }, 1000);
  };

  // Initial fetch of the graph data
  useEffect(() => {
    initializeCytoscape();
    fetch("http://localhost:5000/api/notes/graph", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        updateGraph(data);
      })
      .catch((error) => console.error("Error fetching graph:", error));
  }, []);

  // Handle node and edge selection
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    const handleNodeClick = (event: any) => {
      setSelectedEdge(null);
      const nodeId = event.target.id().substring(1);
      fetch(`http://localhost:5000/api/notes/${nodeId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setSelectedNote(data);
          setEditTitle(data.title);
          setEditContent(data.content);
        })
        .catch((error) => console.error("Error fetching note:", error));
    };

    const handleEdgeClick = (event: any) => {
      setSelectedNote(null);
      const edgeData = event.target.data();
      const sourceNode = cy.getElementById(edgeData.source);
      const targetNode = cy.getElementById(edgeData.target);
      setSelectedEdge({
        source: edgeData.source,
        target: edgeData.target,
        sourceLabel: sourceNode ? sourceNode.data("label") : edgeData.source,
        targetLabel: targetNode ? targetNode.data("label") : edgeData.target,
      });
    };

    cy.on("tap", "node", handleNodeClick);
    cy.on("tap", "edge", handleEdgeClick);

    return () => {
      cy.off("tap", "node", handleNodeClick);
      cy.off("tap", "edge", handleEdgeClick);
    };
  }, []);

  // Handle note update without full refresh
  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    const response = await fetch(`http://localhost:5000/api/notes/${selectedNote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: editTitle, content: editContent }),
    });

    if (response.ok) {
      alert("Note updated successfully!");
      setSelectedNote({ ...selectedNote, title: editTitle, content: editContent });
      if (cyRef.current) {
        const node = cyRef.current.getElementById(`n${selectedNote.id}`);
        node.data("label", editTitle);
      }
    } else {
      alert("Error updating note.");
    }
  };

  // Handle note deletion without full refresh
  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    const response = await fetch(`http://localhost:5000/api/notes/${selectedNote.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      alert("Note deleted successfully!");
      if (cyRef.current) {
        cyRef.current.getElementById(`n${selectedNote.id}`).remove();
      }
      setSelectedNote(null);
    } else {
      alert("Error deleting note.");
    }
  };

  // Handle unlinking an edge without full refresh
  const handleUnlinkEdge = async () => {
    if (!selectedEdge) return;
    const fromNoteId = selectedEdge.source.substring(1);
    const toNoteId = selectedEdge.target.substring(1);
    const response = await fetch(
      `http://localhost:5000/api/notes/unlink?from_note_id=${fromNoteId}&to_note_id=${toNoteId}`,
      { method: "DELETE", credentials: "include" }
    );

    if (response.ok) {
      alert("Link unlinked successfully!");
      if (cyRef.current) {
        cyRef.current.edges().forEach((edge) => {
          if (
            edge.source().id() === `n${fromNoteId}` &&
            edge.target().id() === `n${toNoteId}`
          ) {
            edge.remove();
          }
        });
      }
      setSelectedEdge(null);
    } else {
      alert("Error unlinking connection.");
    }
  };

  // Expose incremental update functions to parent components
  useImperativeHandle(ref, () => ({
    addNode(newNote: any) {
      if (cyRef.current) {
        cyRef.current.add({
          data: { id: `n${newNote.id}`, label: newNote.title },
          position: { x: Math.random() * 500, y: Math.random() * 500 },
        });
      }
    },
    addEdge(fromNoteId: number, toNoteId: number) {
      if (cyRef.current) {
        cyRef.current.add({
          data: { source: `n${fromNoteId}`, target: `n${toNoteId}` },
        });
      }
    },
    removeNode(noteId: number) {
      if (cyRef.current) {
        cyRef.current.getElementById(`n${noteId}`).remove();
      }
    },
    removeEdge(fromNoteId: number, toNoteId: number) {
      if (cyRef.current) {
        cyRef.current.edges().forEach((edge) => {
          if (
            edge.source().id() === `n${fromNoteId}` &&
            edge.target().id() === `n${toNoteId}`
          ) {
            edge.remove();
          }
        });
      }
    },
    clearGraph() {
      if (cyRef.current) {
        cyRef.current.elements().remove();
      }
    },
  }));

  console.log("Selected Note Tags:", selectedNote?.tags);

  return (
    <div style={styles.graphContainer}>
      <div ref={graphContainerRef} style={styles.cyContainer}></div>

      {selectedNote && (
        <div style={styles.notePreview}>
          <h3 style={styles.noteTitle}>Edit Note</h3>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={styles.input}
          />
          <RichTextEditor content={editContent} onChange={setEditContent} />

          {(selectedNote?.tags?.length ?? 0) > 0 && (
            <div style={{ marginBottom: "10px", width: "100%" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Tags</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "5px" }}>
                {selectedNote?.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: "#444",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleUpdateNote} style={styles.saveButton}>
            Save
          </button>
          <button onClick={handleDeleteNote} style={styles.deleteButton}>
            Delete
          </button>
        </div>
      )}

      {selectedEdge && (
        <div style={styles.notePreview}>
          <h3 style={styles.noteTitle}>Unlink Connection</h3>
          <p>
            Unlink connection between "{selectedEdge.sourceLabel}" and "
            {selectedEdge.targetLabel}"
          </p>
          <button onClick={handleUnlinkEdge} style={styles.unlinkButton}>
            Unlink
          </button>
        </div>
      )}
    </div>
  );
});



// Styles
const styles: Record<string, React.CSSProperties> = {
  graphContainer: {
    // transforms for node graph interaction div / background
    width: "92vw",
    height: "75vh",
    backgroundColor: "#131821",
    position: "inherit",
    top: "4vh",
    left: "0",
    bottom: "30vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderStyle: "solid",borderColor: "#ff005d", borderWidth: "2px",
    zIndex: 1,
  },
  cyContainer: {
    // transforms for node graph render div /forground
    width: "92vw",
    height: "75vh",
    position: "initial",
    display: "flex",
    justifyContent: "center",
    left: "0",
    top: "4vh",
    bottom:"0",
    zIndex: 2,
  },
  notePreview: {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "350px",
    maxHeight: "70vh",
    overflowY: "auto",
    backgroundColor: "#0D1B2A",
    color:"#ff005d",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.3)",
    zIndex: 10,
  },
  noteTitle: {
    textAlign: "center",
    fontSize: "18px",
    color:"#ff005d",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  input: {
    width: "94%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "94%",
    height: "150px",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  saveButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#29A19C",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  deleteButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  unlinkButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#FF9900",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default GraphView;
