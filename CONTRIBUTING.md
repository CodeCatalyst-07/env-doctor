# Contributing to env-doctor

Thanks for considering a contribution! This is a small, focused package — please keep PRs small and focused too.

## Setup

```bash
git clone https://github.com/CodeCatalyst-07/env-doctor.git
cd env-doctor
npm install
```

## Running tests

```bash
npm test
```

Uses Node's built-in test runner (`node --test`) — no extra dependency needed.

## Making changes

1. Create a branch: `git checkout -b my-change`
2. Add/update tests in `test/` for any behavior change
3. Update `README.md` if you change the public API
4. Make sure `npm test` passes
5. Open a pull request describing what changed and why

## Reporting bugs

Please open an issue with:
- The schema you used
- The input that triggered the problem
- What you expected vs. what happened
