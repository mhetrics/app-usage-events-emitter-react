import { createQueue, QueueOrder } from 'simple-in-memory-queue';

interface KeyEvent {
  mode: 'up' | 'down';
  key: string;
}
export const calculateSequenceFromKeyEvents = ({
  events,
}: {
  events: KeyEvent[];
}) => {
  // calculate the sequence
  const sequence = createQueue<string>({ order: QueueOrder.LAST_IN_FIRST_OUT });
  for (const event of events) {
    // handle key down
    if (event.mode === 'down') {
      sequence.push(`d:${event.key}`);
      continue;
    }

    // handle key up equal to last key down
    const lastKeyDown = sequence.peek()[0];
    if (lastKeyDown === `d:${event.key}`) {
      sequence.pop(); // remove the `d:*` item from the queue
      sequence.push(event.key); // and add the key itself, without the modifier
      continue;
    }

    // handle key up not equal to last key down
    sequence.push(`u:${event.key}`);
  }

  // return the sequence
  return sequence.pop(0, sequence.length).reverse();
};
