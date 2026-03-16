import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoomJoin from "./components/RoomJoin";
import EditorPage from "./pages/EditorPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoomJoin />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
