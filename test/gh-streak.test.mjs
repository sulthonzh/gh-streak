import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcStreak, calcLongestStreak, totalContributions, heatLevel, formatText, formatJSON, formatMarkdown, parseArgs, HELP, aggregateByDay } from "../index.js";

describe("calcStreak", () => {
  it("returns 0 for empty", () => {
    assert.equal(calcStreak([]), 0);
  });
  it("counts consecutive days from today", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDays = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    assert.equal(calcStreak([{ date: today, count: 1 }, { date: yesterday, count: 2 }, { date: twoDays, count: 1 }]), 3);
  });
  it("handles gap in streak", () => {
    const today = new Date().toISOString().split("T")[0];
    const twoDays = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    assert.equal(calcStreak([{ date: today, count: 1 }, { date: twoDays, count: 1 }]), 1);
  });
});

describe("calcLongestStreak", () => {
  it("returns 0 for empty", () => {
    assert.equal(calcLongestStreak([]), 0);
  });
  it("finds longest consecutive run", () => {
    const days = [
      { date: "2026-06-01", count: 1 },
      { date: "2026-06-02", count: 1 },
      { date: "2026-06-03", count: 1 },
      { date: "2026-06-05", count: 1 },
    ];
    assert.equal(calcLongestStreak(days), 3);
  });
});

describe("totalContributions", () => {
  it("sums counts", () => {
    assert.equal(totalContributions([{ date: "2026-06-01", count: 3 }, { date: "2026-06-02", count: 5 }]), 8);
  });
  it("returns 0 for empty", () => {
    assert.equal(totalContributions([]), 0);
  });
});

describe("heatLevel", () => {
  it("returns space for 0", () => assert.equal(heatLevel(0), " "));
  it("returns ░ for 1-2", () => assert.equal(heatLevel(2), "░"));
  it("returns ▒ for 3-5", () => assert.equal(heatLevel(4), "▒"));
  it("returns ▓ for 6-9", () => assert.equal(heatLevel(8), "▓"));
  it("returns █ for 10+", () => assert.equal(heatLevel(15), "█"));
});

describe("formatText", () => {
  it("includes streak info", () => {
    const out = formatText("testuser", [{ date: new Date().toISOString().split("T")[0], count: 5 }]);
    assert.ok(out.includes("testuser"));
    assert.ok(out.includes("Current streak"));
  });
  it("shows 0 streak for empty", () => {
    const out = formatText("testuser", []);
    assert.ok(out.includes("0 days"));
  });
});

describe("formatJSON", () => {
  it("produces valid JSON", () => {
    const raw = formatJSON("testuser", [{ date: "2026-06-01", count: 3 }]);
    const obj = JSON.parse(raw);
    assert.equal(obj.user, "testuser");
    assert.equal(obj.totalContributions, 3);
  });
  it("includes streak data", () => {
    const raw = formatJSON("testuser", []);
    const obj = JSON.parse(raw);
    assert.ok("currentStreak" in obj);
    assert.ok("longestStreak" in obj);
  });
});

describe("formatMarkdown", () => {
  it("includes markdown table", () => {
    const out = formatMarkdown("testuser", [{ date: "2026-06-01", count: 3 }]);
    assert.ok(out.includes("| Metric |"));
    assert.ok(out.includes("testuser"));
  });
  it("shows recent activity when present", () => {
    const out = formatMarkdown("testuser", [{ date: "2026-06-01", count: 3 }]);
    assert.ok(out.includes("Recent Activity"));
  });
});

describe("parseArgs", () => {
  it("defaults to text format", () => {
    assert.equal(parseArgs(["node", "cli.js"]).format, "text");
  });
  it("parses --json", () => {
    assert.equal(parseArgs(["node", "cli.js", "--json"]).format, "json");
  });
  it("parses --markdown", () => {
    assert.equal(parseArgs(["node", "cli.js", "--markdown"]).format, "markdown");
  });
  it("parses --user", () => {
    assert.equal(parseArgs(["node", "cli.js", "--user", "octocat"]).user, "octocat");
  });
  it("parses --days", () => {
    assert.equal(parseArgs(["node", "cli.js", "--days", "30"]).days, 30);
  });
  it("parses --help", () => {
    assert.equal(parseArgs(["node", "cli.js", "--help"]).help, true);
  });
});

describe("HELP", () => {
  it("contains usage info", () => {
    assert.ok(HELP.includes("gh-streak"));
    assert.ok(HELP.includes("--user"));
  });
});

describe("aggregateByDay", () => {
  it("groups events by date", () => {
    const result = aggregateByDay([
      { date: "2026-06-01", type: "PushEvent" },
      { date: "2026-06-01", type: "PushEvent" },
      { date: "2026-06-02", type: "PushEvent" },
    ]);
    assert.equal(result.length, 2);
    assert.equal(result.find(d => d.date === "2026-06-01").count, 2);
    assert.equal(result.find(d => d.date === "2026-06-02").count, 1);
  });
  it("returns sorted descending", () => {
    const result = aggregateByDay([
      { date: "2026-06-01", type: "a" },
      { date: "2026-06-03", type: "b" },
      { date: "2026-06-02", type: "c" },
    ]);
    assert.equal(result[0].date, "2026-06-03");
    assert.equal(result[2].date, "2026-06-01");
  });
});
