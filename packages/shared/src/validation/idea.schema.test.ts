import { createIdeaSchema, updateIdeaSchema } from './idea.schema';

describe('createIdeaSchema', () => {
  it('accepts a valid minimal input', () => {
    const result = createIdeaSchema.safeParse({ title: 'My idea' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My idea');
      expect(result.data.tags).toEqual([]); // default
    }
  });

  it('accepts full input', () => {
    const result = createIdeaSchema.safeParse({
      title: 'SaaS for dog walkers',
      description: 'An app to connect dog owners with walkers',
      tags: ['saas', 'pets'],
      trackType: 'side_project',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trackType).toBe('side_project');
      expect(result.data.tags).toEqual(['saas', 'pets']);
    }
  });

  it('rejects empty title', () => {
    const result = createIdeaSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    const result = createIdeaSchema.safeParse({ title: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects description over 2000 characters', () => {
    const result = createIdeaSchema.safeParse({
      title: 'Valid title',
      description: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 10 tags', () => {
    const result = createIdeaSchema.safeParse({
      title: 'Valid title',
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects tag over 50 characters', () => {
    const result = createIdeaSchema.safeParse({
      title: 'Valid title',
      tags: ['x'.repeat(51)],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid track types', () => {
    const trackTypes = [
      'side_project',
      'job_application',
      'career_pivot',
      'course',
      'freelance',
      'custom',
    ];
    for (const trackType of trackTypes) {
      const result = createIdeaSchema.safeParse({ title: 'Test', trackType });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid track type', () => {
    const result = createIdeaSchema.safeParse({ title: 'Test', trackType: 'hobby' });
    expect(result.success).toBe(false);
  });

  it('allows trackType to be omitted', () => {
    const result = createIdeaSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trackType).toBeUndefined();
    }
  });
});

describe('updateIdeaSchema', () => {
  it('accepts empty object', () => {
    const result = updateIdeaSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid status update', () => {
    const result = updateIdeaSchema.safeParse({ status: 'exploring' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateIdeaSchema.safeParse({ status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    const statuses = [
      'spark',
      'exploring',
      'building',
      'shipped',
      'bookmarked',
      'applied',
      'interviewing',
      'offer',
      'accepted',
      'rejected',
      'curious',
      'researching',
      'networking',
      'transitioning',
      'landed',
      'interested',
      'enrolled',
      'completing',
      'completed',
      'lead',
      'pitched',
      'negotiating',
      'active',
      'delivered',
      'to_do',
      'in_progress',
      'done',
    ];
    for (const status of statuses) {
      const result = updateIdeaSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('validates status against track type when both provided', () => {
    // spark is valid for side_project
    const valid = updateIdeaSchema.safeParse({
      status: 'spark',
      trackType: 'side_project',
    });
    expect(valid.success).toBe(true);

    // spark is NOT valid for job_application
    const invalid = updateIdeaSchema.safeParse({
      status: 'spark',
      trackType: 'job_application',
    });
    expect(invalid.success).toBe(false);
  });

  it('allows status without trackType (no cross-validation)', () => {
    // When trackType is not provided, any valid status is accepted
    const result = updateIdeaSchema.safeParse({ status: 'shipped' });
    expect(result.success).toBe(true);
  });

  it('allows trackType without status (no cross-validation)', () => {
    const result = updateIdeaSchema.safeParse({ trackType: 'freelance' });
    expect(result.success).toBe(true);
  });

  it('cross-validates correctly for all tracks', () => {
    const cases: Array<{ status: string; trackType: string; expected: boolean }> = [
      { status: 'shipped', trackType: 'side_project', expected: true },
      { status: 'bookmarked', trackType: 'job_application', expected: true },
      { status: 'landed', trackType: 'career_pivot', expected: true },
      { status: 'completed', trackType: 'course', expected: true },
      { status: 'delivered', trackType: 'freelance', expected: true },
      { status: 'done', trackType: 'custom', expected: true },
      // Invalid combinations
      { status: 'shipped', trackType: 'job_application', expected: false },
      { status: 'landed', trackType: 'side_project', expected: false },
      { status: 'delivered', trackType: 'course', expected: false },
    ];

    for (const { status, trackType, expected } of cases) {
      const result = updateIdeaSchema.safeParse({ status, trackType });
      expect(result.success).toBe(expected);
    }
  });
});
