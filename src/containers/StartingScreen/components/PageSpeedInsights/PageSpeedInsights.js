import React from 'react'

import { Tooltip } from 'react-tippy'

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
        <Tooltip title="Number of unique hosts referenced by the page." position="top" arrow>
          <small className="faded">Domains</small>
          <br />
          {psiDomains ? (
            <strong className="animated zoomIn">{psiDomains}</strong>
          ) : (
            <strong>{dots}</strong>
          )}
        </Tooltip>
      </div>
      <div className="pa2 text-center">
        <Tooltip title="Number of HTTP resources loaded by the page." position="top" arrow>
          <small className="faded">Requests</small>
          <br />
          {psiRequests ? (
            <strong className="animated zoomIn">{psiRequests}</strong>
          ) : (
            <strong>{dots}</strong>
          )}
        </Tooltip>
      </div>
      <div className="pa2 text-center">
        <Tooltip title="Number of uncompressed response bytes for resources on the page." position="top" arrow>
          <small className="faded">Response Size</small>
          <br />
          {psiResponseSize ? (
            <strong className="animated zoomIn">{formatFileSize(psiResponseSize, 2)}</strong>
          ) : (
            <strong>{dots}</strong>
          )}
        </Tooltip>
      </div>
    </div>
  )
}

export default pageSpeedInsights
