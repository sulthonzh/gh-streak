const { execSync } = require("child_process");

function ghAvailable() {
  try { execSync("gh --version", { stdio: "pipe" }); return true; } catch { return false; }
}

function fetchContributions(user) {
  const events = [];
  try {
    const raw = execSync(
      `gh api "users/${user}/events?per_page=100" --jq '.[] | .created_at + " " + .type'`,
      { stdio: ["pipe", "pipe", "pipe"], timeout: 30000 }
    ).toString().trim();
    if (!raw) return [];
    for (const line of raw.split("\n")) {
      const m = line.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) events.push({ date: m[1], type: line.split(" ")[1] || "" });
    }
  } catch { return []; }
  return events;
}

function aggregateByDay(events) {
  const map = {};
  for (const e of events) {
    map[e.date] = (map[e.date] || 0) + 1;
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([date, count]) => ({ date, count }));
}

function calcStreak(days) {
  let streak = 0;
  const today = new Date();
  const byDate = new Map(days.map(d => [d.date, d]));
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (byDate.has(ds)) { streak++; }
    else if (i === 0) { continue; } // today might not have contributions yet
    else { break; }
  }
  return streak;
}

function calcLongestStreak(days) {
  if (!days.length) return 0;
  const dateSet = new Set(days.map(d => d.date));
  const sorted = [...dateSet].sort();
  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else { current = 1; }
  }
  return longest;
}

function totalContributions(days) {
  return days.reduce((s, d) => s + d.count, 0);
}

function heatLevel(count) {
  if (count === 0) return " ";
  if (count <= 2) return "░";
  if (count <= 5) return "▒";
  if (count <= 9) return "▓";
  return "█";
}

function formatText(user, days, opts = {}) {
  const streak = calcStreak(days);
  const longest = calcLongestStreak(days);
  const total = totalContributions(days);
  const lines = [];
  lines.push(`  ${user} — GitHub Contribution Stats`);
  lines.push(`  ─────────────────────────────────`);
  lines.push(`  Current streak:  ${streak} day${streak !== 1 ? "s" : ""} ${streak >= 7 ? "🔥" : ""}`);
  lines.push(`  Longest streak:  ${longest} day${longest !== 1 ? "s" : ""}`);
  lines.push(`  Total contribs:  ${total} (last 100 events)`);
  lines.push(`  Active days:     ${days.length}`);
  lines.push("");

  if (days.length) {
    lines.push(`  Last 14 days:`);
    const today = new Date();
    const byDate = new Map(days.map(d => [d.date, d]));
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const found = byDate.get(ds);
      const bar = found ? "█".repeat(Math.min(found.count, 20)) : "·";
      const label = found ? String(found.count).padStart(3) : "  0";
      lines.push(`  ${ds}  ${bar} ${label}`);
    }
  }
  return lines.join("\n");
}

function formatJSON(user, days) {
  return JSON.stringify({
    user,
    currentStreak: calcStreak(days),
    longestStreak: calcLongestStreak(days),
    totalContributions: totalContributions(days),
    activeDays: days.length,
    days: days.map(d => ({ date: d.date, count: d.count })),
  }, null, 2);
}

function formatMarkdown(user, days) {
  const streak = calcStreak(days);
  const longest = calcLongestStreak(days);
  const total = totalContributions(days);
  const lines = [];
  lines.push(`# ${user} — GitHub Contribution Stats`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Current streak | ${streak} day${streak !== 1 ? "s" : ""} |`);
  lines.push(`| Longest streak | ${longest} day${longest !== 1 ? "s" : ""} |`);
  lines.push(`| Total contributions | ${total} |`);
  lines.push(`| Active days | ${days.length} |`);
  lines.push("");
  if (days.length) {
    lines.push(`## Recent Activity`);
    lines.push("");
    lines.push(`| Date | Contributions |`);
    lines.push(`|------|---------------|`);
    for (const d of days.slice(0, 14)) {
      lines.push(`| ${d.date} | ${d.count} |`);
    }
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { user: "", format: "text", days: 365 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--user" && args[i + 1]) { opts.user = args[++i]; }
    else if (args[i] === "--json") { opts.format = "json"; }
    else if (args[i] === "--markdown") { opts.format = "markdown"; }
    else if (args[i] === "--days" && args[i + 1]) { opts.days = parseInt(args[++i], 10); }
    else if (args[i] === "--help" || args[i] === "-h") { opts.help = true; }
  }
  return opts;
}

const HELP = `
gh-streak — Track your GitHub contribution streak

Usage:
  gh-streak              Show your streak stats
  gh-streak --user octocat   Check someone else's streak
  gh-streak --json       JSON output
  gh-streak --markdown   Markdown output
  gh-streak --days 90    Look back N days (default 365)

Requires: gh CLI authenticated
`;

module.exports = { ghAvailable, fetchContributions, aggregateByDay, calcStreak, calcLongestStreak, totalContributions, heatLevel, formatText, formatJSON, formatMarkdown, parseArgs, HELP };
