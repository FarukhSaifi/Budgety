import React, { Component } from "react";
import { Consumer } from "./Database";

class Budget extends Component {
  render() {
    // const records = this.props.records;
    return (
      <Consumer>
        {accessState => {
          const { records } = accessState;
          return (
            <div className="container">
              {/* {console.log(records)} */}
              <div className="row">
                <div className="col-6">
                  <h4 className="text-uppercase mb-0 text-info">Income</h4>
                  <table className="table table-striped">
                    <tbody>
                      {records.map((one, index) =>
                        one.mType === "inc" ? (
                          <tr key={index}>
                            <td>{one.note}</td>
                            <td>{one.dollar}</td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="col-6">
                  <h4 className="text-uppercase mb-0 text-danger">Expensive</h4>
                  <table className="table table-striped">
                    <tbody>
                      {records.map((exp, index) =>
                        exp.mType === "exp" ? (
                          <tr key={index}>
                            <td>{exp.note}</td>
                            <td>{exp.dollar}</td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }}
      </Consumer>
    );
  }
}
export default Budget;
