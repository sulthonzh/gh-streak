#!/usr/bin/env node
const { ghAvailable, fetchContributions, aggregateByDay, formatText, formatJSON, formatMarkdown, parseArgs, HELP } = require("./index");

const opts = parseArgs(process.argv);
if (opts.help) { console.log(HELP); process.exit(0); }
if (!ghAvailable()) { console.error("Error: gh CLI not found. Install: https://cli.github.com"); process.exit(2); }

// Resolve user
let user = opts.user;
if (!user) {
  try {
    const { execSync } = require("child_process");
    user = execSync("gh api user --jq .login", { stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
  } catch { console.error("Error: could not detect GitHub user. Use --user"); process.exit(2); }
}

const events = fetchContributions(user);
const days = aggregateByDay(events);

switch (opts.format) {
  case "json": console.log(formatJSON(user, days)); break;
  case "markdown": console.log(formatMarkdown(user, days)); break;
  default: console.log(formatText(user, days));
}
