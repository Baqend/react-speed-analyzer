import React from 'react'

import './Spinner.css'

const Spinner = () => (
  <svg className="circular-loader" viewBox="25 25 50 50">
    <circle className="loader-path" cx="50" cy="50" r="22" fill="none" stroke="#fff" strokeWidth="1.5" />
  </svg>
)

export default Spinner
