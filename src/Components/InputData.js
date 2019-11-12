import React, { Component } from "react";
import Budget from "./Budget";

class InputData extends Component {
  state = {
    records: [
      {
        id: 1,
        dollar: 100,
        type: "inc",
        note: "gift"
      },
      {
        id: 2,
        dollar: 345,
        type: "inc",
        note: "fun time"
      },
      {
        id: 3,
        dollar: 250,
        type: "exp",
        note: "pocket money"
      },
      {
        id: 4,
        dollar: 550,
        type: "exp",
        note: "bang money"
      }
    ]
  };

  render() {
    const { records } = this.state;
    return (
      <div>
        <div className="d-flex justify-content-center align-items-center p-2 my-2  text-dark-50 bg-light rounded shadow-sm">
          <div className="form-group">
            <select className="form-control" name="Type">
              <option value={"inc"}>+</option>
              <option value={"exp"}>-</option>
            </select>
          </div>
          <div className="form-group">
            <input
              className="add__description"
              type="text"
              name="value"
              placeholder="Description"
              value={this.note}
            />
          </div>
          <div className="form-group">
            <input type="number" className="add__value" placeholder="Value" />
          </div>

          <button className="add__btn">
            <i className="ion-ios-checkmark-outline"></i>
          </button>
        </div>
        {console.log(records)}
        <Budget records={records} />
      </div>
    );
  }
}
export default InputData;
