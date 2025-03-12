import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

const GraphView: React.FC = () => {
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ id: number; title: string; content: string } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Initialize Cytoscape
  const initializeCytoscape = () => {
    if (!graphContainerRef.current) return;
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    console.log("Initializing Cytoscape...");

    cyRef.current = cytoscape({
      container: graphContainerRef.current,
      layout: { name: "preset" },
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#29A19C",
            color: "white",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "12px",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#E0E1DD",
            "curve-style": "bezier",
          },
        },
      ],
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  };

  // Update the graph with new data
  const updateGraph = (data: any) => {
    if (!data || !data.nodes || !data.links) {
      console.error("Invalid graph data received:", data);
      return;
    }
    if (!cyRef.current) return;

    console.log("Updating graph with new data:", data);
    const cy = cyRef.current;

    cy.batch(() => {
      cy.elements().remove();

      // Map nodes
      const nodes = data.nodes.map((note: any, index: number) => ({
        data: { id: `n${note.id}`, label: note.title },
        position: { x: index * 120, y: index * 80 },
      }));

      // Map edges
      const edges = data.links.map((link: any) => ({
        data: { source: `n${link.from_note_id}`, target: `n${link.to_note_id}` },
      }));

      cy.add([...nodes, ...edges]);
    });

    // Run layout after adding elements
    cy.layout({ name: "cose", animate: true, fit: true, padding: 50 }).run();

    setTimeout(() => {
      cy.fit();
      cy.center();
      cy.resize();
      console.log("Graph fully refreshed.");
    }, 1000);
  };

  // Fetch graph data and update Cytoscape
  useEffect(() => {
    initializeCytoscape();
    fetch("http://localhost:5000/api/notes/graph", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("Graph data received:", data);
        updateGraph(data);
      })
      .catch((error) => console.error("Error fetching graph:", error));
  }, []);

  // Handle node selection
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    const handleNodeClick = (event: any) => {
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

    cy.on("tap", "node", handleNodeClick);
    return () => {
      cy.off("tap", "node", handleNodeClick);
    };
  }, []);

  // Handle note update
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
    } else {
      alert("Error updating note.");
    }
  };

  // Handle note deletion
  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    const response = await fetch(`http://localhost:5000/api/notes/${selectedNote.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      alert("Note deleted successfully!");
      setSelectedNote(null);
      fetch("http://localhost:5000/api/notes/graph", { credentials: "include" })
        .then((res) => res.json())
        .then(updateGraph)
        .catch((error) => console.error("Error fetching graph:", error));
    } else {
      alert("Error deleting note.");
    }
  };

  return (
    <div style={styles.graphContainer}>
      <div ref={graphContainerRef} style={styles.cyContainer}></div>
      {selectedNote && (
        <div style={styles.notePreview}>
          <h3>Edit Note</h3>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={styles.input}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={styles.textarea}
          />
          <button onClick={handleUpdateNote} style={styles.saveButton}>Save</button>
          <button onClick={handleDeleteNote} style={styles.deleteButton}>Delete</button>
        </div>
      )}
    </div>
  );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  graphContainer: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#1B263B",
    position: "absolute",
    top: 0,
    left: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  cyContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    left: "0",
    top: "0",
    zIndex: 2,
  },
  notePreview: {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "300px",
    maxHeight: "60vh",
    overflowY: "auto",
    backgroundColor: "#0D1B2A",
    color: "#E0E1DD",
    padding: "15px",
    borderRadius: "5px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
    zIndex: 10,
  },
  input: {
    width: "94%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "94%",
    height: "100px",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  saveButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#29A19C",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  deleteButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default GraphView;
