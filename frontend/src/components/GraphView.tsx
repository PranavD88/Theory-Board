import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import cytoscape from "cytoscape";
import RichTextEditor from "./RichTextEditor";
import "./GraphView.css";
import { Rnd } from "react-rnd";

export interface GraphViewHandles {
  addNode: (newNote: any) => void;
  addEdge: (fromNoteId: number, toNoteId: number) => void;
  removeNode: (noteId: number) => void;
  removeEdge: (fromNoteId: number, toNoteId: number) => void;
  clearGraph: () => void;
}

type NoteType = {
  id: number;
  title: string;
  content: string;
  tags?: string[];
};

type SelectedEdge = {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
} | null;

const GraphView = forwardRef<GraphViewHandles>((props, ref) => {
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [openNotes, setOpenNotes] = useState<NoteType[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge>(null);
  const [newTag, setNewTag] = useState<string>("");
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);
  const [clickOffset, setClickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const initializeCytoscape = useCallback(() => {
    if (!graphContainerRef.current) return;
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }
  
    const cy = cytoscape({
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
  
    cyRef.current = cy;
  
    cy.on("tap", "node", async (event) => {
      setSelectedEdge(null);
      const rawId = event.target.id();
      const id = rawId.startsWith("n") ? Number(rawId.slice(1)) : Number(rawId);
  
      if (cyRef.current && openNotes.some((note) => note.id === id)) return;
  
      try {
        const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch note");
        const data = await res.json();
        setOpenNotes((prev) => [...prev, data]);
      } catch (err) {
        console.error("Error fetching note:", err);
      }
    });
  
    cy.on("tap", "edge", (event) => {
      const edgeData = event.target.data();
      const sourceNode = cy.getElementById(edgeData.source);
      const targetNode = cy.getElementById(edgeData.target);
      setSelectedEdge({
        source: edgeData.source,
        target: edgeData.target,
        sourceLabel: sourceNode.data("label"),
        targetLabel: targetNode.data("label"),
      });
    });
  }, [graphContainerRef, openNotes, setOpenNotes, setSelectedEdge]);
  
  const updateGraph = useCallback((data: any) => {
    if (!data?.nodes || !data?.links || !cyRef.current) return;
    const cy = cyRef.current;
  
    cy.batch(() => {
      const existingNodeIds = new Set(cy.nodes().map((n) => n.id()));
      const incomingNodeIds = new Set(data.nodes.map((n: any) => `n${n.id}`));
  
      data.nodes.forEach((note: any, i: number) => {
        const id = `n${note.id}`;
        if (!existingNodeIds.has(id)) {
          cy.add({
            data: { id, label: note.title },
            position: { x: i * 120, y: i * 80 },
          });
        } else {
          const node = cy.getElementById(id);
          node.data("label", note.title);
        }
      });
  
      cy.nodes().forEach((node) => {
        if (!incomingNodeIds.has(node.id())) {
          node.remove();
        }
      });
  
      cy.edges().remove();
      const edges = data.links.map((link: any) => ({
        data: {
          source: `n${link.from_note_id}`,
          target: `n${link.to_note_id}`,
        },
      }));
      cy.add(edges);
    });
  
  }, []);

  // Dragging logic for note windows
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setDragPos((prev) => ({ x: prev.x + (e.clientX - clickOffset.x), y: prev.y + (e.clientY - clickOffset.y) }));
      setClickOffset({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, clickOffset]);

useEffect(() => {
  initializeCytoscape();

  fetch("http://localhost:5000/api/notes/graph", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then(updateGraph)
    .catch((err) => console.error("Error loading graph data:", err));
}, []);

  // Update note on server
  const handleUpdateNote = async (note: NoteType) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error();
      cyRef.current?.getElementById(`n${note.id}`).data("label", note.title);
      alert("Note updated successfully!");
    } catch {
      alert("Error updating note");
    }
  };

  // Delete note from server and graph
  const handleDeleteNote = async (note: NoteType) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${note.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      cyRef.current?.getElementById(`n${note.id}`).remove();
      setOpenNotes((prev) => prev.filter((n) => n.id !== note.id));
      alert("Note deleted successfully!");
    } catch {
      alert("Error deleting note");
    }
  };

  // Unlink selected edge
  const handleUnlinkEdge = async () => {
    if (!selectedEdge) return;
    const fromId = selectedEdge.source.replace(/^n/, "");
    const toId = selectedEdge.target.replace(/^n/, "");
    try {
      const res = await fetch(
        `http://localhost:5000/api/notes/unlink?from_note_id=${fromId}&to_note_id=${toId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      cyRef.current?.edges().forEach((edge) => {
        if (edge.source().id() === selectedEdge.source && edge.target().id() === selectedEdge.target) {
          edge.remove();
        }
      });
      setSelectedEdge(null);
      alert("Link unlinked successfully!");
    } catch {
      alert("Error unlinking connection");
    }
  };

  // Export note as PDF
  const handleExportPDF = async (noteId: number) => {
    try {
      const res = await fetch(`/api/notes/export/pdf/${noteId}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note_${noteId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting PDF");
    }
  };

  // Export note as DOCX
  const handleExportDOCX = async (noteId: number) => {
    try {
      const res = await fetch(`/api/notes/export/docx/${noteId}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note_${noteId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting DOCX");
    }
  };

  useImperativeHandle(ref, () => ({
    addNode: (newNote: any) => {
      cyRef.current?.add({
        data: { id: `n${newNote.id}`, label: newNote.title },
        position: { x: Math.random() * 500, y: Math.random() * 500 },
      });
    },
    addEdge: (fromNoteId: number, toNoteId: number) => {
      cyRef.current?.add({ data: { source: `n${fromNoteId}`, target: `n${toNoteId}` } });
    },
    removeNode: (noteId: number) => {
      cyRef.current?.getElementById(`n${noteId}`).remove();
    },
    removeEdge: (fromNoteId: number, toNoteId: number) => {
      cyRef.current?.edges().forEach((edge) => {
        if (edge.source().id() === `n${fromNoteId}` && edge.target().id() === `n${toNoteId}`) {
          edge.remove();
        }
      });
    },
    clearGraph: () => {
      cyRef.current?.elements().remove();
    },
  }));

  return (
    <div className="graph-container">
      <div ref={graphContainerRef} className="cy-container" />

      {openNotes.map((note, index) => (
        <Rnd 
          key={note.id} 
          default={{
            x: 100 + index * 30,
            y: 100 + index * 30,
            width: 400,
            height: 705,
          }}
          minWidth={300} 
          minHeight={200} 
          className="note-preview" 
          dragHandleClassName="drag-handle"
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

          <div className="full-width">
            <input
              type="text"
              value={note.title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setOpenNotes((prev) =>
                  prev.map((n) =>
                    n.id === note.id ? { ...n, title: newTitle } : n
                  )
                );
              }}
              className="input"
            />
          </div>

          <div className="full-width">
            <RichTextEditor
              content={note.content}
              onChange={(val) =>
                setOpenNotes((prev) =>
                  prev.map((n) =>
                    n.id === note.id ? { ...n, content: val } : n
                  )
                )
              }
            />
          </div>

          <div className="tags-container">
            <label className="tags-label">Tags</label>
            <div className="tags-list">
              {(note.tags ?? []).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="tag">
                  #{tag}
                  <button
                    className="delete-tag-btn"
                    onClick={() => {
                      const updatedTags = note.tags!.filter((t) => t !== tag);
                      setOpenNotes((prev) =>
                        prev.map((n) =>
                          n.id === note.id ? { ...n, tags: updatedTags } : n
                        )
                      );
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="tag-input-wrapper">
              <div className="full-width">
                <input
                  type="text"
                  placeholder="Add new tag"
                  className="add-tag-input"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </div>
              <button
                className="create-button"
                onClick={() => {
                  const trimmed = newTag.trim();
                  if (!trimmed || note.tags?.includes(trimmed)) return;
                  setOpenNotes((prev) =>
                    prev.map((n) =>
                      n.id === note.id
                        ? { ...n, tags: [...(n.tags ?? []), trimmed] }
                        : n
                    )
                  );
                  setNewTag("");
                }}
              >
                Add Tag
              </button>
            </div>
          </div>

          <div className="actions-row">
            <button onClick={() => handleUpdateNote(note)} className="save-button">
              Save
            </button>
            <button onClick={() => handleDeleteNote(note)} className="delete-button">
              Delete
            </button>
            <button onClick={() => handleExportPDF(note.id)} className="export-button pdf-export">
              Export as PDF
            </button>
            <button onClick={() => handleExportDOCX(note.id)} className="export-button docx-export">
              Export as DOCX
            </button>
            <button onClick={() => setOpenNotes((prev) => prev.filter((n) => n.id !== note.id))} className="close-button">
              Close
            </button>
          </div>
        </Rnd>
      ))}

      {selectedEdge && (
        <div
          className="note-preview"
          onMouseDown={() => setDragging(true)}
          style={{ left: `${dragPos.x}px`, top: `${dragPos.y}px`, position: "absolute" }}
        >
          <h3 className="note-title">Unlink Connection</h3>
          <p>
            Unlink connection between "{selectedEdge.sourceLabel}" and "{selectedEdge.targetLabel}"
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
