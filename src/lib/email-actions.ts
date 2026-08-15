export const emailActions = {
  stop: {
    label: 'I don’t wish to continue',
    title: 'You can leave the correspondence here.',
    body: 'We will close the private reply addresses and stop forwarding messages in this correspondence. Your identity and your reason remain private.',
  },
  report: {
    label: 'Report this letter',
    title: 'Thank you for telling us.',
    body: 'Reporting closes the correspondence and sends this letter to One Reader for a separate review. Your identity remains private.',
  },
  continue: {
    label: 'I would like to continue directly',
    title: 'We will wait for a second yes.',
    body: 'Your request is recorded as one side of a mutual choice. We only reveal direct contact details if the other person agrees too, even if that happens much later.',
  },
} as const;
