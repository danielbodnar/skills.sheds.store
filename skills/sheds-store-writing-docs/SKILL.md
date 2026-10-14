---
name: sheds-store-writing-docs
description: >-
  Write, revise, and review project documentation for technical accuracy,
  useful structure, house style, and natural prose. Use when working on user
  documentation, guides, API reference pages, migration or upgrade guides,
  READMEs, contributor documentation, technical specifications, changelog
  entries, or release notes in any repository, and when asked to improve,
  audit, de-slop, or humanize existing documentation.
---

# Writing docs

Produce documentation that helps a specific reader complete a task or understand
a concrete part of the project. Treat factual accuracy, information design, and
sentence-level style as separate checks.

## Load the right context

Load only the context needed for the artifact:

1. Read the repository's agent and contributor instructions, such as
   `AGENTS.md`, `CLAUDE.md`, or `CONTRIBUTING.md`, for repository-wide rules.
2. For public documentation, find the project's documentation style guide and
   read it completely. Look for a style guide under `docs/`, a contributing
   section of the documentation site, or a link from the contributor
   instructions. When none exists, match the conventions of the surrounding
   pages and use [references/docs-practice.md](references/docs-practice.md) as
   the baseline.
3. Read [references/docs-practice.md](references/docs-practice.md) when creating
   or restructuring a page, changing a task path, reviewing accessibility or
   information architecture, or writing substantial examples.
4. Read [references/anti-slop.md](references/anti-slop.md) for prose-heavy
   revisions, de-slopping, or humanization. A small factual correction does not
   require loading it.
5. Read nearby pages of the same type to preserve established structure,
   terminology, frontmatter, imports, and documentation-framework components
   such as MDX components, shortcodes, or admonitions.
6. Inspect the implementation, types, tests, command help, or configuration that
   establishes every technical claim. Do not rely on memory when the repository
   can answer the question.
7. For changelog entries, changesets, or release-note fragments, first read the
   repository's instructions for them completely, such as a
   `.changeset/README.md` or the changelog section of the contributor guide.
   Treat the entry as public changelog documentation and review whether affected
   readers can recognize the surface, understand the observable effect, and act
   on any migration guidance. Frontmatter validity and technical accuracy do not
   make an unhelpful entry acceptable.

## Define the reader and outcome

State the intended outcome privately in one sentence: "After reading this, the
reader can ..." Use it to decide what belongs on the page.

Classify the document before choosing its structure:

| Document                    | Reader need                                  | Default shape                                                                                                  |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Tutorial                    | Learn through a reliable, guided experience  | Visible goal, prerequisites, one path, expected results after each stage, recap                                |
| Task guide                  | Complete one practical task                  | Outcome, prerequisites, ordered actions, result, optional next step                                            |
| Concept or explanation      | Build an accurate mental model               | Definition, relevant behavior, concrete example, implications                                                  |
| Reference                   | Look up exact behavior                       | Signature or syntax, parameters, defaults, return value, errors, examples                                      |
| Troubleshooting             | Diagnose and resolve a known failure         | Exact symptom, context, cause or diagnostic checks, workaround or resolution, verification                     |
| Upgrade or migration guide  | Make an existing project work after a change | Previous behavior, current behavior, required action, minimal diff                                             |
| README or contributor guide | Start or contribute quickly                  | Short purpose, fastest working path, common operations, deeper links                                           |
| Technical specification     | Evaluate and implement a decision            | Goal, constraints, decision, interfaces and data flow, failure handling, rollout, verification, open decisions |

Do not force every section into the same size. Give common or risky tasks more
space than incidental details.

## Draft for the task

- Lead with the reader's outcome. Move project history or implementation
  chronology to a page where it helps the reader make a decision.
- Use the words readers will search for in the title, introduction, headings,
  and exact error messages. Prefer specific labels to `Overview`,
  `Introduction`, or `Why it matters`.
- Use direct subject-verb-object sentences and precise nouns. Repeat the
  established name for a concept; synonyms can imply a second concept.
- Use imperative instructions for required actions. Reserve "can" for a genuine
  option and explain consequences when a choice matters.
- Put a condition before the action it governs so the reader knows whether the
  instruction applies before acting.
- Keep prerequisites explicit. Do not hide setup assumptions inside a later
  step.
- Prefer one realistic, working path over a menu of hypothetical choices. State
  the selection criteria before an opinionated example.
- Introduce code samples with what they accomplish. Label blocks that represent
  files with their filename, using the documentation framework's convention
  where one exists, such as a `title=` attribute.
- Keep code and output consistent with the current API. Include defaults,
  errors, permissions, and caveats when they affect successful use.
- Link to authoritative material for topics outside the project. Keep
  explanations focused on the project's own behavior.
- Keep one canonical explanation for recurring information and link to it. Do
  not duplicate commands, option lists, or procedures across pages when they can
  drift independently.
- Preserve valid frontmatter, imports, links, anchors, code-fence metadata, and
  component boundaries such as MDX while editing prose.

For public docs, describe how to use the project. Put internal design detail in
contributor or architecture documentation unless it changes a reader's decision.

## Run the anti-slop pass

For a prose-heavy revision, finish the content pass before polishing sentences.
Then inspect every changed paragraph using
[references/anti-slop.md](references/anti-slop.md). For a narrow factual
correction, apply the same judgment without loading or mechanically running the
full reference.

Ask of each sentence:

1. Is it stating information or staging a reveal?
2. Does it name the actor, behavior, and consequence precisely?
3. Does it add information the reader needs?
4. Does it preserve the source's meaning, uncertainty, and scope?

Remove chatbot residue, generic promotion, manufactured drama, self-grading,
process narration, diff-centered language, and empty transitions. Replace vague
emphasis with facts. Do not add anecdotes, measurements, opinions, dates,
citations, or guarantees merely to make prose sound more human.

Treat pattern lists as prompts for judgment, not lexical bans. Keep a contrast
when the reader is likely to hold the wrong model. Keep a hedge when evidence is
limited. Keep repeated terminology when it prevents ambiguity.

## Review the whole document

Read the finished page in order after reviewing the diff.

- Check that headings work as table-of-contents labels and use sentence case.
- Check that the introduction matches what the page actually delivers.
- Check that each step starts from the state produced by the previous step.
- Check that examples use the same names and assumptions throughout.
- Check links, filenames, commands, code, and stated outcomes against the
  repository.
- Search for the same feature, option, command, and old terminology across the
  documentation. Resolve contradictions by updating related claims or linking to
  the canonical page.
- Check that warnings explain the concrete risk and the action that avoids it.
- Check headings, links, images, tables, and instructions against the
  accessibility and global-audience rules in
  [references/docs-practice.md](references/docs-practice.md).
- Cut duplicated conclusions and paragraphs that only announce importance.

When asked for an audit only, report prioritized, concrete findings without
editing. Otherwise, make the edits and summarize only material changes.

## Verify

Run the narrowest checks that cover the changed artifact. Take the commands from
the repository rather than guessing them: look for recipes in a `justfile` or
`Makefile`, scripts in the package manifest, or the steps of the CI workflow.
Common checks are:

- the repository's Markdown or prose linter, scoped to the changed files where
  it allows;
- the documentation site build, when one exists;
- `git diff --check`, for whitespace errors.

Use the docs build for public docs, docs configuration, or shared content
consumed by that build; do not run it merely because another Markdown file
changed. Validate skill frontmatter and relative links when editing skills. Use
additional tests when code samples or generated reference material depend on
executable behavior.

If validation fails because a generated artifact is missing, such as built type
declarations or generated reference pages, run the build step that produces it
and retry. If validation still fails, compare the unmodified base before
attributing the failure to the current work, and report the result.
