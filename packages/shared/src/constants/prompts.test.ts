import { COACH_SYSTEM_PROMPT, IDEA_PROMPTS } from './prompts';

describe('IDEA_PROMPTS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(IDEA_PROMPTS)).toBe(true);
    expect(IDEA_PROMPTS.length).toBeGreaterThan(0);
  });

  it('contains only non-empty strings', () => {
    for (const prompt of IDEA_PROMPTS) {
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    }
  });
});

describe('COACH_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof COACH_SYSTEM_PROMPT).toBe('string');
    expect(COACH_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('mentions Bob', () => {
    expect(COACH_SYSTEM_PROMPT).toContain('Bob');
  });

  it('includes UK English instruction', () => {
    expect(COACH_SYSTEM_PROMPT).toContain('UK English');
  });

  it('contains all action format definitions', () => {
    expect(COACH_SYSTEM_PROMPT).toContain('[ACTION:email]');
    expect(COACH_SYSTEM_PROMPT).toContain('[ACTION:calendar]');
    expect(COACH_SYSTEM_PROMPT).toContain('[ACTION:maps]');
    expect(COACH_SYSTEM_PROMPT).toContain('[ACTION:link]');
    expect(COACH_SYSTEM_PROMPT).toContain('[ACTION:save_idea]');
    expect(COACH_SYSTEM_PROMPT).toContain('[ACTION:create_task]');
  });

  it('contains track awareness section', () => {
    expect(COACH_SYSTEM_PROMPT).toContain('Track awareness');
    expect(COACH_SYSTEM_PROMPT).toContain('Side projects');
    expect(COACH_SYSTEM_PROMPT).toContain('Job applications');
    expect(COACH_SYSTEM_PROMPT).toContain('Freelance');
  });

  it('contains save_idea usage instructions', () => {
    expect(COACH_SYSTEM_PROMPT).toContain('save_idea');
    expect(COACH_SYSTEM_PROMPT).toContain('Only suggest ONCE per conversation');
  });

  it('contains create_task usage instructions', () => {
    expect(COACH_SYSTEM_PROMPT).toContain('create_task');
    expect(COACH_SYSTEM_PROMPT).toContain('ISO 8601');
  });
});
