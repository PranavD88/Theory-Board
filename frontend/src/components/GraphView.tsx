import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

const GraphView: React.FC = () => {
    const graphContainerRef = useRef<HTMLDivElement | null>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [selectedNote, setSelectedNote] = useState<{ title: string; content: string } | null>(null);

    // Initialize Cytoscape
    useEffect(() => {
        if (!graphContainerRef.current) return;

        if (cyRef.current) {
            cyRef.current.destroy();
            cyRef.current = null;
        }

        console.log("Initializing Cytoscape...");

        cyRef.current = cytoscape({
            container: graphContainerRef.current,
            layout: { name: "cose", animate: true },
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

        setTimeout(() => {
            if (cyRef.current) {
                cyRef.current.fit();
                cyRef.current.center();
                cyRef.current.zoom(1);
            }
        }, 500);

        return () => {
            if (cyRef.current) {
                console.log("Destroying Cytoscape...");
                cyRef.current.destroy();
                cyRef.current = null;
            }
        };
    }, []);

    // Fetch graph data and update Cytoscape
    useEffect(() => {
        fetch("http://localhost:5000/api/notes/graph")
            .then((res) => res.json())
            .then((data) => {
                if (!cyRef.current) return;

                const nodes = data.nodes.map((note: any) => ({
                    data: { id: `n${note.id}`, label: note.title },
                    position: { x: Math.random() * 500, y: Math.random() * 500 },
                }));
                const edges = data.links.map((link: any) => ({
                    data: { source: `n${link.from_note_id}`, target: `n${link.to_note_id}` },
                }));

                cyRef.current.elements().remove();
                cyRef.current.add([...nodes, ...edges]);

                cyRef.current.layout({ name: "cose", animate: true, fit: true, padding: 50 }).run();
                cyRef.current.fit();
                cyRef.current.center();
                cyRef.current.pan({ x: 0, y: 0 });

                setTimeout(() => {
                    const canvases = graphContainerRef.current?.querySelectorAll("canvas");
                    canvases?.forEach((canvas) => {
                        (canvas as HTMLElement).style.left = "0px";
                        (canvas as HTMLElement).style.transform = "none";
                    });
                }, 100);
            })
            .catch((error) => console.error("Error fetching graph:", error));
    }, []);

    // Handle node selection
    useEffect(() => {
        if (!cyRef.current) return;
        const cy = cyRef.current;

        const handleNodeClick = (event: any) => {
            const nodeId = event.target.id().substring(1);
            fetch(`http://localhost:5000/api/notes/${nodeId}`)
                .then((res) => res.json())
                .then((data) => {
                    setSelectedNote(data);
                    setTimeout(() => {
                        cy.fit();
                        cy.center();
                    }, 300);
                })
                .catch((error) => console.error("Error fetching note:", error));
        };

        cy.on("tap", "node", handleNodeClick);

        return () => {
            cy.off("tap", "node", handleNodeClick);
        };
    }, []);

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
