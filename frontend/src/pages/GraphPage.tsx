import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GraphView, { GraphViewHandles } from "../components/GraphView";
import MenuButton from "../components/MenuButton";

const GraphPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const graphRef = useRef<GraphViewHandles>(null);

  const handleSearchNodes = (query: { title?: string; tag?: string; content?: string }) => {
    graphRef.current?.searchNodes(query);
  };

  const handleGetCyInstance = () => {
    return graphRef.current?.getCyInstance();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 9999,
          backgroundColor: "#1f1e27",
          color: "#ff005d",
          border: "solid 2px",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        ← Back to Projects
      </button>

      <MenuButton
        setIsAuthenticated={() => {}}
        addNode={(newNote) => graphRef.current?.addNode(newNote)}
        addEdge={(from, to) => graphRef.current?.addEdge(from, to)}
        clearGraph={() => graphRef.current?.clearGraph()}
        projectId={projectId}
        searchNodes={handleSearchNodes}
        getCyInstance={handleGetCyInstance}
      />

      <div className="Graph-area">
        <GraphView ref={graphRef} projectId={projectId} />
      </div>
    </div>
  );
};

export default GraphPage;
