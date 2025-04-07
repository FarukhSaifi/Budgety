import React from "react";
import "./App.css";
import Provider from "./Components/Database";

import Budget from "./Components/Budget";
import BudgetHeader from "./Components/BudgetHeader";
import InputData from "./Components/InputData";

function App() {
  return (
    <Provider>
      <div className="App">
        <BudgetHeader />
        <InputData />
        <Budget />
      </div>
    </Provider>
  );
}

export default App;
