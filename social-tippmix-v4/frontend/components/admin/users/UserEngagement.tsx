'use client'
import React from 'react'

interface UserEngagementProps {
  engagementRate?: number
  responseRate?: number
  likesPerPost?: number
  commentsPerPost?: number
  postsPerWeek?: number
}

export default function UserEngagement({
  engagementRate = 0,
  responseRate = 0,
  likesPerPost = 0,
  commentsPerPost = 0,
  postsPerWeek = 0
}: UserEngagementProps) {
  // Helper to determine color based on value
  const getColorForMetric = (value: number, thresholds: [number, number, number]) => {
    const [low, medium, high] = thresholds
    if (value >= high) return 'success'
    if (value >= medium) return 'info'
    if (value >= low) return 'warning'
    return 'error'
  }

  // Calculate percentage for progress bars
  const getPercentage = (value: number, max: number) => {
    return Math.min(100, Math.max(0, (value / max) * 100))
  }

  return (
    <div className="card bg-base-100 shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Felhasználói Elkötelezettség</h3>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-base-content/70">Engagement Rate</span>
            <span className={`text-${getColorForMetric(engagementRate, [2, 5, 10])}`}>
              {engagementRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2.5">
            <div
              className={`bg-${getColorForMetric(engagementRate, [2, 5, 10])} h-2.5 rounded-full`}
              style={{ width: `${getPercentage(engagementRate, 20)}%` }}
            ></div>
          </div>
          <p className="text-xs text-base-content/50 mt-1">
            Az engagement rate azt mutatja, hogy a felhasználó tartalmával mennyire foglalkoznak más
            felhasználók
          </p>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-base-content/70">Válaszolási Arány</span>
            <span className={`text-${getColorForMetric(responseRate, [30, 60, 80])}`}>
              {responseRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2.5">
            <div
              className={`bg-${getColorForMetric(responseRate, [30, 60, 80])} h-2.5 rounded-full`}
              style={{ width: `${responseRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-base-content/50 mt-1">
            A felhasználó milyen arányban válaszol a neki érkező kommentekre
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="card bg-base-200 p-3">
            <span className="text-center text-base-content/70 text-sm">Like / Poszt</span>
            <div
              className="radial-progress mx-auto my-2"
              style={
                {
                  '--value': getPercentage(likesPerPost, 10),
                  '--size': '4rem'
                } as React.CSSProperties
              }
              role="progressbar"
            >
              {likesPerPost.toFixed(1)}
            </div>
          </div>

          <div className="card bg-base-200 p-3">
            <span className="text-center text-base-content/70 text-sm">Komment / Poszt</span>
            <div
              className="radial-progress mx-auto my-2"
              style={
                {
                  '--value': getPercentage(commentsPerPost, 5),
                  '--size': '4rem'
                } as React.CSSProperties
              }
              role="progressbar"
            >
              {commentsPerPost.toFixed(1)}
            </div>
          </div>

          <div className="card bg-base-200 p-3">
            <span className="text-center text-base-content/70 text-sm">Poszt / Hét</span>
            <div
              className="radial-progress mx-auto my-2"
              style={
                {
                  '--value': getPercentage(postsPerWeek, 7),
                  '--size': '4rem'
                } as React.CSSProperties
              }
              role="progressbar"
            >
              {postsPerWeek.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
