import React, { Component } from "react";
const Context = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_BALANCE":
      return {
        ...state,
        records: [action.payload, ...state.records]
      };
    case "DELETE_BALANCE":
      return {
        ...state,
        records: state.records.filter(records => records.id !== action.payload)
      };

    default:
      return state;
  }
};

export default class Provider extends Component {
  state = {
    records: [
      {
        id: 1,
        dollar: 900,
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
    dispatch: action => this.setState(state => reducer(state, action))
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
