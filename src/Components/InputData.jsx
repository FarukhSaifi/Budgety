import React, { Component } from "react";
import { v4 as uuid } from "uuid";
import { Consumer } from "./Database";

class InputData extends Component {
  state = {
    mType: "",
    note: "",
    dollar: "",
  };

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  onSubmit = (dispatch, e) => {
    e.preventDefault();
    const { mType, note, dollar } = this.state;
    const newRecords = {
      id: uuid(),
      mType: mType,
      note: note,
      dollar: Number(dollar),
    };
    dispatch({ type: "ADD_BALANCE", payload: newRecords });
    console.log(newRecords);
    this.setState({
      id: "",
      mType: "",
      note: "",
      dollar: "",
    });
  };

  render() {
    const { mType, note, dollar } = this.state;

    return (
      <Consumer>
        {(value) => {
          const { dispatch } = value;

          return (
            <div className="d-flex justify-content-center align-items-center p-2 my-2 text-dark-50 bg-light rounded shadow-sm">
              <form
                className="d-flex"
                onSubmit={this.onSubmit.bind(this, dispatch)}
                key={this.id}
              >
                <div className="form-group col-3">
                  <select
                    value={mType}
                    className="form-control"
                    name="mType"
                    required
                    onChange={this.onChange}
                  >
                    <option value="">Choose</option>
                    <option value={"inc"}>+</option>
                    <option value={"exp"}>-</option>
                  </select>
                </div>
                <div className="form-group col-4">
                  <input
                    className="add__description"
                    type="text"
                    name="note"
                    placeholder="Description"
                    value={note}
                    onChange={this.onChange}
                    required
                  />
                </div>
                <div className="form-group col-4">
                  <input
                    type="number"
                    name="dollar"
                    value={dollar}
                    className="add__value"
                    placeholder="Value"
                    required
                    onChange={this.onChange}
                  />
                </div>
                <button className="add__btn">
                  <i className="ion-ios-checkmark-outline"></i>
                </button>
              </form>
            </div>
          );
        }}
      </Consumer>
    );
  }
}
export default InputData;
