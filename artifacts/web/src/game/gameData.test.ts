import { describe, expect, it } from "vitest";
import { GAME_LEVELS, validateLevelReachability } from "./gameData";

describe("The Ashen Crossing level data", () => {
  it("keeps every platform, relic, and goal reachable", () => {
    const failures = GAME_LEVELS.flatMap((level, index) => {
      const report = validateLevelReachability(level);
      return report.reachable
        ? []
        : [{
            level: index + 1,
            name: level.name,
            ...report,
          }];
    });

    expect(failures).toEqual([]);
  });

  it("does not reuse a platform layout", () => {
    const signatures = GAME_LEVELS.map((level) =>
      level.platforms
        .slice(1)
        .map((platform) => `${platform.x}:${platform.y}:${platform.w}`)
        .join("|"),
    );

    expect(new Set(signatures).size).toBe(GAME_LEVELS.length);
  });

  it("keeps goals inside their worlds and beyond the starting area", () => {
    for (const level of GAME_LEVELS) {
      expect(level.goalX).toBeGreaterThan(900);
      expect(level.goalX).toBeLessThan(level.width);
    }
  });
});