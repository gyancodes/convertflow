import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { ConverterPage } from "./pages/ConverterPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/converter" element={<ConverterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
