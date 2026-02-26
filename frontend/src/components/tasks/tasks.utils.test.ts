import { isOverdue } from './tasks.utils';

describe('isOverdue', () => {
  it('returns false when dueDate is null', () => {
    expect(isOverdue(null, 'todo')).toBe(false);
  });

  it('returns false when status is done regardless of date', () => {
    expect(isOverdue('2020-01-01', 'done')).toBe(false);
  });

  it('returns true for a past due date on an incomplete task', () => {
    expect(isOverdue('2020-06-15', 'todo')).toBe(true);
    expect(isOverdue('2020-06-15', 'in_progress')).toBe(true);
  });

  it('returns false for a future due date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDateStr = tomorrow.toISOString().split('T')[0];
    expect(isOverdue(futureDateStr, 'todo')).toBe(false);
  });
});
