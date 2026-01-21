import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateSlaStatus,
  calculateHoursRemaining,
  getSlaEventWithStatus,
  calculateTargetTime,
  calculateSlaCompliance,
  getSlaRiskCounts,
  formatHours,
} from '../calculations';
import type { SlaEvent, CarrierSlaRule } from '@/lib/db/schema';

describe('SLA Calculations', () => {
  describe('calculateSlaStatus', () => {
    const baseEvent: SlaEvent = {
      id: '123',
      estimateId: 'est-123',
      milestone: 'contacted',
      targetAt: null,
      completedAt: null,
      isOverdue: false,
      notes: null,
      createdAt: new Date(),
    };

    it('returns "completed" when event is completed and not overdue', () => {
      const event = { ...baseEvent, completedAt: new Date(), isOverdue: false };
      expect(calculateSlaStatus(event)).toBe('completed');
    });

    it('returns "overdue" when event is completed but was overdue', () => {
      const event = { ...baseEvent, completedAt: new Date(), isOverdue: true };
      expect(calculateSlaStatus(event)).toBe('overdue');
    });

    it('returns "pending" when no target is set', () => {
      const event = { ...baseEvent, targetAt: null };
      expect(calculateSlaStatus(event)).toBe('pending');
    });

    it('returns "overdue" when past target time', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      const event = { ...baseEvent, targetAt: pastDate };
      expect(calculateSlaStatus(event)).toBe('overdue');
    });

    it('returns "at_risk" when within 4 hours of target', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);
      const event = { ...baseEvent, targetAt: futureDate };
      expect(calculateSlaStatus(event)).toBe('at_risk');
    });

    it('returns "on_time" when more than 4 hours from target', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 10);
      const event = { ...baseEvent, targetAt: futureDate };
      expect(calculateSlaStatus(event)).toBe('on_time');
    });
  });

  describe('calculateHoursRemaining', () => {
    const baseEvent: SlaEvent = {
      id: '123',
      estimateId: 'est-123',
      milestone: 'contacted',
      targetAt: null,
      completedAt: null,
      isOverdue: false,
      notes: null,
      createdAt: new Date(),
    };

    it('returns null values when no target is set', () => {
      const result = calculateHoursRemaining(baseEvent);
      expect(result.hoursRemaining).toBeNull();
      expect(result.hoursOverdue).toBeNull();
    });

    it('calculates hours remaining correctly', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 5);
      const event = { ...baseEvent, targetAt: futureDate };
      const result = calculateHoursRemaining(event);
      expect(result.hoursRemaining).toBeCloseTo(5, 0);
      expect(result.hoursOverdue).toBeNull();
    });

    it('calculates hours overdue correctly', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 3);
      const event = { ...baseEvent, targetAt: pastDate };
      const result = calculateHoursRemaining(event);
      expect(result.hoursRemaining).toBeNull();
      expect(result.hoursOverdue).toBeCloseTo(3, 0);
    });

    it('uses completedAt for calculation when event is completed', () => {
      const targetDate = new Date();
      const completedDate = new Date();
      completedDate.setHours(completedDate.getHours() - 2);
      targetDate.setHours(targetDate.getHours() + 1);

      const event = {
        ...baseEvent,
        targetAt: targetDate,
        completedAt: completedDate
      };
      const result = calculateHoursRemaining(event);
      expect(result.hoursRemaining).toBeCloseTo(3, 0);
    });
  });

  describe('calculateTargetTime', () => {
    it('returns null for milestones with 0 target hours', () => {
      const baseTime = new Date();
      const result = calculateTargetTime('assigned', baseTime, []);
      expect(result).toBeNull();
    });

    it('uses default targets when no carrier rules exist', () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');
      const result = calculateTargetTime('contacted', baseTime, []);
      expect(result).toEqual(new Date('2024-01-01T14:00:00Z')); // 4 hours default
    });

    it('uses carrier-specific rules when available', () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');
      const carrierRules: CarrierSlaRule[] = [
        {
          id: 'rule-1',
          carrierId: 'carrier-1',
          milestone: 'contacted',
          targetHours: 2,
          isBusinessHours: true,
          createdAt: new Date(),
        },
      ];
      const result = calculateTargetTime('contacted', baseTime, carrierRules);
      expect(result).toEqual(new Date('2024-01-01T12:00:00Z')); // 2 hours from carrier rule
    });
  });

  describe('calculateSlaCompliance', () => {
    const createEvent = (completedAt: Date | null, isOverdue: boolean): SlaEvent => ({
      id: Math.random().toString(),
      estimateId: 'est-123',
      milestone: 'contacted',
      targetAt: new Date(),
      completedAt,
      isOverdue,
      notes: null,
      createdAt: new Date(),
    });

    it('returns 100 when no completed events', () => {
      const events = [createEvent(null, false)];
      expect(calculateSlaCompliance(events)).toBe(100);
    });

    it('calculates correct compliance rate', () => {
      const events = [
        createEvent(new Date(), false), // on time
        createEvent(new Date(), false), // on time
        createEvent(new Date(), true),  // overdue
        createEvent(new Date(), false), // on time
      ];
      expect(calculateSlaCompliance(events)).toBe(75); // 3/4 = 75%
    });

    it('returns 0 when all completed events are overdue', () => {
      const events = [
        createEvent(new Date(), true),
        createEvent(new Date(), true),
      ];
      expect(calculateSlaCompliance(events)).toBe(0);
    });

    it('returns 100 when all completed events are on time', () => {
      const events = [
        createEvent(new Date(), false),
        createEvent(new Date(), false),
      ];
      expect(calculateSlaCompliance(events)).toBe(100);
    });
  });

  describe('getSlaRiskCounts', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('counts at-risk and overdue events correctly', () => {
      const events: SlaEvent[] = [
        {
          id: '1',
          estimateId: 'est-1',
          milestone: 'contacted',
          targetAt: new Date('2024-01-01T13:00:00Z'), // 1 hour away - at risk
          completedAt: null,
          isOverdue: false,
          notes: null,
          createdAt: new Date(),
        },
        {
          id: '2',
          estimateId: 'est-2',
          milestone: 'site_visit',
          targetAt: new Date('2024-01-01T10:00:00Z'), // 2 hours ago - overdue
          completedAt: null,
          isOverdue: false,
          notes: null,
          createdAt: new Date(),
        },
        {
          id: '3',
          estimateId: 'est-3',
          milestone: 'estimate_uploaded',
          targetAt: new Date('2024-01-01T20:00:00Z'), // 8 hours away - on time
          completedAt: null,
          isOverdue: false,
          notes: null,
          createdAt: new Date(),
        },
      ];

      const result = getSlaRiskCounts(events);
      expect(result.atRisk).toBe(1);
      expect(result.overdue).toBe(1);
    });
  });

  describe('formatHours', () => {
    it('formats minutes for less than 1 hour', () => {
      expect(formatHours(0.5)).toBe('30m');
      expect(formatHours(0.25)).toBe('15m');
    });

    it('formats hours for less than 24 hours', () => {
      expect(formatHours(2)).toBe('2h');
      expect(formatHours(5.5)).toBe('5.5h');
    });

    it('formats days and hours for 24+ hours', () => {
      expect(formatHours(24)).toBe('1d');
      expect(formatHours(26)).toBe('1d 2h');
      expect(formatHours(48)).toBe('2d');
      expect(formatHours(50.5)).toBe('2d 2.5h');
    });
  });
});
