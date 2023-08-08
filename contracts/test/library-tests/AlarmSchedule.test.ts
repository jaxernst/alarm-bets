import { expect } from "chai";
import { deployTyped } from "../helpers/deploy";
import {
  DAY,
  HOUR,
  MINUTE,
  SECOND,
  WEEK,
  currentTimestamp,
  dayOfWeek,
  timeOfDay,
} from "../helpers/time";
import { advanceTime } from "../helpers/providerUtils";
import { AlarmScheduleMock } from "../../typechain-types";
import { getRandomDays } from "../helpers/random";

describe("Alarm Schedule Test", () => {
  let schedule: AlarmScheduleMock;
  let blockTime: number;

  beforeEach(async () => {
    schedule = await deployTyped<AlarmScheduleMock>("AlarmScheduleMock");
  });

  it("Can only be initialized with a valid time of day and days array", async () => {
    await expect(schedule.init(86399, [1], 60, 0)).to.not.reverted;
    await expect(schedule.init(500, [1], 60, 0)).to.not.reverted;
    await expect(schedule.init(86400, [1], 60, 0)).to.revertedWith(
      "INVALID_ALARM_TIME"
    );

    await expect(schedule.init(1, [1], 60, 0)).to.not.reverted;
    await expect(schedule.init(1, [7], 60, 0)).to.not.reverted;
    await expect(schedule.init(1, [], 60, 0)).to.revertedWith("INVALID_DAYS");
    await expect(schedule.init(1, [0], 60, 0)).to.revertedWith("INVALID_DAYS");
    await expect(
      schedule.init(1, [1, 2, 3, 4, 5, 6, 7, 8], 60, 0)
    ).to.revertedWith("INVALID_DAYS");
    await expect(
      schedule.init(1, [1, 2, 4, 3, 5, 6, 7], 60, 0)
    ).to.revertedWith("INVALID_DAYS");
    await expect(schedule.init(1, [1, 2, 3, 4, 5, 6, 7], 60, 0)).to.not
      .reverted;
  });

  it("Reports 0 entries when initialized", async () => {
    await (await schedule.init(1, [1], 60, 0)).wait();
    expect(await schedule.entries()).to.equal(0);
  });

  describe("recordEntry()", () => {
    let curTimeOfDay: number;
    let weekDay: number;

    beforeEach(async () => {
      blockTime = (await currentTimestamp()).toNumber();
      curTimeOfDay = timeOfDay(blockTime);
      weekDay = dayOfWeek(blockTime);
    });

    it("Only allows entries to be recorded when the block time is within submission window of an alarm time", async () => {
      // Init an alarm that will be due in 60 seconds (30 second submission window)
      await (
        await schedule.init(
          curTimeOfDay + 60,
          [weekDay, (weekDay % 7) + 1].sort(),
          30,
          0
        )
      ).wait();

      await expect(schedule.recordEntry()).to.revertedWith(
        "NOT_IN_SUBMISSION_WINDOW"
      );
      await advanceTime(30);
      await expect(schedule.recordEntry()).to.not.reverted;
      expect(await schedule.entries()).to.equal(1);
    });

    it("Prevents duplicate entries", async () => {
      await (
        await schedule.init(
          curTimeOfDay + 60,
          [weekDay, (weekDay % 7) + 1].sort(),
          60,
          0
        )
      ).wait();

      await expect(schedule.recordEntry()).to.not.reverted;
      await expect(schedule.recordEntry()).to.revertedWith(
        "ALREADY_SUBMITTED_TODAY"
      );
      expect(await schedule.entries()).to.equal(1);
      expect(await schedule.missedDeadlines()).to.equal(0);
    });

    it("Will not accept an entry on the same initialization day if alarm time has passed", async () => {
      const missedBySeconds = 60;

      await (
        await schedule.init(
          curTimeOfDay - missedBySeconds,
          [weekDay, (weekDay % 7) + 1].sort(),
          60,
          0
        )
      ).wait();

      await expect(schedule.recordEntry()).to.revertedWith(
        "NOT_IN_SUBMISSION_WINDOW"
      );
      expect(await schedule.entries()).to.equal(0);
      expect(await schedule.missedDeadlines()).to.equal(0);

      // Advance time by a little less than a week
      await advanceTime(WEEK - (missedBySeconds + 10));
      await expect(schedule.recordEntry()).to.not.reverted;
      expect(await schedule.entries()).to.equal(1);
    });

    it("Allows entries to be recorded when making a same day alarm within the submission window", async () => {
      await schedule.init(curTimeOfDay + 60, [1, 2, 3, 4, 5, 6, 7], 5000, 0);
      await schedule.recordEntry();
      await advanceTime(70);
      expect(await schedule.entries()).to.equal(1);
    });
  });

  describe("missedDeadlines()", () => {
    beforeEach(async () => {
      blockTime = (await currentTimestamp()).toNumber();
    });

    for (let offset of [-11, 0, 3, 10]) {
      it(
        "Returns 0 before the first alarm deadline" + ` (offset: ${offset}hrs)`,
        async () => {
          const currentDay = dayOfWeek(blockTime, offset);
          const curTimeOfDay = timeOfDay(blockTime, offset);
          await schedule.init(
            curTimeOfDay - 60,
            [currentDay, (currentDay % 7) + 1].sort(),
            60,
            offset * HOUR
          );

          expect(await schedule.missedDeadlines()).to.equal(0);
          await advanceTime(1 * DAY - 70);
          expect(await schedule.missedDeadlines()).to.equal(0);
        }
      );
      it(
        "(after deadline) Returns 1 if a single deadline is missed" +
          ` (offset: ${offset}hrs)`,
        async () => {
          const curTimeOfDay = timeOfDay(blockTime, offset);
          await schedule.init(
            curTimeOfDay + 3 * MINUTE,
            [1, 2, 3, 4, 5, 6, 7],
            60,
            offset * HOUR
          );

          await advanceTime(4 * MINUTE);
          expect(await schedule.missedDeadlines()).to.equal(1);
        }
      );
      it(
        "(after deadline) Returns 0 if a confirmation was submitted within the window" +
          ` (offset: ${offset}hrs)`,
        async () => {}
      );

      /**
       * Repeat this test case several times with an alarm on random days
       */
      for (let _ in [...Array(4)]) {
        const alarmDays = getRandomDays();

        it(`Returns the expected number of missed deadlines after several weeks. Days: ${alarmDays} TZ: ${offset}hrs`, async () => {
          const curTimeOfDay = timeOfDay(blockTime, offset);
          await schedule.init(curTimeOfDay + 60, alarmDays, 60, offset * HOUR);
          expect(await schedule.missedDeadlines()).to.equal(0);

          let expectedDeadlines = 0;

          for (let _ in [...Array(45)]) {
            let curDay = dayOfWeek(blockTime, offset);
            curDay = (curDay % 7) + 1;

            if (alarmDays.includes(curDay)) {
              // Random chance to submit the alarm on time
              if (Math.random() > 0.5) {
                await schedule.recordEntry();
                await advanceTime(1 * DAY - 1 * SECOND);
              } else {
                // Expect a missed deadline if the alarm was missed
                expectedDeadlines++;
                await advanceTime(1 * DAY);
              }
            }
          }

          expect(await schedule.missedDeadlines()).to.equal(expectedDeadlines);
        });
      }
    }
  });

  describe("nextAlarmTime()", () => {
    beforeEach(async () => {
      blockTime = (await currentTimestamp()).toNumber();
    });

    for (let offset of [0, 6, -6]) {
      it(
        "Returns the next alarm time with a same day alarm (before alarm time)" +
          ` (offset: ${offset}hrs)`,
        async () => {
          const currentDay = dayOfWeek(blockTime, offset);
          const curTimeOfDay = timeOfDay(blockTime, offset);
          await schedule.init(
            curTimeOfDay + 60,
            [currentDay],
            60,
            offset * HOUR
          );
          expect(await schedule._dayOfWeek(offset * HOUR)).to.equal(currentDay);
          expect(await schedule.timeToNextDeadline()).to.approximately(60, 3);
        }
      );
      it(
        "Returns the next alarm time for the next day" +
          ` offset: ${offset}hrs`,
        async () => {
          const currentDay = dayOfWeek(blockTime, offset);
          const curTimeOfDay = timeOfDay(blockTime, offset);
          await schedule.init(
            curTimeOfDay - 60,
            [currentDay, (currentDay % 7) + 1].sort(),
            60,
            offset * HOUR
          );

          expect(await schedule.timeToNextDeadline()).to.approximately(
            1 * DAY - 60,
            3
          );
        }
      );
      it(
        "Returns the next alarm time for a single day alarm schedule" +
          ` offset: ${offset}hrs`,
        async () => {
          const currentDay = dayOfWeek(blockTime, offset);
          const curTimeOfDay = timeOfDay(blockTime, offset);
          await schedule.init(
            curTimeOfDay + 60,
            [currentDay],
            60,
            offset * HOUR
          );

          expect(await schedule.timeToNextDeadline()).to.approximately(60, 3);
          await advanceTime(70);
          expect(await schedule.timeToNextDeadline()).to.approximately(
            1 * WEEK - 10,
            4
          );
        }
      );
      it(
        "Returns the next alarm time on the next week" +
          ` offset: ${offset / HOUR}hrs`,
        async () => {}
      );
    }

    it("Returns correct time when local timezone offset is used", async () => {
      const localOffset = Math.floor(-new Date().getTimezoneOffset() / 60);
      const currentDay = dayOfWeek(blockTime, localOffset);
      const curTimeOfDay = timeOfDay(blockTime, localOffset);
      const expTimeTilNext = 4 * HOUR;
      await schedule.init(
        (curTimeOfDay + expTimeTilNext) % DAY,
        [currentDay, (currentDay % 7) + 1].sort(),
        60,
        localOffset * HOUR
      );

      expect(await schedule.timeToNextDeadline()).to.approximately(
        expTimeTilNext,
        3
      );
    });

    describe("_nextAlarmDay", async () => {
      beforeEach(async () => {
        schedule = await deployTyped<AlarmScheduleMock>("AlarmScheduleMock");
      });

      it("TC1", async () => {
        await schedule.init(DAY / 2, [1, 5, 6], 60, 0);

        expect(await schedule._nextAlarmDay(5)).to.equal(6);
        expect(await schedule._nextAlarmDay(2)).to.equal(5);
        expect(await schedule._nextAlarmDay(6)).to.equal(1);
      });
      it("TC2", async () => {
        await schedule.init(DAY / 2, [1, 3, 5, 7], 60, 0);

        expect(await schedule._nextAlarmDay(6)).to.equal(7);
        expect(await schedule._nextAlarmDay(4)).to.equal(5);
        expect(await schedule._nextAlarmDay(5)).to.equal(7);
        expect(await schedule._nextAlarmDay(7)).to.equal(1);
        expect(await schedule._nextAlarmDay(2)).to.equal(3);
      });
      it("TC3", async () => {
        await schedule.init(DAY / 2, [1, 7], 60, 0);

        expect(await schedule._nextAlarmDay(1)).to.equal(7);
        expect(await schedule._nextAlarmDay(7)).to.equal(1);
        expect(await schedule._nextAlarmDay(2)).to.equal(7);
      });
    });
  });
});
