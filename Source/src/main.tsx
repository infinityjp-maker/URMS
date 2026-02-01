import ReactDOM from "react-dom/client";
import App from "./App";

if (import.meta.env.DEV) {
  import("./utils/tauri-test");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
