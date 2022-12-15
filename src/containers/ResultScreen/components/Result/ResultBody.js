import React, { Component } from "react";
import "./ResultBody.css";
import ResultMetrics from "./ResultMetrics";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLongArrowAltRight } from "@fortawesome/free-solid-svg-icons";

import ResultAction from "../ResultAction/ResultAction";
import ResultWorthiness from "../ResultWorthiness/ResultWorthiness";

import ResultComparison from "./ResultComparison";
import { CUSTOMER_MAP } from "../../../../assets/customers/customerMap";

class ResultBody extends Component {
  constructor(props) {
    super(props);
  }

  createWaterfallLink = () => {
    const { competitorTest, speedKitTest } = this.props.result;
    if (
      process.env.NODE_ENV === "development" ||
      process.env.REACT_APP_TYPE === "modules"
    ) {
      return `https://${process.env.REACT_APP_BAQEND}/v1/code/openVideoComparison?ids=${competitorTest.id},${speedKitTest.id}`;
    }
    return `/v1/code/openVideoComparison?ids=${competitorTest.id},${speedKitTest.id}`;
  };

  renderDetails() {
    return (
      <div className="pt6 result-details">
        <h2 className="mb1">Performance Metrics</h2>
        <div className="purple pb2" style={{ fontWeight: "600" }}>
          <a href={this.createWaterfallLink()} target="_blank">
            <FontAwesomeIcon icon={faLongArrowAltRight} /> WebPageTest Results
          </a>
        </div>
        <ResultMetrics {...this.props} />
      </div>
    );
  }

  renderScale() {
    const { competitorTest, speedKitTest, mainMetric } = this.props.result;
    const competitor =
      competitorTest.firstView && competitorTest.firstView[mainMetric]
        ? competitorTest.firstView[mainMetric]
        : null;
    const speedKit =
      speedKitTest.firstView && speedKitTest.firstView[mainMetric]
        ? speedKitTest.firstView[mainMetric]
        : null;
    const scaleSave =
      competitor && speedKit ? ((competitor - speedKit) / competitor) * 100 : 0;

    return (
      <div className="pb3 scale">
        <div className="flex flex-column scale-wrapper">
          <div className="scale-competitor">BEFORE</div>
          <div className="flex flex-row pt1">
            <div
              className="scale-speedKit"
              style={{ width: 100 - scaleSave + "%" }}
            >
              AFTER
            </div>
            {scaleSave > 0 && (
              <div
                className="scale-safe-wrapper"
                style={{ width: scaleSave + "%" }}
              >
                <div className="scale-save">
                  {competitor - speedKit} MS FASTER
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderCustomers() {
    const customerTemplate = (customer, customerSrc) => (
      <div className="customer-wrapper" key={customer}>
        <img
          className="customer-img"
          src={customerSrc}
          alt={`${customer} Logo`}
        />
      </div>
    );
    const genArray = () => {
      const customerArray = [];
      for (const [key, val] of Object.entries(CUSTOMER_MAP)) {
        customerArray.push(customerTemplate(key, val));
      }
      return customerArray;
    };

    return (
      <div className="flex flex-column text-center pt7 pb6 container">
        <div style={{ color: "#333537", fontWeight: "500" }}>
          JOIN MORE THAN 7,000 WEBSITES THAT LOAD INSTANTLY
        </div>
        <div className="flex flex-wrap mt4 justify-center">{genArray()}</div>
      </div>
    );
  }

  render() {
    const embedded = this.props.embedded;
    const showROI = this.props.showROI;
    return (
      <div className="flex-grow-1 flex flex-column result-body">
        <div className="container result-body-inner">
          {this.renderScale()}
          {this.renderDetails()}
          <ResultAction {...this.props} toggleModal={this.toggleModal} />
          <ResultComparison {...this.props} />
          {!embedded && showROI && (
            <ResultWorthiness
              competitorTest={this.props.competitorTest}
              speedKitTest={this.props.speedKitTest}
              mainMetric={this.props.result.mainMetric}
            />
          )}
          {!embedded && this.renderCustomers()}
        </div>
      </div>
    );
  }
}

export default ResultBody;
