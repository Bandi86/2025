'use client'
import React from 'react'

interface UserStatsProps {
  posts?: number
  comments?: number
  likes?: number
  followers?: number
  following?: number
}

export default function UserStats({
  posts,
  comments,
  likes,
  followers,
  following
}: UserStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="stat">
        <div className="stat-title">Posts</div>
        <div className="stat-value">{posts ?? 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Comments</div>
        <div className="stat-value">{comments ?? 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Likes</div>
        <div className="stat-value">{likes ?? 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Followers</div>
        <div className="stat-value">{followers ?? 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Following</div>
        <div className="stat-value">{following ?? 0}</div>
      </div>
    </div>
  )
}
