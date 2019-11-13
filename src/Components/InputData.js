import React, { Component } from "react";
import Budget from "./Budget";

class InputData extends Component {
  state = {
    records: [
      {
        id: 1,
        dollar: "100",
        mType: "inc",
        note: "black money"
      },
      {
        id: 2,
        dollar: 345,
        mType: "inc",
        note: "fun time"
      },
      {
        id: 3,
        dollar: 250,
        mType: "exp",
        note: "pocket money"
      },
      {
        id: 4,
        dollar: 550,
        mType: "exp",
        note: "bang money"
      }
    ],

    dollar: "",
    mType: "",
    note: ""
  };

  onChange = e => this.setState({ [e.target.name]: e.target.value });

  onSubmit = e => {
    e.preventDefault();
    const records = {
      dollar: this.state.dollar,
      mType: this.state.mType,
      note: this.state.note
    };
    // console.log(test);

    this.setState({
      records: [...this.state.records, records]
    });
    // console.log(records);
    console.log(this.state);
  };

  render() {
    // const { id, dollar, mType, note } = this.state;
    const { records } = this.state;
    return (
      <div>
        <div className="d-flex justify-content-center align-items-center p-2 my-2 text-dark-50 bg-light rounded shadow-sm">
          <form onSubmit={this.onSubmit} key={records.id} className="d-flex">
            <div className="form-group">
              <select
                value={records.mType}
                className="form-control"
                name="mType"
                onChange={this.onChange}
              >
                <option value="N/A">N/A</option>
                <option value={"inc"}>+</option>
                <option value={"exp"}>-</option>
              </select>
            </div>
            <div className="form-group">
              <input
                className="add__description"
                type="text"
                name="note"
                placeholder="Description"
                value={records.note}
                onChange={this.onChange}
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="dollar"
                value={this.state.records.dollar}
                className="add__value"
                placeholder="Value"
                onChange={this.onChange}
              />
            </div>

            <button className="add__btn">
              <i className="ion-ios-checkmark-outline"></i>
            </button>
          </form>
        </div>
        {/* {console.log(records)} */}
        <Budget records={records} />
      </div>
    );
  }
}
export default InputData;
