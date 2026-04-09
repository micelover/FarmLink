import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/marketplace" element={<Index />} />
        <Route path="/auth" element={<Index />} />
      </Routes>
    </BrowserRouter>
  );
}
