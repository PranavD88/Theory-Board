import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

const GraphView: React.FC = () => {
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNote] = useState<{ title: string; content: string } | null>(null);

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
        position: { x: index * 120, y: index * 80 }, // Prevents overlap
      }));

      // Map edges
      const edges = data.links.map((link: any) => ({
        data: { source: `n${link.from_note_id}`, target: `n${link.to_note_id}` },
      }));

      cy.add([...nodes, ...edges]);
    });

    // Run layout **after** adding elements
    cy.layout({ name: "cose", animate: true, fit: true, padding: 50 }).run();

    // Force graph to refresh **after** layout completes
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

  // Handle graph resizing
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.fit();
        cyRef.current.center();
      }
    });

    if (graphContainerRef.current) {
      resizeObserver.observe(graphContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div style={styles.graphContainer}>
      <div ref={graphContainerRef} style={styles.cyContainer}></div>
      {selectedNote && (
        <div style={styles.notePreview}>
          <h3>{selectedNote.title}</h3>
          <p>{selectedNote.content}</p>
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
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#0D1B2A",
    color: "#E0E1DD",
    padding: "10px",
    borderRadius: "5px",
    textAlign: "center",
    width: "250px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
    zIndex: 10,
  },
};

export default GraphView;
