import React, { Component } from "react";

class Budget extends Component {
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-6">
            <h4 className="text-uppercase mb-0 text-info">Income</h4>
            {console.log(this.props.records.map(one => one.id))}
            <table className="table table-striped">
              <tbody>
                {this.props.records.map(one =>
                  one.type === "inc" ? (
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
                {this.props.records.map(exp =>
                  exp.type === "exp" ? (
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
