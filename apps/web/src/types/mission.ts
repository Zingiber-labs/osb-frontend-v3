export interface Mission {
  id: number
  name: string
  description: string
  author: string
  minPlayers: number
  requirements: Requirements
  rewards: Rewards
  prerequisites: any
  isRepeatable: boolean
  cooldownMinutes: number
  isActive: boolean
  isOnCooldown: boolean
}

export interface Requirements {
  points: number
  assists: number
}

export interface Rewards {
  xp: number
  gems: number
}


// Recent missions
export interface RecentMission {
  id: string
  missionId: string
  mission: Mission
  progress: any
  isCompleted: boolean
  isClaimed: boolean
  completedAt: any
  createdAt: string
}

export interface Requirements {
  points: number
  assists: number
}

export interface Rewards {
  xp: number
  gems: number
}
