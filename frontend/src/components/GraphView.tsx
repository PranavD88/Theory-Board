import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import cytoscape from "cytoscape";
import "./GraphView.css";
import NoteWindow from "./NoteWindow";

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

type WindowedNote = NoteType & {
  z: number;
  x?: number;
  y?: number;
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

  const [openNotes, setOpenNotes] = useState<WindowedNote[]>([]);
  const [zCounter, setZCounter] = useState(1000);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [clickOffset, setClickOffset] = useState({ x: 0, y: 0 });

  const handleAddTag = useCallback((id: number, tag: string) => {
    setOpenNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, tags: [...(n.tags || []), tag] } : n
      )
    );
  }, []);

  const handleRemoveTag = useCallback((id: number, tag: string) => {
    setOpenNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, tags: n.tags?.filter((t) => t !== tag) }
          : n
      )
    );
  }, []);

  const handleCloseNote = useCallback((id: number) => {
    setOpenNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleUpdateField = useCallback(
    (id: number, field: "title" | "content", value: string) => {
      setOpenNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, [field]: value } : n
        )
      );
    },
    []
  );

  const handleUpdateNote = useCallback(async (note: WindowedNote) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          tags: note.tags ?? [],
          x: note.x ?? 100,
          y: note.y ?? 100,
        }),
      });
      if (!res.ok) throw new Error();
      cyRef.current?.getElementById(`n${note.id}`).data("label", note.title);
      alert("Note updated successfully!");
    } catch {
      alert("Error updating note");
    }
  }, []);  

  const handleDeleteNote = useCallback(async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      cyRef.current?.getElementById(`n${id}`).remove();
      setOpenNotes((prev) => prev.filter((n) => n.id !== id));
      alert("Note deleted!");
    } catch {
      alert("Error deleting note");
    }
  }, []);

  const handleExportPDF = useCallback(async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/export/pdf/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting PDF");
    }
  }, []);

  const handleExportDOCX = useCallback(async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/export/docx/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note_${id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error exporting DOCX");
    }
  }, []);

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
    
    cy.on("dragfree", "node", async (evt) => {
      const node = evt.target;
      const id = node.id().startsWith("n") ? node.id().slice(1) : node.id();
      const pos = node.position();
    
      try {
        await fetch(`http://localhost:5000/api/notes/position/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ x: pos.x, y: pos.y }),
        });
      } catch (err) {
        console.error("Error saving node position:", err);
      }
    });

    cy.on("tap", "node", async (evt) => {
      setSelectedEdge(null);
    
      const rawId = evt.target.id();
      const id = Number(rawId.replace(/^n/, ""));
    
      try {
        const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch note");
        const noteData: NoteType = await res.json();
    
        setZCounter((zc) => {
          const newZ = zc + 1;
          setOpenNotes((prev) => {
            const idx = prev.findIndex((n) => n.id === noteData.id);
    
            if (idx !== -1) {
              const windows = [...prev];
              const [existing] = windows.splice(idx, 1);
              return [...windows, { ...existing, z: newZ }];
            } else {
              return [...prev, { ...noteData, z: newZ }];
            }
          });
          return newZ;
        });
      } catch (err) {
        console.error("Node-tap error:", err);
      }
    });

    cy.on("tap", "edge", (evt) => {
      const d = evt.target.data();
      const src = cy.getElementById(d.source).data("label");
      const tgt = cy.getElementById(d.target).data("label");
      setSelectedEdge({
        source: d.source,
        target: d.target,
        sourceLabel: src,
        targetLabel: tgt,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNotes, zCounter]);

  const updateGraph = useCallback((data: any) => {
    if (!data?.nodes || !data?.links || !cyRef.current) return;
    const cy = cyRef.current;
  
    cy.batch(() => {
      const existing = new Set(cy.nodes().map((n) => n.id()));
      const incoming = new Set(data.nodes.map((n: any) => `n${n.id}`));
  
      data.nodes.forEach((note: any, i: number) => {
        const id = `n${note.id}`;
        if (!existing.has(id)) {
          cy.add({
            data: { id, label: note.title },
            position: {
              x: typeof note.x === "number" ? note.x : i * 120,
              y: typeof note.y === "number" ? note.y : i * 80,
            },
          });
        } else {
          cy.getElementById(id).data("label", note.title);
        }
      });
  
      cy.nodes().forEach((node) => {
        if (!incoming.has(node.id())) node.remove();
      });
  
      cy.edges().remove();
      cy.add(
        data.links.map((link: any) => ({
          data: {
            source: `n${link.from_note_id}`,
            target: `n${link.to_note_id}`,
          },
        }))
      );
    });
  
    cyRef.current.fit(undefined, 50);
  }, []);

  useEffect(() => {
    const loadGraph = async () => {
      await initializeCytoscape();
  
      try {
        const res = await fetch("http://localhost:5000/api/notes/graph", {
          credentials: "include",
        });
        const data = await res.json();
        updateGraph(data);
      } catch (err) {
        console.error("Error loading graph:", err);
      }
    };
  
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      setDragPos((p) => ({
        x: p.x + (e.clientX - clickOffset.x),
        y: p.y + (e.clientY - clickOffset.y),
      }));
      setClickOffset({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, clickOffset]);

  const handleUnlinkEdge = useCallback(async () => {
    if (!selectedEdge) return;
    const from = selectedEdge.source.slice(1);
    const to = selectedEdge.target.slice(1);
    try {
      const res = await fetch(
        `http://localhost:5000/api/notes/unlink?from_note_id=${from}&to_note_id=${to}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      cyRef.current
        ?.edges()
        .filter(
          (e) =>
            e.source().id() === selectedEdge.source &&
            e.target().id() === selectedEdge.target
        )
        .remove();
      setSelectedEdge(null);
      alert("Link unlinked!");
    } catch {
      alert("Error unlinking");
    }
  }, [selectedEdge]);

  useImperativeHandle(ref, () => ({
    addNode: (newNote: any) => {
      cyRef.current?.add({
        data: { id: `n${newNote.id}`, label: newNote.title },
        position: { x: Math.random() * 500, y: Math.random() * 500 },
      });
    },
    addEdge: (fromId: number, toId: number) => {
      cyRef.current?.add({ data: { source: `n${fromId}`, target: `n${toId}` } });
    },
    removeNode: (noteId: number) => {
      cyRef.current?.getElementById(`n${noteId}`).remove();
    },
    removeEdge: (fromId: number, toId: number) => {
      cyRef.current
        ?.edges()
        .filter(
          (e) =>
            e.source().id() === `n${fromId}` &&
            e.target().id() === `n${toId}`
        )
        .remove();
    },
    clearGraph: () => {
      cyRef.current?.elements().remove();
    },
  }));

  return (
    <div className="graph-container">
      <div ref={graphContainerRef} className="cy-container" />

      {openNotes.map((note) => (
        <NoteWindow
          key={note.id}
          note={note}
          onUpdate={handleUpdateField}
          onDelete={handleDeleteNote}
          onClose={handleCloseNote}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onExportPDF={handleExportPDF}
          onExportDOCX={handleExportDOCX}
          onSave={handleUpdateNote}
        />
      ))}

      {selectedEdge && (
        <div
          className="note-preview"
          onMouseDown={() => setDragging(true)}
          style={{
            position: "absolute",
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
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
