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

  it("makes every level a four-section journey with its own backdrop seed", () => {
    expect(GAME_LEVELS.every((level) => level.width >= 9600)).toBe(true);
    expect(new Set(GAME_LEVELS.map((level) => level.backgroundSeed)).size).toBe(GAME_LEVELS.length);
    expect(GAME_LEVELS.every((level) => level.backgroundStyle !== undefined)).toBe(true);
  });

  it("gives every level an aerial threat and more than one hazard language", () => {
    for (const level of GAME_LEVELS) {
      expect(level.enemies.some((enemy) => enemy.kind === "flying")).toBe(true);
      expect(new Set(level.hazards.map((hazard) => hazard.kind)).size).toBeGreaterThanOrEqual(2);
    }
  });
});