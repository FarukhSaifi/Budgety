import React, { Component } from "react";

class BudgetHeader extends Component {
  render() {
    // const { records } = this.props;

    // const sum = this.props.reduce(
    //   (accmulator, currentValue) => accmulator + currentValue
    // );

    return (
      <div>
        <header className="container d-flex justify-content-center py-4 text-center">
          <div className="col-12 col-md-6 ">
            <p className="lead">Available Bugdet </p>
            <h1 className="display-4">+ 16699 </h1>
            <div className="income-total rounded p-3 mb-2">
              <p className="text-uppercase mb-0 text-left">
                Income:
                <span className="float-right">1000</span>
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
  }
}

export default BudgetHeader;
