declare module "react-cytoscapejs" {
    import cytoscape from "cytoscape";
    import { CSSProperties } from "react";

    interface CytoscapeComponentProps {
        elements: cytoscape.ElementDefinition[];
        style?: CSSProperties;
        layout?: cytoscape.LayoutOptions;
        stylesheet?: cytoscape.Stylesheet[];
        zoomingEnabled?: boolean;
        userZoomingEnabled?: boolean;
        boxSelectionEnabled?: boolean;
    }

    const CytoscapeComponent: React.FC<CytoscapeComponentProps>;
    export default CytoscapeComponent;
}
