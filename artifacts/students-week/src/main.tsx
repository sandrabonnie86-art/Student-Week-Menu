import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setBaseUrl("http://localhost:3001");
setAuthTokenGetter(() => {
  // Check for tokens in localStorage (admin first, then usher, then vendor)
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken) return adminToken;
  
  const usherToken = localStorage.getItem("usherToken");
  if (usherToken) return usherToken;
  
  const vendorToken = localStorage.getItem("vendorToken");
  if (vendorToken) return vendorToken;
  
  return null;
});

createRoot(document.getElementById("root")!).render(<App />);
