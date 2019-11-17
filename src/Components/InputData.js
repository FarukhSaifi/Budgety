import React, { Component } from "react";

class InputData extends Component {
  state = {
    mType: "",
    note: "",
    dollar: ""
  };

  onChange = e => this.setState({ [e.target.name]: e.target.value });

  onSubmit = e => {
    e.preventDefault();
    const obj = {
      dollar: this.state.dollar,
      mType: this.state.mType,
      note: this.state.note
    };
    console.log();
    this.setState({
      records: [...this.state.records, obj]
    });
  };
  render() {
    return (
      <div className="d-flex justify-content-center align-items-center p-2 my-2 text-dark-50 bg-light rounded shadow-sm">
        <form
          // onSubmit={onSubmitHandle}
          key={this.props.id}
          className="d-flex"
        >
          <div className="form-group">
            <select
              value={this.props.mType}
              className="form-control"
              name="mType"
              required
              onChange={this.onChange}
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
              onChange={this.onChange}
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
              onChange={this.onChange}
            />
          </div>
          <button className="add__btn">
            <i className="ion-ios-checkmark-outline"></i>
          </button>
        </form>
      </div>
    );
  }
}
export default InputData;
