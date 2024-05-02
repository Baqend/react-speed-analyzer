import React, { Component, createRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./BqDropdown.css";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";

export class BqDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropdown: false,
      modelValue: props.modelValue,
    };
    this.selectRef = createRef();
  }

  toggleDropdown = () => {
    this.setState({
      showDropdown: !this.state.showDropdown,
    });
  };

  closeDropdown = () => {
    this.setState({
      showDropdown: false,
    });
  };

  getArrowIcon = () => {
    if (!this.state.showDropdown) {
      return <FontAwesomeIcon icon={faChevronDown} />;
    } else {
      return <FontAwesomeIcon icon={faChevronUp} />;
    }
  };

  changeState = (state) => {
    this.setState({ modelValue: state, showDropdown: false });
    this.props.onChange(state);
  };

  renderStates = () =>
    this.props.states.map((state) => (
      <div
        className="bqDropdown-dropdown-entry"
        key={state}
        value={state}
        onClick={() => this.changeState(state)}
      >
        {state}
      </div>
    ));

  render() {
    return (
      <div className={`bqDropdown ${this.props.className ?? ""}`}>
        <button onClick={() => this.toggleDropdown()} type="button">
          <div>
            <div className="bqDropdown-label">{this.props.label}</div>
            <div className="bqDropdown-state">{this.state.modelValue}</div>
          </div>
          <div>{this.getArrowIcon()}</div>
        </button>
        <div
          className={`bqDropdown-dropdown ${
            this.state.showDropdown ? "expanded" : ""
          }`}
        >
          {this.state.showDropdown && this.renderStates()}
        </div>
      </div>
    );
  }
}
