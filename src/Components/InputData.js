import React, { Component } from "react";
import { Consumer } from "./Database";

class InputData extends Component {
  state = {
    records: {
      dollar: "",
      mType: "",
      note: ""
    }
  };

  render() {
    return (
      <Consumer>
        {value => {
          const { onChangeHandle, onSubmitHandle } = value;
          return (
            <div>
              <div className="d-flex justify-content-center align-items-center p-2 my-2 text-dark-50 bg-light rounded shadow-sm">
                <form
                  onSubmit={onSubmitHandle}
                  key={this.props.id}
                  className="d-flex"
                >
                  <div className="form-group">
                    <select
                      value={this.props.mType}
                      className="form-control"
                      name="mType"
                      required
                      onChange={onChangeHandle}
                    >
                      <option selected>Choose</option>
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
                      value={this.props.note}
                      onChange={onChangeHandle}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      name="dollar"
                      value={this.props.dollar}
                      className="add__value"
                      placeholder="Value"
                      required
                      onChange={onChangeHandle}
                    />
                  </div>

                  <button className="add__btn">
                    <i className="ion-ios-checkmark-outline"></i>
                  </button>
                </form>
              </div>
              {console.log(this.props)}
              {/* <Budget records={this.props} /> */}
            </div>
          );
        }}
      </Consumer>
    );
  }
}
export default InputData;
