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
          // let sum = records.dollar.reduce(
          //   (accmulator, currentValue) => accmulator + currentValue
          // );

          // records
          //   .filter(income => income.mType === "inc")
          //   .map(income => (income.dollar = ));
          let totalinc = 0;
          const incsum = records
            .filter(i => i.mType === "inc")
            .map(c => (totalinc += c.dollar));
          console.log(`Total inc:  ${totalinc}`);

          let totalexp = 0;
          const expsum = records
            .filter(i => i.mType === "exp")
            .map(c => (totalexp += c.dollar));
          console.log(`Total Exp:  ${totalexp}`);

          let balance = totalinc - totalexp;

          return (
            <div>
              <header className="container d-flex justify-content-center py-4 text-center">
                <div className="col-12 col-md-6 ">
                  <p className="lead">Available Bugdet </p>
                  <h1 className="display-4">+ ${balance} </h1>
                  <div className="income-total rounded p-3 mb-2">
                    <p className="text-uppercase mb-0 text-left font-weight-bold">
                      Income: {console.log(records)}
                      <span className="float-right">${totalinc}</span>
                    </p>
                  </div>
                  <div className="exp-total rounded p-3">
                    <p className="text-uppercase mb-0 text-left font-weight-bold">
                      Expensive:{" "}
                      <span className="float-right">- ${totalexp}</span>
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
