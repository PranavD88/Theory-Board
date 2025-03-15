import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Header from "../components/Header";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NavButton from "./navigation";

function BackBttn(){
  return (<NavButton Path="../index.tsx" Text="Back" /> )
}


function ProjectList() {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  return (
    root.render(
      <Router>
        <Routes>
          <Route>

          </Route>
        </Routes>
      </Router>
    ));
}

export default ProjectList;