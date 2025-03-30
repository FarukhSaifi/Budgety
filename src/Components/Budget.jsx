import React, { Component } from "react";
import { Consumer } from "./Database";

class Budget extends Component {
  deleteItem = (id, dispatch) => {
    dispatch({ type: "DELETE_BALANCE", payload: id });
  };
  render() {
    return (
      <Consumer>
        {value => {
          const { records, dispatch } = value;
          return (
            <div className="container">
              {/* {console.log(records)} */}
              <div className="row">
                <div className="col-6">
                  <h4 className="text-uppercase mb-0 text-info">Income</h4>
                  <table className="table table-striped">
                    <tbody>
                      {records.map(one =>
                        one.mType === "inc" ? (
                          <tr key={one.id}>
                            <td>{one.note}</td>
                            <td>$ {one.dollar}</td>
                            <td
                              onClick={this.deleteItem.bind(
                                this,
                                one.id,
                                dispatch
                              )}
                            >
                              <i className="del__btn ion-close-round"></i>
                            </td>
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
                      {records.map(exp =>
                        exp.mType === "exp" ? (
                          <tr key={exp.id}>
                            <td>{exp.note}</td>
                            <td>$ {exp.dollar}</td>
                            <td
                              onClick={this.deleteItem.bind(
                                this,
                                exp.id,
                                dispatch
                              )}
                            >
                              <i className="del__btn ion-close-round"></i>
                            </td>
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
