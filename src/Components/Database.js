import React, { Component } from "react";
const Context = React.createContext();

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
    ]
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
