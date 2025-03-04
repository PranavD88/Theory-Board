import React, { useState } from "react";
import "./App.css";
import "./Body.css"
import Header from "./Header";
import TextEditor from "./TextEditor";


// Text Editor Button detect
    let openTxtEdr:boolean = false;

    const TxtBttn = document.getElementById("open-txt-edr");

    TxtBttn?.addEventListener("click", () => {
        // Set the boolean to true when the button is pressed
        openTxtEdr = true;
        console.log("Button pressed! isButtonPressed:", openTxtEdr);
    });

//Page Body
function Body() {
    // State to manage whether the text editor is open
    const [isOpen, setIsOpen] = useState<boolean>(false);
  
    // Function to handle button click
    const handleButtonClick = () => {
      setIsOpen(true); // Set isOpen to true when the button is clicked
      console.log("Button pressed! isOpen:", true);
    };
  
    return (
      <div className="App-Body">
        <p>(Project Menu Goes Here)</p>
        <p>.</p>
        <br />
        <p>Text Editor Goes Here</p>
        {/* Button to open the text editor */}
        <button onClick={handleButtonClick}>Open Editor</button>
        {/* Pass the isOpen state to the TextEditor component */}
        <TextEditor isOpen={isOpen} />
        <br />
        <p>.</p>
        <p>.</p>
        <p>.</p>
      </div>
    );
  }
  
  export default Body;