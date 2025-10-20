import type { GoalDefinition, MilestoneDefinition } from './types'

export const EXAMPLE_GOALS: GoalDefinition[] = [
  {
    id: 'daily-first-action',
    type: 'daily',
    title: 'Kickstart the Day',
    description: 'Advance to a new day to keep your momentum rolling.',
    target: 1,
    reward: '+1 morale (placeholder)',
  },
  {
    id: 'weekly-earn-money',
    type: 'weekly',
    title: 'Build Your Savings',
    description: 'Accumulate $50 across the week through work or events.',
    target: 50,
    reward: '+$10 bonus (placeholder)',
  },
  {
    id: 'story-first-client',
    type: 'story',
    title: 'Secure the First Client',
    description: 'Prove your skills and land your very first agency contract.',
    target: 1,
    reward: 'Unlocks the agency narrative branch.',
  },
]

export const EXAMPLE_MILESTONES: MilestoneDefinition[] = [
  {
    id: 'story-breakthrough',
    title: 'Breakthrough Moment',
    description: 'Complete the “Secure the First Client” story goal.',
    requiredGoals: ['story-first-client'],
  },
]
