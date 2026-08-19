# From the Sender

## Information architecture and wireframes

## 1. Product relationship

One Reader is the service.

From the Sender is the editorial publication that explains the ideas, practices and choices behind the service.

The editorial experience should feel like a small, focused publication rather than a product blog. It should help a visitor move through three stages:

1. discover an interesting idea;
2. understand the world and principles behind One Reader;
3. decide whether to write a first letter.

## 2. Proposed navigation

Primary navigation:

- From the Sender
- Topics
- Start here
- About One Reader

Persistent product action:

- Write to someone

The service action should remain visible, but the editorial navigation should not be dominated by product language.

## 3. Site map

```text
From the Sender
├── Home
├── Start here
│   └── Why One Reader exists
├── Topics
│   ├── The Sender
│   ├── The Reader
│   ├── The Letter
│   ├── The Quiet Internet
│   └── One Reader
├── Articles
│   └── Article detail
├── About One Reader
│   ├── How One Reader works
│   ├── Privacy and anonymity
│   └── Membership and sustainability
└── Newsletter
```

## 4. Content model

Each article should have:

- title;
- short editorial summary;
- topic;
- format;
- author;
- publication date;
- reading time;
- optional series or issue;
- optional supporting links;
- one relevant next action.

Recommended formats:

- Essay
- Practical note
- Field note
- Conversation
- Letter or fragment

Recommended metadata labels:

```text
Format · Essay
Topic · The Sender
6 min read
```

## 5. Journal home wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ One Reader                         From the Sender   Write → │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ FROM THE SENDER                                             │
│                                                             │
│ Writing to one person, reading with attention,              │
│ and building a quieter internet.                            │
│                                                             │
│ [Start here]  [About One Reader]                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FEATURED                                                    │
│                                                             │
│ [Large editorial image or restrained visual treatment]      │
│                                                             │
│ The Reader in Your Head                                    │
│ Writing changes when there is one real person on the other   │
│ side.                                                      │
│                                                             │
│ Essay · The Sender · 7 min read                             │
│ Read the article →                                         │
├───────────────────────────────┬─────────────────────────────┤
│ START HERE                     │ HOW ONE READER WORKS        │
│ A short introduction to        │ A clear explanation of the   │
│ the ideas behind the service.  │ private correspondence flow. │
│ Read this first →              │ See how it works →           │
├───────────────────────────────┴─────────────────────────────┤
│ EXPLORE THE JOURNAL                                         │
│                                                             │
│ [The Sender] [The Reader] [The Letter]                     │
│ [The Quiet Internet] [One Reader]                          │
├─────────────────────────────────────────────────────────────┤
│ LATEST NOTES                                                │
│                                                             │
│ Article title                                               │
│ Short summary · Topic · Reading time                        │
│                                                             │
│ Article title                                               │
│ Short summary · Topic · Reading time                        │
│                                                             │
│ Article title                                               │
│ Short summary · Topic · Reading time                        │
│                                                             │
│ View all notes →                                            │
├─────────────────────────────────────────────────────────────┤
│ A QUIETER LETTER                                            │
│ One person writes to one person they do not know.           │
│                                                             │
│ Write to someone →                                         │
└─────────────────────────────────────────────────────────────┘
```

## 6. Start here wireframe

The Start here page should be a short editorial introduction, not a full technical explanation.

```text
FROM THE SENDER

Why One Reader exists

We have more ways to communicate than ever, but fewer places
where a person can speak without performing.

One Reader begins with a smaller possibility: one person writes
to one person, privately and without the pressure of immediacy.

1. Communication has become public and accelerated.
2. People still want contact, but not constant availability.
3. A letter creates space around attention.
4. One Reader makes that relationship possible by email.

[How One Reader works] [Read the Journal] [Write to someone]
```

## 7. Topic page wireframe

Each topic page should combine a short introduction with a curated list of articles. It should not be an unstructured archive.

```text
TOPIC · THE SENDER

Writing as an intimate act: voice, detail, hesitation and the
decision to send something outward.

FEATURED NOTE
Large title and summary

ALL NOTES
┌─────────────────────────────────────────────────────────────┐
│ Title                                                       │
│ Summary                                                     │
│ Essay · 6 min read                                         │
├─────────────────────────────────────────────────────────────┤
│ Title                                                       │
│ Summary                                                     │
│ Practical note · 4 min read                                │
└─────────────────────────────────────────────────────────────┘
```

## 8. Article detail wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ One Reader                         From the Sender   Write → │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ The Sender · Essay                                         │
│                                                             │
│ The Reader in Your Head                                    │
│                                                             │
│ Writing changes when there is one real person on the other   │
│ side.                                                      │
│                                                             │
│ One Reader · 7 min read · 19 August 2026                   │
│                                                             │
│ [Editorial image or quiet opening visual]                   │
│                                                             │
│ Article body, set in a narrow reading column                │
│ with generous line height and clear section breaks.         │
│                                                             │
│ ...                                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ CONTINUE READING                                            │
│ Three related articles, preferably from the same topic      │
├─────────────────────────────────────────────────────────────┤
│ HOW ONE READER WORKS                                        │
│ See the service behind the idea →                           │
├─────────────────────────────────────────────────────────────┤
│ WRITE TO SOMEONE                                            │
└─────────────────────────────────────────────────────────────┘
```

## 9. Layout principles

- Use a publication-width reading column, not a full-width application layout.
- Give the title, summary and opening image enough space to establish a cover-like feeling.
- Use topic labels and metadata as quiet orientation, not as dashboard controls.
- Prefer editorial hierarchy over cards everywhere.
- Use a restrained image system: photographs, portraits, objects, paper, desks, rooms and details of writing.
- Keep calls to action visible but calm.
- Preserve the existing serif-led identity of One Reader while giving the Journal more editorial rhythm.
- Let article pages feel slower than product pages through spacing, typography and fewer controls.
- Use Libre Baskerville for editorial titles, decks, quotations and article copy; DM Sans for navigation, controls, calls to action and functional copy; DM Mono for categories, dates and reading-time metadata.
- Keep the same ivory ground, thin rules and restrained One Reader palette across editorial and product surfaces; do not introduce dark panels or additional decorative colors.

## 10. First implementation sequence

1. Separate the Journal identity from the current generic listing.
2. Add the From the Sender introduction and Start here link.
3. Add topic metadata and topic navigation.
4. Replace the flat earlier-notes list with featured, latest and curated sections.
5. Add related articles and a contextual service link to article pages.
6. Build the How One Reader works page as the main product explainer.
7. Introduce imagery only after the hierarchy works with text alone.

## 11. Success criteria

The new Journal should allow a first-time visitor to answer these questions within a few minutes:

- What is From the Sender?
- Why does One Reader exist?
- What does “one reader” mean?
- What kind of writing and ideas will I find here?
- How does the service work?
- What can I do next?

The visitor should be able to move naturally from an article to an understanding of the service without feeling that the article was only a sales page.
