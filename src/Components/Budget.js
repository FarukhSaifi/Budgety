import React, { Component } from "react";

class Budget extends Component {
  render() {
    const { records } = this.props;
    return (
      <div className="container">
        <div className="row">
          <div className="col-6">
            <h4 className="text-uppercase mb-0 text-info">Income</h4>
            {/* {console.log(this.state.records.map(one => one.id))} */}
            <table className="table table-striped">
              <tbody>
                {records.map(one =>
                  one.mType === "inc" ? (
                    <tr key={one.id}>
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
                {records.map(exp =>
                  exp.mType === "exp" ? (
                    <tr key={exp.id}>
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
  }
}
export default Budget;
