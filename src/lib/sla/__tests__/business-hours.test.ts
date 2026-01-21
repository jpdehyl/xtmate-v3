import { describe, it, expect } from 'vitest';
import { isBusinessHour, addBusinessHours, getBusinessHoursBetween } from '../business-hours';

describe('Business Hours Utilities', () => {
  describe('isBusinessHour', () => {
    it('returns true for Monday at 10am', () => {
      const date = new Date('2024-01-08T10:00:00');
      expect(isBusinessHour(date)).toBe(true);
    });

    it('returns false for Saturday', () => {
      const date = new Date('2024-01-06T10:00:00');
      expect(isBusinessHour(date)).toBe(false);
    });

    it('returns false for Sunday', () => {
      const date = new Date('2024-01-07T10:00:00');
      expect(isBusinessHour(date)).toBe(false);
    });

    it('returns false before business hours', () => {
      const date = new Date('2024-01-08T07:00:00');
      expect(isBusinessHour(date)).toBe(false);
    });

    it('returns false after business hours', () => {
      const date = new Date('2024-01-08T18:00:00');
      expect(isBusinessHour(date)).toBe(false);
    });

    it('returns true at start of business hours', () => {
      const date = new Date('2024-01-08T08:00:00');
      expect(isBusinessHour(date)).toBe(true);
    });

    it('returns false at end of business hours', () => {
      const date = new Date('2024-01-08T17:00:00');
      expect(isBusinessHour(date)).toBe(false);
    });
  });

  describe('addBusinessHours', () => {
    it('adds hours within same day', () => {
      const start = new Date('2024-01-08T10:00:00');
      const result = addBusinessHours(start, 4);
      expect(result.getHours()).toBe(14);
    });

    it('skips to next day when hours exceed end of day', () => {
      const start = new Date('2024-01-08T15:00:00');
      const result = addBusinessHours(start, 4);
      expect(result.getDate()).toBe(9);
      expect(result.getHours()).toBe(10);
    });

    it('skips weekends', () => {
      const start = new Date('2024-01-05T15:00:00');
      const result = addBusinessHours(start, 4);
      expect(result.getDate()).toBe(8);
    });
  });

  describe('getBusinessHoursBetween', () => {
    it('returns 0 when end is before start', () => {
      const start = new Date('2024-01-08T12:00:00');
      const end = new Date('2024-01-08T10:00:00');
      expect(getBusinessHoursBetween(start, end)).toBe(0);
    });

    it('counts hours within same day', () => {
      const start = new Date('2024-01-08T10:00:00');
      const end = new Date('2024-01-08T14:00:00');
      expect(getBusinessHoursBetween(start, end)).toBe(4);
    });
  });
});
