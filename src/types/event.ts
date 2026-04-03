export interface Event {
  id: string
  uid: string
  name: string
  description: string
  type: string
  isBoxscoreLinked: boolean
  startDate: string
  endDate: string
  accepted: boolean
  progress: Progress
  steps: Step[]
}

export interface Progress {
  currentValue: number
  lastUpdate: string
}

export interface Step {
  step: number
  conditionValue: number
  status: string
  rewards: Reward[]
}

export interface Reward {
  code: string
  type: string
  amount: number
}
