export interface PlayerInfo {
  id: number
  date: string
  date_utc: string
  season: number
  postseason: boolean
  status: string
  time: string
  home_team_id: number
  home_score: number
  visitor_team_id: number
  visitor_score: number
  home_q1: number
  home_q2: number
  home_q3: number
  home_q4: number
  home_ot1: any
  home_ot2: any
  home_ot3: any
  visitor_q1: number
  visitor_q2: number
  visitor_q3: number
  visitor_q4: number
  visitor_ot1: any
  visitor_ot2: any
  visitor_ot3: any
  home_team: HomeTeam
  visitor_team: VisitorTeam
  statistics: Statistic[]
}

export interface HomeTeam {
  id: number
  full_name: string
  abbreviation: string
}

export interface VisitorTeam {
  id: number
  full_name: string
  abbreviation: string
}

export interface Statistic {
  player_id: number
  game_id: number
  team_id: number
  min: string
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  turnovers: number
  fouls: number
  fgm: number
  fga: number
  fg3m: number
  fg3a: number
  ftm: number
  fta: number
  oreb: number
  dreb: number
}
