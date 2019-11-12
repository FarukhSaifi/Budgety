import React from "react";
import "./App.css";
import InputData from "./Components/InputData";

function App() {
  return (
    <div className="App">
      <header className="container d-flex justify-content-center py-4 text-center">
        <div className="col-12 col-md-6 ">
          <p className="lead">Available Bugdet </p>
          <h1 className="display-4">+ 16699 </h1>
          <div className="income-total rounded p-3 mb-2">
            <p className="text-uppercase mb-0 text-left">
              Income: <span className="float-right">1234 </span>
            </p>
          </div>
          <div className="exp-total rounded p-3">
            <p className="text-uppercase mb-0 text-left">
              Expensive: <span className="float-right">1234 </span>
            </p>
          </div>
        </div>
      </header>
      <InputData />
    </div>
  );
}

export default App;
