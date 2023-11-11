import { Component, createRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";

export class BqDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropdown: false,
      modelValue: "",
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

  getObjectChildren = () =>
    this.props.states.map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ));

  render() {
    return (
      <div>
        <button>
          <div>
            <div>{this.props.label}</div>
            <div>{this.state.modelValue}</div>
          </div>
          <div>{this.getArrowIcon()}</div>
        </button>
        <select ref={this.selectRef}>{this.getObjectChildren()}</select>
      </div>
    );
  }
}
