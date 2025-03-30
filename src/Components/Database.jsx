import React, { Component } from "react";
const Context = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_BALANCE":
      return {
        ...state,
        records: [action.payload, ...state.records],
      };
    case "DELETE_BALANCE":
      return {
        ...state,
        records: state.records.filter(
          (records) => records.id !== action.payload
        ),
      };

    default:
      return state;
  }
};

export default class Provider extends Component {
  state = {
    records: [
      {
        id: "",
        dollar: "",
        mType: "",
        note: "",
      },
    ],
    dispatch: (action) => this.setState((state) => reducer(state, action)),
  };

  render() {
    return (
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    );
  }
}

export const Consumer = Context.Consumer;
