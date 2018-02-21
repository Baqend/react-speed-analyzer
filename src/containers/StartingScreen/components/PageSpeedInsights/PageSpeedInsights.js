import React from 'react'

import ReactTooltip from 'react-tooltip'

import { formatFileSize } from 'helper/utils'

const dots = (
  <span className="loader">
    <span className="loader__dot">.</span>
    <span className="loader__dot">.</span>
    <span className="loader__dot">.</span>
  </span>
)

const pageSpeedInsights = ({ testOverview }) => {
  const { psiDomains, psiRequests, psiResponseSize } = testOverview
  return (
    <div className={`flex justify-between mt2`}>
      <div className="pa2 text-center">
        <div data-tip data-for='psiDomains'>
          <small className="faded">Domains</small>
          <br />
          {psiDomains ? (
            <strong className="animated zoomIn">{psiDomains}</strong>
          ) : (
            <strong>{dots}</strong>
          )}
        </div>
        <ReactTooltip id='psiDomains' type='dark' place='top' effect='solid'>
          <span>Number of unique hosts referenced by the page.</span>
        </ReactTooltip>
      </div>
      <div className="pa2 text-center">
        <div data-tip data-for='psiRequests'>
          <small className="faded">Requests</small>
          <br />
          {psiRequests ? (
            <strong className="animated zoomIn">{psiRequests}</strong>
          ) : (
            <strong>{dots}</strong>
          )}
        </div>
        <ReactTooltip id='psiRequests' type='dark' place='top' effect='solid'>
          <span>Number of HTTP resources loaded by the page.</span>
        </ReactTooltip>
      </div>
      <div className="pa2 text-center">
        <div data-tip data-for='psiResponseSize'>
          <small className="faded">Response Size</small>
          <br />
          {psiResponseSize ? (
            <strong className="animated zoomIn">{formatFileSize(psiResponseSize, 2)}</strong>
          ) : (
            <strong>{dots}</strong>
          )}
        </div>
        <ReactTooltip id='psiResponseSize' type='dark' place='top' effect='solid'>
          <span>Number of uncompressed response bytes for resources on the page.</span>
        </ReactTooltip>
      </div>
    </div>
  )
}

export default pageSpeedInsights
