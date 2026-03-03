import { Card, TeamMember, BottleneckAlert } from '../types';

const OVERLOAD_THRESHOLD = 8; // Story points

export const bottleneckAnalysisService = {
  async analyzeTeamWorkload(cards: Card[], teamMembers: TeamMember[]): Promise<BottleneckAlert[]> {
    const alerts: BottleneckAlert[] = [];

    // Detect overloaded members
    const overloadAlerts = await this.detectOverloadedMembers(cards, teamMembers);
    alerts.push(...overloadAlerts);

    // Detect unassigned cards
    const unassignedAlerts = await this.detectUnassignedCards(cards);
    alerts.push(...unassignedAlerts);

    // Detect workload imbalance
    const imbalanceAlerts = await this.detectWorkloadImbalance(cards, teamMembers);
    alerts.push(...imbalanceAlerts);

    return alerts;
  },

  async detectOverloadedMembers(cards: Card[], teamMembers: TeamMember[]): Promise<BottleneckAlert[]> {
    const alerts: BottleneckAlert[] = [];

    // Filter cards in "In Progress"
    const inProgressCards = cards.filter(card => card.column === 'In Progress');

    // Calculate workload per team member
    for (const member of teamMembers) {
      const assignedCards = inProgressCards.filter(card => 
        card.assignees?.includes(member.id)
      );

      const workload = assignedCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);

      if (workload > OVERLOAD_THRESHOLD) {
        alerts.push({
          severity: 'high',
          category: 'team_member_overload',
          message: `Team member ${member.name} is overloaded with ${workload} story points in progress`,
          affectedTeamMember: member.id,
          affectedCards: assignedCards.map(card => card.id),
          currentWorkload: workload,
          threshold: OVERLOAD_THRESHOLD,
          recommendations: [
            'Reassign cards to less busy team members',
            'Break down large cards into smaller tasks',
            'Move some cards back to To Do',
          ],
        });
      }
    }

    return alerts;
  },

  async detectUnassignedCards(cards: Card[]): Promise<BottleneckAlert[]> {
    const alerts: BottleneckAlert[] = [];

    // Filter cards in "In Progress" or "Done"
    const activeCards = cards.filter(card => 
      card.column === 'In Progress' || card.column === 'Done'
    );

    // Find unassigned cards
    for (const card of activeCards) {
      if (!card.assignees || card.assignees.length === 0) {
        alerts.push({
          severity: 'low',
          category: 'unassigned_card',
          message: `Card "${card.title}" in ${card.column} is unassigned`,
          affectedCards: [card.id],
          affectedColumn: card.column,
          recommendations: [
            'Assign this card to a team member',
          ],
        });
      }
    }

    return alerts;
  },

  async detectWorkloadImbalance(cards: Card[], teamMembers: TeamMember[]): Promise<BottleneckAlert[]> {
    const alerts: BottleneckAlert[] = [];

    // Filter cards in "In Progress"
    const inProgressCards = cards.filter(card => card.column === 'In Progress');

    // Calculate workload per team member
    const workloads = teamMembers.map(member => {
      const assignedCards = inProgressCards.filter(card => 
        card.assignees?.includes(member.id)
      );
      const workload = assignedCards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);
      return { id: member.id, name: member.name, workload };
    });

    // Identify overloaded and idle members
    const overloadedMembers = workloads.filter(w => w.workload > OVERLOAD_THRESHOLD);
    const idleMembers = workloads.filter(w => w.workload === 0);

    // Alert if both exist
    if (overloadedMembers.length > 0 && idleMembers.length > 0) {
      alerts.push({
        severity: 'medium',
        category: 'workload_imbalance_team',
        message: `Workload is unbalanced: ${overloadedMembers.length} overloaded, ${idleMembers.length} idle`,
        overloadedMembers,
        idleMembers,
        recommendations: [
          'Reassign work from overloaded to idle team members',
        ],
      });
    }

    return alerts;
  },
};
