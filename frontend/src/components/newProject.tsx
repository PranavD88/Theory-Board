import { writeFileSync } from "fs";
// Define the props for the newProject component
interface NavButtonProps {
    name?: string; // The path to navigate to
    path?: string; // Optional button text (defaults to "Go to Page")
  }
function NewProject(name="",path="./ProjectList/"){
    console.log("Start New Project")
    writeFileSync(path+name+".tsx", "My name is John", {
    flag: "w"
    })
    console.log("End New Project")
}

export default NewProject;