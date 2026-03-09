import { createTaskSchema, updateTaskSchema } from './task.schema';

describe('createTaskSchema', () => {
  const validInput = {
    title: 'Post on Twitter',
    dueDate: '2026-03-06T09:45:00.000Z',
  };

  it('accepts a valid minimal input', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Post on Twitter');
      expect(result.data.source).toBe('manual'); // default
    }
  });

  it('accepts full input with all fields', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: 'Share the marketing update',
      linkedIdeaId: '550e8400-e29b-41d4-a716-446655440000',
      source: 'bob',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('bob');
      expect(result.data.linkedIdeaId).toBe('550e8400-e29b-41d4-a716-446655440000');
    }
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    const result = createTaskSchema.safeParse({ ...validInput, title: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts title at exactly 200 characters', () => {
    const result = createTaskSchema.safeParse({ ...validInput, title: 'x'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('rejects missing dueDate', () => {
    const result = createTaskSchema.safeParse({ title: 'Do something' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid dueDate format', () => {
    const result = createTaskSchema.safeParse({ ...validInput, dueDate: 'tomorrow' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid dueDate (not ISO 8601)', () => {
    const result = createTaskSchema.safeParse({ ...validInput, dueDate: '2026-03-06' });
    expect(result.success).toBe(false);
  });

  it('rejects description over 2000 characters', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid linkedIdeaId (not UUID)', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      linkedIdeaId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source value', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      source: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('defaults source to manual when not provided', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('manual');
    }
  });
});

describe('updateTaskSchema', () => {
  it('accepts empty object (no updates)', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid status update', () => {
    const result = updateTaskSchema.safeParse({ status: 'done' });
    expect(result.success).toBe(true);
  });

  it('accepts valid title update', () => {
    const result = updateTaskSchema.safeParse({ title: 'Updated title' });
    expect(result.success).toBe(true);
  });

  it('accepts valid dueDate update', () => {
    const result = updateTaskSchema.safeParse({ dueDate: '2026-04-01T10:00:00.000Z' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateTaskSchema.safeParse({ status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('accepts dismissed status', () => {
    const result = updateTaskSchema.safeParse({ status: 'dismissed' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = updateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
