import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import cytoscape from "cytoscape";
import RichTextEditor from "./RichTextEditor";
import "./GraphView.css";

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
    id: number;
    title: string;
    content: string;
    tags?: string[];
  } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [clickOffset, setClickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
            "border-style": "solid",
            "border-width": "1px",
            "border-color": "#ff005d",
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

  const updateGraph = (data: any) => {
    if (!data || !data.nodes || !data.links) {
      console.error("Invalid graph data received:", data);
      return;
    }
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.batch(() => {
      cy.elements().remove();

      const nodes = data.nodes.map((note: any, index: number) => ({
        data: { id: `n${note.id}`, label: note.title },
        position: { x: index * 120, y: index * 80 },
      }));

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

  useEffect(() => {
    initializeCytoscape();
    fetch("http://localhost:5000/api/notes/graph", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        updateGraph(data);
      })
      .catch((error) => console.error("Error fetching graph:", error));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setDragPos((prev) => ({
        x: prev.x + (e.clientX - clickOffset.x),
        y: prev.y + (e.clientY - clickOffset.y),
      }));
      setClickOffset({ x: e.clientX, y: e.clientY })
    };
  
    const handleMouseUp = () => {
      setDragging(false);
    };
  
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, clickOffset.x, clickOffset.y]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    const handleNodeClick = (event: any) => {
      setSelectedEdge(null);
      const nodeId = event.target.id().substring(1);
    
      fetch(`http://localhost:5000/api/notes/${nodeId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Loaded note data:", data);
          setSelectedNote(data);
          setEditTitle(data.title || "");
          setEditContent(data.content || "");
          setDragPos({ x: 0, y: 0 });
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

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    const response = await fetch(
      `http://localhost:5000/api/notes/${selectedNote.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: editTitle, content: editContent, tags: selectedNote?.tags ?? [] }),
      }
    );

    if (response.ok) {
      alert("Note updated successfully!");
      setSelectedNote({
        ...selectedNote,
        title: editTitle,
        content: editContent,
      });
      if (cyRef.current) {
        const node = cyRef.current.getElementById(`n${selectedNote.id}`);
        node.data("label", editTitle);
      }
    } else {
      alert("Error updating note.");
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    const response = await fetch(
      `http://localhost:5000/api/notes/${selectedNote.id}`,
      { method: "DELETE", credentials: "include" }
    );

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

  const handleExportPDF = async (noteId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/export/pdf/${noteId}`, {
        method: "GET",
        credentials: "include",
      });
  
      if (!response.ok) throw new Error("Failed to export PDF");
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${editTitle || "note"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Error exporting PDF");
    }
  };

  const handleExportDOCX = async (noteId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/export/docx/${noteId}`, {
        method: "GET",
        credentials: "include",
      });
  
      if (!response.ok) throw new Error("Failed to export DOCX");
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${editTitle || "note"}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting DOCX:", err);
      alert("Error exporting DOCX");
    }
  };  

  useImperativeHandle(ref, () => ({
    addNode(newNote: any) {
      if (cyRef.current) {
        cyRef.current.add({
          data: { id: `n${newNote.id}`, label: newNote.title },
          position: {
            x: Math.random() * 500,
            y: Math.random() * 500,
          },
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
    <div className="graph-container">
      <div ref={graphContainerRef} className="cy-container"></div>
  
      {selectedNote && (
        <div
          key={selectedNote.id}
          className="note-preview"
          style={{
            position: "absolute",
            top: dragPos.y,
            left: dragPos.x,
          }}
          >
            <div
              className="drag-handle"
              onMouseDown={(e) => {
                e.preventDefault();
                setDragging(true);
                setClickOffset({ x: e.clientX, y: e.clientY });
              }}
            >
              ⠿ Drag
            </div>
          <h3 className="note-title">Edit Note</h3>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="input"
          />
          <RichTextEditor content={editContent} onChange={setEditContent} />
  
          <div className="tags-container">
            <label className="tags-label">Tags</label>
            <div className="tags-list">
              {(selectedNote?.tags ?? []).map((tag: string, idx: number) => (
                <span key={`${tag}-${idx}`} className="tag">
                  #{tag}
                  <button
                    className="delete-tag-btn"
                    onClick={() => {
                      const updatedTags = selectedNote.tags!.filter((t) => t !== tag);
                      setSelectedNote({ ...selectedNote, tags: updatedTags });
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
  
            <div className="tag-input-wrapper">
              <input
                type="text"
                placeholder="Add new tag"
                className="input"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button
                className="create-button"
                onClick={() => {
                  const trimmed = newTag.trim();
                  if (!trimmed || selectedNote.tags?.includes(trimmed)) return;
                  const updatedTags = [...(selectedNote.tags ?? []), trimmed];
                  setSelectedNote({ ...selectedNote, tags: updatedTags });
                  setNewTag("");
                }}
              >
                Add Tag
              </button>
            </div>
          </div>
  
          <button onClick={handleUpdateNote} className="save-button">
            Save
          </button>
          <button onClick={handleDeleteNote} className="delete-button">
            Delete
          </button>
  
          <button
            onClick={() => handleExportPDF(selectedNote.id)}
            className="export-button pdf-export"
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExportDOCX(selectedNote.id)}
            className="export-button docx-export"
          >
            Export as DOCX
          </button>
        </div>
      )}
  
      {selectedEdge && (
        <div
          className="note-preview"
          onMouseDown={() => setDragging(true)}
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            position: "absolute",
          }}
        >
          <h3 className="note-title">Unlink Connection</h3>
          <p>
            Unlink connection between "{selectedEdge.sourceLabel}" and "
            {selectedEdge.targetLabel}"
          </p>
          <button onClick={handleUnlinkEdge} className="unlink-button">
            Unlink
          </button>
        </div>
      )}
    </div>
  );
});

export default GraphView;
