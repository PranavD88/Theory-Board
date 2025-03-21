import React from "react";
import { useNavigate } from "react-router-dom";

// Define the props for the NavButton component
interface NavButtonProps {
    Path: string; // The path to navigate to
    Text?: string; // Optional button text (defaults to "Go to Page")
  }
// change to page with path
function NavButton({Path="",Text="[Go to Page]"}) {
  const navigate = useNavigate();

  const goToPage = () => {
    navigate(Path); // Navigates to the /about route
  };

  return (
    <button onClick={goToPage}>{Text}</button>
  );
}
export default NavButton;