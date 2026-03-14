/**
 * Curated affirmations (10–30) for the journal. Each day shows a couple in the new entry section.
 */
export const AFFIRMATIONS: string[] = [
  'I will be successful in life.',
  'I will score tons of runs this year.',
  'I am working to be the best batter I can be.',
  'I trust the process of growth and improvement.',
  'Every day I am becoming mentally and physically stronger.',
  'I stay calm and confident when I walk out to bat.',
  'I believe in my preparation and my abilities.',
  'Hard work and discipline are shaping my future.',
  'I learn from every innings, good or bad.',
  'I am building consistency in my game and in my life.',
  'I respect the grind and enjoy the journey.',
  'I embrace challenges because they make me better.',
  'I stay focused on my goals every single day.',
  'My mindset is strong and resilient.',
  'I back myself in every situation on the field.',
  'I am improving my technique and decision-making daily.',
  'My dedication today will create success tomorrow.',
  'I stay patient and trust my timing at the crease.',
  'I convert starts into big scores.',
  'I am confident, composed, and in control at the crease.',
  'I surround myself with positivity and growth.',
  'I am disciplined in my training and preparation.',
  'I push myself to improve even when it is difficult.',
  'My hard work will lead to outstanding performances.',
  'I visualize success and work toward it daily.',
  'I play with courage and clarity.',
  'I stay humble in success and strong in setbacks.',
  'Every practice session brings me closer to my goals.',
  'I am becoming the cricketer and person I aspire to be.',
  'My future in cricket and life is bright.',
];

/**
 * Returns a deterministic subset of affirmations for the given date so the same day always shows the same ones.
 * @param date - The date to get affirmations for (e.g. journal entry date).
 * @param count - Number of affirmations to return (default 2).
 */
export function getDailyAffirmations(date: Date, count: number = 2): string[] {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const n = AFFIRMATIONS.length;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = (dayOfYear + i * 17) % n;
    result.push(AFFIRMATIONS[index]);
  }
  return result;
}
