import { render } from "preact";
import { Popup } from "./components";
import "./popup.css";

const appEl = document.getElementById("app");
if (appEl) render(<Popup />, appEl);
