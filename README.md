# gh-streak

Track your GitHub contribution streak and stats right from the terminal.

Uses the `gh` CLI — no API tokens needed, just your existing GitHub auth.

## Why

GitHub shows contribution graphs on profiles, but there's no quick way to see your streak stats from the terminal. `gh-streak` gives you current streak, longest streak, and a daily breakdown without leaving your shell.

## Install

```bash
npm install -g gh-streak
```

Requires [gh CLI](https://cli.github.com) authenticated (`gh auth login`).

## Usage

```bash
# Your streak
gh-streak

# Someone else's streak
gh-streak --user octocat

# JSON output
gh-streak --json

# Markdown output
gh-streak --markdown

# Look back N days (default 365)
gh-streak --days 90
```

## Output

```
  sulthonzh — GitHub Contribution Stats
  ─────────────────────────────────
  Current streak:  12 days 🔥
  Longest streak:  28 days
  Total contribs:  147 (last 100 events)
  Active days:     34

  Last 14 days:
  2026-06-10  ███  3
  2026-06-09  ██████████ 10
  2026-06-08  ████  4
  2026-06-07  ·    0
  ...
```

## As a Module

```js
const { fetchContributions, aggregateByDay, calcStreak, formatText } = require("gh-streak");

const events = fetchContributions("octocat");
const days = aggregateByDay(events);
console.log(`Streak: ${calcStreak(days)} days`);
```

## License

MIT
