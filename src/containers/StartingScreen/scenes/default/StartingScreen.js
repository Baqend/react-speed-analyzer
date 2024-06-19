import React, { Component } from "react";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

import "./StartingScreen.css";
import StartingScreenComponent from "./StartingScreenComponent";

import { getObjectKey } from "helper/utils";

import {
  handleUrlInput,
  resetConfig,
  handleLocationChange,
  handleMobileSwitch,
} from "actions/config";
import { resetResult, resetTestStatus } from "actions/result";
import { prepareTest, startTest } from "actions/test";
import { hasSpeedKitExtension } from '../../../../helper/utils';

class StartingScreen extends Component {
  constructor(props) {
    super(props);
    let showAdvancedConfig = false;

    if (!this.props.result.isInitiated) {
      this.reset();
    }

    const params = this.parseQueryString(this.props.location.search);
    if (params.advanced) {
      showAdvancedConfig = true;
    }

    this.state = {
      showAdvancedConfig,
    };
    this.handleURLProps(params);
  }

  reset = () => {
    this.props.actions.resetConfig();
    this.props.actions.resetResult();
  };

  parseQueryString = (queryString) => {
    const params = {};
    queryString
      .replace("?", "")
      .split("&")
      .forEach((p) => {
        const param = p.split("=");
        params[param[0]] = param[1] ? param[1] : true;
      });
    return params;
  };

  startTest = async (url = null, isFireHorse = false) => {
    const { history } = this.props;
    const useAdvancedConfig = this.state.showAdvancedConfig;
    try {
      await this.props.actions.prepareTest(url);
      const withSpeedKitExtension = await hasSpeedKitExtension()
      const testOverview = await this.props.actions.startTest(
        useAdvancedConfig,
        withSpeedKitExtension,
        isFireHorse,
      );
      history.push(
        `/test/${getObjectKey(testOverview.id)}${history.location.search}`
      );
    } catch (e) {
      this.props.actions.resetTestStatus();
    }
  };

  onSubmit = () => {
    this.startTest(this.props.config.url);
  };

  onToggleAdvancedConfig = (showAdvancedConfig) => {
    this.setState({ showAdvancedConfig });
  };

  render() {
    return (
      <StartingScreenComponent
        {...this.props}
        {...this.state}
        onToggleAdvancedConfig={this.onToggleAdvancedConfig}
        onSubmit={this.onSubmit}
      />
    );
  }

  handleURLProps(params) {
    if (params.mobile !== undefined) {
      const mobile = params.mobile === "true" ? true : false;
      this.props.actions.handleMobileSwitch(!mobile);
    }

    if (params.region !== undefined) {
      this.props.actions.handleLocationChange(params.region);
    }
    if (params.url) {
      const { history } = this.props;
      const url = decodeURIComponent(params.url);
      history.push("/");
      this.props.actions.handleUrlInput(url);
      this.startTest(url, true);
    }
  }
}

StartingScreen.propTypes = {
  testOverview: PropTypes.object,
  actions: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  isRateLimited: PropTypes.bool.isRequired,
  isBaqendApp: PropTypes.bool.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  return {
    testOverview: state.result.testOverview,
    config: state.config,
    isRateLimited: state.result.isRateLimited,
    isBaqendApp: state.result.isBaqendApp,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
    result: state.result,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(
      {
        handleUrlInput,
        resetResult,
        resetTestStatus,
        resetConfig,
        prepareTest,
        startTest,
        handleLocationChange,
        handleMobileSwitch,
      },
      dispatch
    ),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen);
