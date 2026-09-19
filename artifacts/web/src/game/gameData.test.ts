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

  it("gives beginners a forgiving opening route", () => {
    const secondLevel = GAME_LEVELS[1];
    expect(secondLevel.platforms[1]).toMatchObject({ x: 160, y: 400, w: 220 });
    expect(secondLevel.platforms[2]).toMatchObject({ x: 455, y: 335, w: 190 });
    expect(secondLevel.platforms[1].y - secondLevel.platforms[2].y).toBeLessThanOrEqual(70);
  });
});