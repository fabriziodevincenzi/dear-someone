export const emailActions = {
  stop: {
    label: 'I don’t wish to continue',
    title: 'You can leave the correspondence here.',
    body: 'We will stop forwarding messages in this thread. The other person will only be told that you chose to end the correspondence; we will not share your identity or reason.',
  },
  report: {
    label: 'Report this letter',
    title: 'Thank you for telling us.',
    body: 'A report is reviewed separately from the correspondence. We will protect your privacy, stop the thread when needed, and never turn silence into a reliability score.',
  },
  continue: {
    label: 'I would like to continue directly',
    title: 'We will wait for a second yes.',
    body: 'Your request is recorded as one side of a mutual choice. We only reveal direct contact details if the other person agrees too, even if that happens much later.',
  },
} as const;
