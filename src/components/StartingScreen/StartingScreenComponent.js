import React, { Component } from 'react'

class StartingScreenComponent extends Component {
    handleUrlChange = (event) => {
        event.preventDefault()
        this.props.onUrlChange(event.target.value)
    }

    render() {
        return (
            <form id="formConfiguration">
                <input type="text"
                       inputMode="url"
                       spellCheck="false"
                       onChange={this.handleUrlChange}
                       id="currentVendorUrl"
                       placeholder="Enter URL here..."/>
            </form>
        )
    }

}

export default StartingScreenComponent;
