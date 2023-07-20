import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { createAlarm, encodeCreationParams } from "../lib/commitmentCreation";
import { SocialAlarmClockHub, PartnerAlarmClock } from "../typechain-types";
import { deployTyped } from "./helpers/deploy";
import { advanceTime } from "./helpers/providerUtils";
import {
  DAY,
  HOUR,
  MINUTE,
  WEEK,
  currentTimestamp,
  dayOfWeek,
  timeOfDay,
} from "./helpers/time";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish } from "ethers";
import { AlarmStatus, alarmTypeVals } from "../lib/types";
import { ZERO_ADDRESS } from "./helpers/constants";

describe("Partner Alarm Clock spec", () => {
  let hub: SocialAlarmClockHub;
  let alarm: PartnerAlarmClock;
  let blockTime: number;
  let p1: SignerWithAddress;
  let p2: SignerWithAddress;

  // Defaults
  const DEF_INITIAL_DEPOSIT = parseEther("1");
  const DEF_PENALTY = parseEther("0.1");
  const DEF_SUBMISSION_WINDOW = 30; // seconds

  const initAlarm = async ({
    alarmTime,
    alarmDays,
    initDeposit,
  }: {
    alarmTime?: BigNumberish;
    alarmDays?: number[];
    initDeposit?: BigNumber;
  }) => {
    return await createAlarm(
      hub,
      "PartnerAlarmClock",
      {
        alarmTime: alarmTime ?? 0,
        alarmDays: alarmDays ?? [1, 2, 3, 4, 5, 6, 7],
        missedAlarmPenalty: DEF_PENALTY,
        submissionWindow: DEF_SUBMISSION_WINDOW,
        player1TimezoneOffset: 0,
        player1: p1.address,
        player2: p2.address,
      },
      initDeposit ?? DEF_INITIAL_DEPOSIT
    );
  };

  before(async () => {
    hub = await deployTyped<SocialAlarmClockHub>("SocialAlarmClockHub");
  });

  beforeEach(async () => {
    [p1, p2] = await ethers.getSigners();
    blockTime = (await currentTimestamp()).toNumber();
  });

  describe("Alarm Creation", () => {
    it("Sets alarm constants as defined in the initialization data", async () => {
      const alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: 0,
          alarmDays: [7],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: DEF_SUBMISSION_WINDOW,
          player1TimezoneOffset: 11 * HOUR,
          player1: p1.address,
          player2: p2.address,
        },
        parseEther("0.2")
      );

      expect(await alarm.alarmTime()).to.eq(0);
      expect((await alarm.alarmDays())[0]).to.eq(7);
      expect(await alarm.missedAlarmPenalty()).to.eq(parseEther("0.1"));
      expect(await alarm.submissionWindow()).to.eq(DEF_SUBMISSION_WINDOW);
      expect(await alarm.playerTimezone(p1.address)).to.eq(11 * HOUR);
      expect(await alarm.player1()).to.eq(p1.address);
      expect(await alarm.player2()).to.eq(p2.address);
    });

    it("Marks the alarm as inactive when created (while waiting for the other player to start)", async () => {
      alarm = await initAlarm({});
      expect(await alarm.status()).to.equal(AlarmStatus.INACTIVE);
    });

    it("Requires both players to deposit the specified amount of collateral", async () => {
      alarm = await initAlarm({});
      await expect(
        alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT.sub(1) })
      ).to.be.revertedWith("INSUFFICIENT_FUNDS_SENT");
    });

    it("Starts the alarm when the other player joins", async () => {
      alarm = await initAlarm({});
      await alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT });
      expect(await alarm.status()).to.equal(AlarmStatus.ACTIVE);
    });

    it("Cannot be restarted after starting and withdrawing (cancelling)", async () => {
      alarm = await initAlarm({});
      await alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT });
      await alarm.withdraw();
      await expect(
        alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT })
      ).to.be.revertedWith("ALREADY_STARTED");
    });

    it("Allows each player to set their own timezone (only once) on whole hour increments", async () => {
      const alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: 0,
          alarmDays: [7],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: DEF_SUBMISSION_WINDOW,
          player1TimezoneOffset: -4 * HOUR,
          player1: p1.address,
          player2: p2.address,
        },
        parseEther("0.2")
      );

      await expect(
        alarm.connect(p2).start(4321, { value: DEF_INITIAL_DEPOSIT })
      ).to.be.revertedWith("INVALID_TIMEZONE_OFFSET");

      await alarm.connect(p2).start(2 * HOUR, { value: DEF_INITIAL_DEPOSIT });
      expect(await alarm.playerTimezone(p1.address)).to.eq(-4 * HOUR);
      expect(await alarm.playerTimezone(p2.address)).to.eq(2 * HOUR);
    });

    it("Can only be started by the specified other player (player2)", async () => {
      alarm = await initAlarm({});
      await expect(
        alarm.connect(p1).start(0, { value: DEF_INITIAL_DEPOSIT })
      ).to.be.revertedWith("ONLY_PLAYER_2_CAN_START");
    });
  });

  describe("Alarm Enforcement", () => {
    it("Cannot record entries or view missed deadlines until started", async () => {
      const alarm = await initAlarm({});
      await expect(alarm.connect(p1).submitConfirmation()).to.be.revertedWith(
        "NOT_STARTED"
      );
      await expect(alarm.connect(p2).submitConfirmation()).to.be.revertedWith(
        "NOT_STARTED"
      );

      await expect(alarm.missedDeadlines(p1.address)).to.be.revertedWith(
        "NOT_STARTED"
      );
      await expect(alarm.missedDeadlines(p2.address)).to.be.revertedWith(
        "NOT_STARTED"
      );
    });
    it("Allows entries (wakeup confirmations) to be recorded only while in the submission window", async () => {
      alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: timeOfDay(blockTime) + DEF_SUBMISSION_WINDOW + 5, // Susceptible to wraparound issue
          alarmDays: [1, 2, 3, 4, 5, 6, 7],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: DEF_SUBMISSION_WINDOW,
          player1TimezoneOffset: 0,
          player1: p1.address,
          player2: p2.address,
        },
        DEF_INITIAL_DEPOSIT
      );
      await alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT });

      await expect(alarm.submitConfirmation()).to.be.reverted;
      await advanceTime(DEF_SUBMISSION_WINDOW / 2);
      await expect(alarm.submitConfirmation()).not.to.be.reverted;

      await advanceTime(DEF_SUBMISSION_WINDOW);
      await expect(alarm.submitConfirmation()).to.be.reverted;
    });
    it("Returns the time until the next alarm is due (0 offset)", async () => {
      const curTime = timeOfDay(blockTime);
      const curDay = dayOfWeek(blockTime);

      const alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: curTime + 60,
          alarmDays: [curDay],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: DEF_SUBMISSION_WINDOW,
          player1TimezoneOffset: 0,
          player1: p1.address,
          player2: p2.address,
        },
        DEF_INITIAL_DEPOSIT
      );

      await alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT });

      const resultP1 = await alarm.timeToNextDeadline(p1.address);
      const resultP2 = await alarm.timeToNextDeadline(p2.address);
      expect(resultP1).to.approximately(60, 3);
      expect(resultP2).to.approximately(60, 3);
    });
    it("Returns the time until the next alarm is due (local tz offset)", async () => {
      const localOffsetHrs = new Date().getTimezoneOffset() / -60;
      const curTime = timeOfDay(blockTime, localOffsetHrs);
      const curDay = dayOfWeek(blockTime, localOffsetHrs);
      const alarmTime = curTime + 60;
      const offset = localOffsetHrs * HOUR;
      const alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: alarmTime,
          alarmDays: [curDay, curDay + 1],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: DEF_SUBMISSION_WINDOW,
          player1TimezoneOffset: offset,
          player1: p1.address,
          player2: p2.address,
        },
        DEF_INITIAL_DEPOSIT
      );

      await alarm.connect(p2).start(offset, { value: DEF_INITIAL_DEPOSIT });

      const resultP1 = await alarm.timeToNextDeadline(p1.address);
      const resultP2 = await alarm.timeToNextDeadline(p2.address);
      expect(resultP1).to.approximately(60, 3);
      expect(resultP2).to.approximately(60, 3);

      // Advance time to the next day
      await advanceTime(60 * 60 * 20);
      const blockTime2 = (await currentTimestamp()).toNumber();
      const curTime2 = timeOfDay(blockTime2, localOffsetHrs);
      expect(curTime2).to.approximately((curTime + HOUR * 20) % DAY, 5);

      const result2P1 = await alarm.timeToNextDeadline(p1.address);
      const result2P2 = await alarm.timeToNextDeadline(p2.address);
      expect(result2P1).to.approximately(alarmTime - curTime2, 3);
      expect(result2P2).to.approximately(alarmTime - curTime2, 3);
    });
    it("Records and penalizes missed deadlines when either player misses an alarm", async () => {
      // First case: p1 submits, p2 doesn't
      let p1Alarm = await initAlarm({
        alarmTime: timeOfDay(blockTime + 30),
        alarmDays: [dayOfWeek(blockTime + 30)],
      });
      let p2Alarm = p1Alarm.connect(p2);

      await p2Alarm.start(0, { value: DEF_INITIAL_DEPOSIT });
      await p1Alarm.submitConfirmation(); // P1 submit confirmation

      await advanceTime(1 * MINUTE);
      expect(await alarm.missedDeadlines(p2.address)).to.equal(1);
      await expect(alarm.withdraw()).to.changeEtherBalances(
        [p1.address, p2.address],
        [
          DEF_INITIAL_DEPOSIT.add(DEF_PENALTY),
          DEF_INITIAL_DEPOSIT.sub(DEF_PENALTY),
        ]
      );

      // Second Case: single day alarm spanning 3 weeks:
      // p1 makes all alarms, p2 only makes it once
      blockTime = (await currentTimestamp()).toNumber();
      p1Alarm = await initAlarm({
        alarmTime: timeOfDay(blockTime + 30),
        alarmDays: [dayOfWeek(blockTime + 30)],
      });

      p2Alarm = p1Alarm.connect(p2);
      await p2Alarm.start(0, { value: DEF_INITIAL_DEPOSIT });

      await p1Alarm.submitConfirmation();
      await p2Alarm.submitConfirmation();

      await advanceTime(1 * WEEK);
      await p1Alarm.submitConfirmation();
      await advanceTime(1 * MINUTE);
      expect(await p1Alarm.missedDeadlines(p1.address)).to.eq(0);
      expect(await p1Alarm.missedDeadlines(p2.address)).to.eq(1);
      await advanceTime(1 * WEEK);

      expect(await p1Alarm.missedDeadlines(p1.address)).to.eq(1);
      expect(await p1Alarm.missedDeadlines(p2.address)).to.eq(2);

      // P1 has made one more than p2, so should be up by DEF_PENALTY * 1
      const expP1Balance = DEF_INITIAL_DEPOSIT.add(DEF_PENALTY);
      const expP2Balance = DEF_INITIAL_DEPOSIT.sub(DEF_PENALTY);
      expect(await p1Alarm.getPenaltyAmount(p1.address)).to.eq(DEF_PENALTY);
      expect(await p1Alarm.getPenaltyAmount(p2.address)).to.eq(DEF_PENALTY);
      expect(await p2Alarm.getPlayerBalance(p1.address)).to.eql(expP1Balance);
      expect(await p2Alarm.getPlayerBalance(p2.address)).to.eql(expP2Balance);

      /* await expect(p2Alarm.withdraw()).to.changeEtherBalances(
        [p1.address, p2.address],
        [expP1Balance, expP2Balance]
      ); */
    });
  });

  describe("Alarm Management", () => {
    it("Allows player1 to withdraw (cancel request) before the alarm is started", async () => {
      const alarm = await initAlarm({});
      await expect(alarm.withdraw()).to.changeEtherBalance(
        p1.address,
        DEF_INITIAL_DEPOSIT
      );
    });
    it(
      "When any player withdraws (ends the alarm), both player's funds are returned to them"
    );
    it("Either player can add to their balance when the alarm is active", async () => {
      const alarm = await initAlarm({});
      await expect(alarm.addToBalance(p1.address, { value: parseEther("0.1") }))
        .to.be.reverted;

      await alarm.connect(p2).start(0, { value: DEF_INITIAL_DEPOSIT });

      expect(await alarm.getPlayerBalance(p1.address)).to.equal(
        DEF_INITIAL_DEPOSIT
      );
      expect(await alarm.getPlayerBalance(p2.address)).to.equal(
        DEF_INITIAL_DEPOSIT
      );

      await alarm.addToBalance(p1.address, { value: parseEther("0.1") });
      expect(await alarm.getPlayerBalance(p1.address)).to.equal(
        DEF_INITIAL_DEPOSIT.add(parseEther("0.1"))
      );
    });
  });
});
