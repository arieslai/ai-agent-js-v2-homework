---
name: write-homework-readme
description: Write or update root and per-homework README files for this repository using its existing documentation split, homework evidence style, and real runnable commands.
---

# Write README files for this homework repository

Use this skill when asked to create, rewrite, or reorganize README files in this repository.

## Goal

Produce README content that matches the repository's actual documentation structure:

- Root `README.md` is a repository overview and index
- Each implemented homework should have its own detailed README inside its homework folder, such as `src/homework-01-role-chatbot/README.md`

Do not collapse everything into the root README unless the user explicitly asks for a single-file submission format.

## Repository-specific rules

### 1. Decide which README should hold which content

Use `docs/plan.md` and the current README files as the source of truth for the split:

- Root `README.md`
  - short repository overview
  - which homeworks are implemented
  - where to find each homework's detailed README
  - basic setup and run commands
- Homework README, for example `src/homework-01-role-chatbot/README.md`
  - assignment title
  - implementation summary
  - homework-specific run instructions
  - acceptance evidence
  - transcripts, screenshots, or test results

When adding a new homework README, update the root README to link to it.

### 2. Use only real commands and current project behavior

Read `package.json` before documenting commands.

Current repository behavior:

- install dependencies with `npm install`
- run homework 1 with `npm run hw1`
- scripts for `hw2` to `hw5` may exist before the implementation exists
- `npm test` exists, but currently fails because `test/` is not committed yet

Do not invent `build`, `lint`, or test workflows that are not present.

### 3. Keep README claims backed by repository artifacts

Before writing test or transcript sections, verify the source material:

- use actual JSON transcripts, screenshots, or command output
- prefer transcript files stored inside the homework folder when available
- do not fabricate dialogue, results, or acceptance evidence

If the homework depends on a saved transcript, cite the actual file path in the README.

### 4. Preserve the repo's homework organization

This repository uses:

- a single root `package.json`
- homework-specific directories under `src/homework-0X-*`
- shared modules under `src/shared/`

README content should reflect that structure. Keep shared architecture notes in the root README or Copilot instructions, and keep assignment evidence in the homework README.

### 5. Respect environment variable conventions

Use `.env.example` as the canonical environment variable reference.

- real secrets belong in `.env`
- never place real keys in README examples
- mention only the variables actually needed for the homework being documented

## Workflow

1. Read the current root `README.md`, the homework README if it exists, `package.json`, and any homework transcript or result files.
2. Check `docs/plan.md` if the request involves documentation structure or where content should live.
3. Decide whether the task is:
   - root README only
   - homework README only
   - both root and homework README
4. Write concise, evidence-based content.
5. If you create or rename transcript files, update all README references to match.

## Preferred section structure

### Root `README.md`

Use a lightweight structure like:

- repository title
- short description
- implemented homeworks
- project structure
- setup and run commands
- environment variables note

### Homework README

Use a detailed structure like:

- assignment title
- implementation summary
- relevant files
- run instructions
- role / tool / architecture details specific to the homework
- transcript or test evidence
- acceptance checklist

## Homework 1 pattern

For `src/homework-01-role-chatbot/`, preserve these ideas when updating its README:

- describe the persona and tone
- mention that the CLI loop uses `@inquirer/prompts`
- mention that conversation history is persisted with `lowdb`
- mention that prior messages are replayed into the OpenAI Responses API each turn for memory
- include a real multi-turn transcript and highlight the turn that demonstrates memory

## Quality bar

Good README updates in this repository are:

- specific to the implemented homework
- aligned with the actual file layout
- based on verified commands and artifacts
- short in the root README and detailed in the homework README
