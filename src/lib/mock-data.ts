export type LetterStatus = 'Delivered' | 'No reply yet' | 'Reply received' | 'Conversation open';

export interface LetterEntry {
  date: string;
  direction: 'To someone' | 'From someone';
  preview: string;
  status: LetterStatus;
  meta: string;
}

export const letterEntries: LetterEntry[] = [
  {
    date: 'Today',
    direction: 'From someone',
    preview: 'This morning the rain stopped just before I left home…',
    status: 'Reply received',
    meta: 'Private alias · No profile shared',
  },
  {
    date: 'Yesterday',
    direction: 'To someone',
    preview: 'I have started leaving the window open while I make coffee…',
    status: 'No reply yet',
    meta: 'Private alias · Sent to one reader',
  },
  {
    date: '4 days ago',
    direction: 'To someone',
    preview: 'There is a bench at the end of my street that catches the last light…',
    status: 'Conversation open',
    meta: 'Private alias · 3 letters exchanged',
  },
];
