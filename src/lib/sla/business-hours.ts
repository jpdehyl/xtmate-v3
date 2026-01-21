export interface BusinessHoursConfig {
  startHour: number;
  endHour: number;
  workDays: number[];
  holidays?: Date[];
}

const DEFAULT_CONFIG: BusinessHoursConfig = {
  startHour: 8,
  endHour: 17,
  workDays: [1, 2, 3, 4, 5],
};

export function isBusinessHour(date: Date, config: BusinessHoursConfig = DEFAULT_CONFIG): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  
  if (!config.workDays.includes(dayOfWeek)) {
    return false;
  }
  
  if (hour < config.startHour || hour >= config.endHour) {
    return false;
  }
  
  if (config.holidays) {
    const dateStr = date.toISOString().split('T')[0];
    for (const holiday of config.holidays) {
      if (holiday.toISOString().split('T')[0] === dateStr) {
        return false;
      }
    }
  }
  
  return true;
}

export function addBusinessHours(
  startDate: Date,
  hours: number,
  config: BusinessHoursConfig = DEFAULT_CONFIG
): Date {
  const result = new Date(startDate);
  let remainingHours = hours;
  const hoursPerDay = config.endHour - config.startHour;
  
  while (remainingHours > 0) {
    if (isBusinessHour(result, config)) {
      const currentHour = result.getHours();
      const hoursLeftToday = config.endHour - currentHour;
      
      if (remainingHours <= hoursLeftToday) {
        result.setTime(result.getTime() + remainingHours * 60 * 60 * 1000);
        remainingHours = 0;
      } else {
        remainingHours -= hoursLeftToday;
        result.setDate(result.getDate() + 1);
        result.setHours(config.startHour, 0, 0, 0);
      }
    } else {
      const dayOfWeek = result.getDay();
      if (!config.workDays.includes(dayOfWeek)) {
        const daysUntilWork = config.workDays.find(d => d > dayOfWeek) 
          ? (config.workDays.find(d => d > dayOfWeek)! - dayOfWeek)
          : (7 - dayOfWeek + config.workDays[0]);
        result.setDate(result.getDate() + daysUntilWork);
        result.setHours(config.startHour, 0, 0, 0);
      } else if (result.getHours() < config.startHour) {
        result.setHours(config.startHour, 0, 0, 0);
      } else {
        result.setDate(result.getDate() + 1);
        result.setHours(config.startHour, 0, 0, 0);
      }
    }
  }
  
  return result;
}

export function getBusinessHoursBetween(
  start: Date,
  end: Date,
  config: BusinessHoursConfig = DEFAULT_CONFIG
): number {
  if (end <= start) return 0;
  
  let hours = 0;
  const current = new Date(start);
  const hoursPerDay = config.endHour - config.startHour;
  
  while (current < end) {
    if (isBusinessHour(current, config)) {
      const currentHour = current.getHours();
      const endOfDay = new Date(current);
      endOfDay.setHours(config.endHour, 0, 0, 0);
      
      if (end < endOfDay) {
        hours += (end.getTime() - current.getTime()) / (60 * 60 * 1000);
        break;
      } else {
        hours += config.endHour - currentHour;
        current.setDate(current.getDate() + 1);
        current.setHours(config.startHour, 0, 0, 0);
      }
    } else {
      const dayOfWeek = current.getDay();
      if (!config.workDays.includes(dayOfWeek)) {
        const daysUntilWork = config.workDays.find(d => d > dayOfWeek)
          ? (config.workDays.find(d => d > dayOfWeek)! - dayOfWeek)
          : (7 - dayOfWeek + config.workDays[0]);
        current.setDate(current.getDate() + daysUntilWork);
        current.setHours(config.startHour, 0, 0, 0);
      } else if (current.getHours() < config.startHour) {
        current.setHours(config.startHour, 0, 0, 0);
      } else {
        current.setDate(current.getDate() + 1);
        current.setHours(config.startHour, 0, 0, 0);
      }
    }
  }
  
  return Math.round(hours * 10) / 10;
}
