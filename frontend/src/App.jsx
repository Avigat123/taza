import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import InspectProduce from "./pages/InspectProduce";
import Batches from "./pages/Batches";
import BatchDetails from "./pages/BatchDetails";
import Recommendations from "./pages/Recommendations";
import Traceability from "./pages/Traceability";
import Agent from "./pages/Agent";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inspect" element={<InspectProduce />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/batches/:id" element={<BatchDetails />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="/agent" element={<Agent />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
