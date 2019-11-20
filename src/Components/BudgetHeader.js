import React, { Component } from "react";
import { Consumer } from "./Database";

class BudgetHeader extends Component {
  render() {
    // const { records } = this.props.records;

    // const sum = this.props.reduce(
    //   (accmulator, currentValue) => accmulator + currentValue
    // );

    return (
      <Consumer>
        {value => {
          const { records } = value;
          const sum = records
            .filter(income => income.mType === "inc")
            .map(income => (income.dollar = income.dollar + income.dollar));
          console.log(sum);
          return (
            <div>
              <header className="container d-flex justify-content-center py-4 text-center">
                <div className="col-12 col-md-6 ">
                  <p className="lead">Available Bugdet </p>
                  <h1 className="display-4">+ 16699 $ </h1>
                  <div className="income-total rounded p-3 mb-2">
                    <p className="text-uppercase mb-0 text-left">
                      Income: {console.log(records)}
                      <span className="float-right">${sum}</span>
                    </p>
                  </div>
                  <div className="exp-total rounded p-3">
                    <p className="text-uppercase mb-0 text-left">
                      Expensive: <span className="float-right">1234 </span>
                    </p>
                  </div>
                </div>
              </header>
            </div>
          );
        }}
      </Consumer>
    );
  }
}

export default BudgetHeader;
