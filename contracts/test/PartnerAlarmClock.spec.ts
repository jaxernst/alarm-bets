import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { createAlarm } from "../lib/commitmentCreation";
import { SocialAlarmClockHub, PartnerAlarmClock } from "../typechain-types";
import { deployTyped } from "./helpers/deploy";
import { advanceTime } from "./helpers/providerUtils";
import {
  DAY,
  HOUR,
  currentTimestamp,
  dayOfWeek,
  timeOfDay,
} from "./helpers/time";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("Partner Alarm Clock test", () => {
  let hub: SocialAlarmClockHub;
  let alarm: PartnerAlarmClock;
  let blockTime: number;
  let p1: SignerWithAddress;
  let p2: SignerWithAddress;

  // Defaults
  const INITIAL_DEPOSIT = parseEther("1");
  const SUBMISSION_WINDOW = 30; // seconds

  const initAlarm = async (otherPlayer: string, initDeposit: BigNumber) => {
    return await createAlarm(
      hub,
      "PartnerAlarmClock",
      {
        alarmTime: 0,
        alarmdays: [1, 2, 3, 4, 5, 6, 7],
        submissionWindow: SUBMISSION_WINDOW,
        missedAlarmPenalty: parseEther("0.1"),
        timezoneOffset: 0,
        otherPlayer,
      },
      initDeposit
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
    it("Allows players to create alarms through the AlarmClockHub");
    it(
      "Marks the alarm as inactive when created (while waiting for the other player to start"
    );
    it("Requires both players to deposit a specified amount of collateral");
    it("Starts the alarm when the other player joins");
    it("Only allows the alarm to be started by the other player");
  });

  describe("Alarm Enforcement", () => {
    it("Cannot record entries or view missed deadlines until started", async () => {
      const alarm = await initAlarm(p2.address, INITIAL_DEPOSIT);
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
    it(
      "Allows entries (wakeup confirmations) to be recorded only while in the submission window"
    );
    it("Returns the time until the next alarm is due (0 offset)", async () => {
      const curTime = timeOfDay(blockTime);
      const curDay = dayOfWeek(blockTime);

      const alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: curTime + 60,
          alarmdays: [curDay],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: SUBMISSION_WINDOW,
          timezoneOffset: 0,
          otherPlayer: p2.address,
        },
        INITIAL_DEPOSIT
      );

      await alarm.connect(p2).start({ value: INITIAL_DEPOSIT });

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
      const alarm = await createAlarm(
        hub,
        "PartnerAlarmClock",
        {
          alarmTime: alarmTime,
          alarmdays: [curDay, curDay + 1],
          missedAlarmPenalty: parseEther("0.1"),
          submissionWindow: SUBMISSION_WINDOW,
          timezoneOffset: localOffsetHrs * HOUR,
          otherPlayer: p2.address,
        },
        INITIAL_DEPOSIT
      );

      await alarm.connect(p2).start({ value: INITIAL_DEPOSIT });

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
    it("Records missed deadlines when either player misses an alarm");
  });

  describe("Alarm Management", () => {
    it(
      "Allows the creating player to withdraw (cancel request) before the alarm is started"
    );
    it(
      "When any player withdraws (ends the alarm), both player's funds are returned to them"
    );
    it("Either player can add to their balance when the alarm is active", async () => {
      const alarm = await initAlarm(p2.address, INITIAL_DEPOSIT);
      await expect(alarm.addToBalance(p1.address, { value: parseEther("0.1") }))
        .to.be.reverted;

      await alarm.connect(p2).start({ value: INITIAL_DEPOSIT });

      expect(await alarm.getPlayerBalance(p1.address)).to.equal(
        INITIAL_DEPOSIT
      );
      expect(await alarm.getPlayerBalance(p2.address)).to.equal(
        INITIAL_DEPOSIT
      );

      await alarm.addToBalance(p1.address, { value: parseEther("0.1") });
      expect(await alarm.getPlayerBalance(p1.address)).to.equal(
        INITIAL_DEPOSIT.add(parseEther("0.1"))
      );
    });
  });
});
