import { startApp } from "./app";
import "./styles.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("No está el contenedor #app.");
}
startApp(root);
