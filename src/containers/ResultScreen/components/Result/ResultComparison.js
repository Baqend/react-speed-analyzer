import React, { Component } from "react";
import "./ResultComparison.css";
import ReactTooltip from "react-tooltip";
import { db } from "baqend";

const MAX_COMPETITORS = 5;

class ResultComparison extends Component {
  constructor(props) {
    super(props);
    this.state = {
      beforeSpeedKit: "",
      companyArray: [],
      inputValue: "",
      showSpinner: false,
    };
  }

  componentDidMount() {
    this.beforeSpeedKit();
  }

  addCompetitor(object) {
    this.setState({ companyArray: [...this.state.companyArray, object] });
  }

  updateInputValue(event) {
    this.setState({ inputValue: event.target.value });
  }

  handleLazyUserInput(domain, secondRun) {
    domain = domain.replace(/(https?:\/\/)?(www.)?/, "");
    return secondRun ? `https://${domain}` : `https://www.${domain}`;
  }

  prettyURL(domain) {
    domain = domain.replace(/(https?:\/\/)?(www.)?(\/)?/g, "");
    return domain;
  }

  async beforeSpeedKit(secondRun = false) {
    this.props.config.url = this.handleLazyUserInput(
      this.props.config.url,
      secondRun
    );
    try {
      const url = new URL(this.props.config.url);
      const data = await db.modules.get("chromeUXReports", `url=${url}`);
      this.setState((state) =>
        Object.assign(state, {
          beforeSpeedKit: JSON.stringify({
            hostname: this.prettyURL(url.hostname),
            fastString: data.fastString,
            mediumString: data.mediumString,
            slowString: data.slowString,
            fast: data.fast,
            medium: data.medium,
            slow: data.slow,
          }),
        })
      );
    } catch (error) {
      if (secondRun) {
        this.setState({ error: true });
        console.log(error);
      } else {
        this.beforeSpeedKit(true);
      }
    }
  }

  createBeforeSpeedKit() {
    if (this.state.beforeSpeedKit.length !== 0) {
      var data = JSON.parse(this.state.beforeSpeedKit);
      data.hostname = this.prettyURL(data.hostname);
      return (
        <div className="barRowContainerWrapper">
          <div className="barRowContainer">
            <div className="text-box-width">
              <span className="companyName">{data.hostname}</span>
            </div>
            <div className="threeBars">
              {this.createBar(data.fast, data.fastString, "", "green")}
              {this.createBar(data.medium, data.mediumString, "", "orange")}
              {this.createBar(data.slow, data.slowString, "", "red")}
            </div>
          </div>
        </div>
      );
    }
  }

  createBar(percentage, percentageString, index, color) {
    const isMobile = window.innerWidth < 500;
    if (parseFloat(percentage.replace("%", "")) < (isMobile ? 20 : 10)) {
      return (
        <div
          data-tip
          data-for={`${color}${index}`}
          className={`${color}Bar`}
          style={{ width: percentage }}
        >
          <ReactTooltip
            id={`${color}${index}`}
            type="dark"
            place="top"
            effect="solid"
          >
            <div>{percentageString}</div>
          </ReactTooltip>
        </div>
      );
    } else {
      return (
        <div className={`${color}Bar`} style={{ width: percentage }}>
          <span className="barText">{percentageString}</span>
        </div>
      );
    }
  }

  async getCruxReportData(secondRun = false) {
    const input = this.handleLazyUserInput(this.state.inputValue, secondRun);
    try {
      this.setState({ showSpinner: true });

      const data = await db.modules.get("chromeUXReports", `url=${input}`);
      var found = false;
      this.state.companyArray.forEach((element) => {
        if (element.hostname === this.prettyURL(data.hostname)) {
          found = true;
        }
      });
      console.log(this.state.beforeSpeedKit);
      if (!found && this.state.companyArray.length + 1 < MAX_COMPETITORS) {
        this.addCompetitor({
          hostname: this.prettyURL(data.hostname),
          fastString: data.fastString,
          mediumString: data.mediumString,
          slowString: data.slowString,
          fast: data.fast,
          medium: data.medium,
          slow: data.slow,
        });
      } else {
        const errorMessage =
          this.state.companyArray.length + 1 === MAX_COMPETITORS
            ? "Only " + MAX_COMPETITORS + " allowed."
            : "Already in list.";
        this.props.actions.addError(errorMessage);
      }
      this.setState({ showSpinner: false });
    } catch (error) {
      // CRUX Data does not exist or too many api requests
      if (secondRun) {
        this.setState({ showSpinner: false });
        this.props.actions.addError("CRUX Data could not be found");
      } else {
        await this.getCruxReportData(true);
      }
    }
  }

  spinner() {
    if (this.state.showSpinner) {
      return <div className="loader"></div>;
    } else {
      return <span>Add Competitor</span>;
    }
  }

  render() {
    if (this.state.error) return null;
    return (
      <div>
        <div className="text-center pb3 pt6">
          <h2 className="margin-bottom">How fast is your competition?</h2>
          <span data-tip>
            Compare your performance based on the Chrome User Experience Report
            from Google
          </span>
        </div>
        <div className="flex flex-column justify-center box-wrapper">
          <div className="flex flex-row justify-center pb4">
            <div className="flex flex-row items-center mr4">
              <div className="greenBox mr1"></div>
              <span className="boxFont">Fast</span>
            </div>
            <div className="flex flex-row items-center mr4">
              <div className="orangeBox mr1"></div>
              <span className="boxFont">Average</span>
            </div>
            <div className="flex flex-row items-center">
              <div className="redBox mr1"></div>
              <span className="boxFont">Slow</span>
            </div>
          </div>
          <div className="flex flex-column">
            {this.createBeforeSpeedKit()}
            <ul className="ul-new">
              {this.state.companyArray.map((element, index) => (
                <li key={index} className="barRowContainerWrapper">
                  <div className="barRowContainer">
                    <div className="text-box-width">
                      <span className="companyName">{element.hostname}</span>
                    </div>
                    <div className="threeBars">
                      {this.createBar(
                        element.fast,
                        element.fastString,
                        index,
                        "green"
                      )}
                      {this.createBar(
                        element.medium,
                        element.mediumString,
                        index,
                        "orange"
                      )}
                      {this.createBar(
                        element.slow,
                        element.slowString,
                        index,
                        "red"
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="comparison-bottom-row pt3">
              <div className="comparison-row-inner">
                <div className="text-input-wrapper mr2">
                  <input
                    value={this.state.inputValue}
                    onChange={(event) => this.updateInputValue(event)}
                    className="text-input"
                    type="text"
                    placeholder="https://www.example.com"
                  />
                </div>
                <button
                  className="comparison-button"
                  onClick={() => this.getCruxReportData()}
                >
                  <span className="comparison-button-text">
                    {this.spinner()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ResultComparison;
