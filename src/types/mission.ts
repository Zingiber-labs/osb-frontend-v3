export interface Mission {
  id: number
  name: string
  description: string
  author: any
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
