import { Cat, HandHeart, HeartPulse, House, Sprout, Stethoscope, Target } from 'lucide-react'

export interface Fact {
  figure: string
  title: string
  text: string
}

export interface FactsLabels {
  region: string
  pause: string
  play: string
  goTo: string
}

/**
 * One icon per fact, in the order the facts are written in the content file.
 * Shared so the moving band on the home page and the quiet list on the about
 * page mark the same fact with the same icon.
 */
export const FACT_ICONS = [Cat, Sprout, HeartPulse, House, Stethoscope, Target, HandHeart]
