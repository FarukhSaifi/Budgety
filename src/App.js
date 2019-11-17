import React from "react";
import "./App.css";
import Provider from "./Components/Database";

import InputData from "./Components/InputData";
import BudgetHeader from "./Components/BudgetHeader";
import Budget from "./Components/Budget";

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
