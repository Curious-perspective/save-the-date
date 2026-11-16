// Everything a guest reads, in one place. Fill the ____ blanks; nothing else needs touching.
export const content = {
  opening: 'You Are\nInvited', // first screen, before the leaves part (no names or date yet: a little suspense)
  couple: { bride: 'Shreya', groom: 'Akshay' },
  announce: 'are getting married',
  dates: '16 & 17 February 2027',
  place: 'Jim Corbett · Uttarakhand',

  // Grandparents' blessings line: hidden until names are given ('' hides it).
  blessingsLine: '',
  blessings: [] as string[],

  families: [
    { who: 'Shreya', relation: 'daughter of', parents: 'Dr. Anju Garg & Dr. Rakesh Garg' },
    { who: 'Akshay', relation: 'son of', parents: 'Mrs. Mamta Jain & Mr. Amit Jain' },
  ],

  formal: 'Formal invitation to follow', // shown with the RSVP at dusk
  rsvpBy: '24 November 2026',
  maxGuests: 10, // later: per-family cap from personalised links (?g=)

  calendar: {
    title: "Shreya & Akshay's Wedding",
    details: 'Save the date! The formal invitation will follow.',
    location: 'Jim Corbett, Uttarakhand, India',
    start: '20270216', // all-day, Google wants the end date exclusive
    endExclusive: '20270218',
  },
}
