import { calculateSequenceFromKeyEvents } from './calculateSequenceFromKeyEvents';

const keyEventsTypingHello = ['h', 'e', 'l', 'l', 'o']
  .map((key) => {
    return [
      { key, mode: 'down' as const },
      { key, mode: 'up' as const },
    ];
  })
  .flat();

describe('calculateSequenceFromKeyEvents', () => {
  it('should be able to sequence correctly for typing a sentence without modifiers', async () => {
    const keyEvents = keyEventsTypingHello;
    const sequence = calculateSequenceFromKeyEvents({
      events: keyEvents,
    });
    expect(sequence).toEqual(['h', 'e', 'l', 'l', 'o']);
  });
  it('should be able to correctly represent a key that was down while others were pressed', async () => {
    const keyEvents = [
      { key: 'Shift', mode: 'down' as const },
      ...keyEventsTypingHello,
      { key: 'Shift', mode: 'up' as const },
    ];
    const sequence = calculateSequenceFromKeyEvents({
      events: keyEvents,
    });
    expect(sequence).toEqual(['d:Shift', 'h', 'e', 'l', 'l', 'o', 'u:Shift']);
  });
});
