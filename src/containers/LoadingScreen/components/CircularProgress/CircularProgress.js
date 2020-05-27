import React from 'react'
import Parser from 'html-react-parser'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import './CircularProgress.css'

const circularProgress = ({ progress }) => {
  return (
    <CircularProgressbar
      minValue={0}
      maxValue={100}
      value={progress}
      text={Parser(`
        <tspan class="head-text" x="52" dy="-0.2em">${progress}%</tspan>
        <tspan class="sub-text" x="52" dy="2.8em">Test has been</tspan>
        <tspan class="sub-text" x="52" dy="1.4em">started...</tspan>
      `)}
      strokeWidth={5}
      styles={buildStyles({
        strokeLinecap: 'round',
        textSize: '16px',
        pathTransitionDuration: 0.5,
        pathColor: `rgba(255,255,255)`,
        textColor: '#ffffff',
        trailColor: 'rgba(0, 0, 0, 0.24)',
      })}
    />
  )
}

export default circularProgress
