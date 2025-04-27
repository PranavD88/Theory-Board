import React from "react";
import "../css/header.css";

function Header(){
    return(
        <div className="Page-header"
        style={{
            position: "fixed",  // Fixes the div at the top
            width: "100%",      // Optional: makes it span the full width of the page
            zIndex: 1000,       // Ensures it's on top of other elements
          }}>
            <div>
                <h1>Theory Board</h1>
            </div>
            {/* Header Bottom line */}
            <div className="bottom"></div>
        </div>      
    );
}
export default Header;
