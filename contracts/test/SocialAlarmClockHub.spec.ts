import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  encodeCreationParams,
  registerNewType,
} from "../lib/commitmentCreation";
import { alarmTypeVals } from "../lib/types";
import { PartnerAlarmClock, SocialAlarmClockHub } from "../typechain-types";
import { ZERO_ADDRESS } from "./helpers/constants";
import { deploy, deployTyped } from "./helpers/deploy";
import { waitAll, repeat } from "./helpers/util";

const partnerAlarmDefault = (otherPlayer: string) => ({
  alarmTime: 1,
  alarmdays: [1, 2, 3, 4, 5, 6, 7],
  submissionWindow: 30,
  missedAlarmPenalty: 0,
  timezoneOffset: 0,
  otherPlayer,
});

describe("SocialAlarmClockHub", () => {
  let commitmentHub: SocialAlarmClockHub;
  let alarm: PartnerAlarmClock;
  let owner: SignerWithAddress;
  let rando: SignerWithAddress;

  before(async () => {
    [owner, rando] = await ethers.getSigners();
  });

  beforeEach(async () => {
    commitmentHub = await (
      await ethers.getContractFactory("SocialAlarmClockHub")
    ).deploy();
    alarm = await deployTyped<PartnerAlarmClock>("PartnerAlarmClock");
  });

  describe("Alarm Type Registration", () => {
    it("Cannot create an alarm without a registered template contract", async () => {
      const initData = encodeCreationParams(
        "PartnerAlarmClock",
        partnerAlarmDefault(rando.address)
      );

      await expect(
        commitmentHub.createAlarm(alarmTypeVals["PartnerAlarmClock"], initData)
      ).to.revertedWith("TYPE_NOT_REGISTERED");

      await (
        await commitmentHub.registerAlarmType(
          alarmTypeVals["PartnerAlarmClock"],
          alarm.address
        )
      ).wait();

      await expect(
        commitmentHub.createAlarm(
          alarmTypeVals["PartnerAlarmClock"],
          initData,
          { value: 1 }
        )
      ).to.not.reverted;
    });

    it("Only allows templates to be registered by the owner", async () => {
      await expect(
        commitmentHub
          .connect(rando)
          .registerAlarmType(alarmTypeVals["PartnerAlarmClock"], alarm.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        commitmentHub.registerAlarmType(
          alarmTypeVals["PartnerAlarmClock"],
          alarm.address
        )
      ).to.not.be.reverted;
    });

    it("Prevents overriding template registration", async () => {
      await commitmentHub.registerAlarmType(
        alarmTypeVals["PartnerAlarmClock"],
        alarm.address
      );
      const commitment2 = await deploy("PartnerAlarmClock");
      await expect(
        commitmentHub.registerAlarmType(
          alarmTypeVals["PartnerAlarmClock"],
          commitment2.address
        )
      ).to.be.revertedWith("TYPE_REGISTERED");
    });
  });

  describe("Alarm Creation (minimal proxy cloning)", () => {
    let baseInitData = "";

    // Register alarm types to be tested
    beforeEach(async () => {
      const alarm = await deploy("PartnerAlarmClock");
      await registerNewType(commitmentHub, "PartnerAlarmClock");

      baseInitData = encodeCreationParams(
        "PartnerAlarmClock",
        partnerAlarmDefault(rando.address)
      );
    });

    it("Creates commitments from registered template contracts", async () => {
      // Type 0 alarm (standard alarm)
      expect(
        await commitmentHub.alarmTypeRegistry(
          alarmTypeVals["PartnerAlarmClock"]
        )
      ).to.not.equal(ZERO_ADDRESS);

      const tx = commitmentHub.createAlarm(
        alarmTypeVals["PartnerAlarmClock"],
        baseInitData,
        { value: 1 }
      );
      await expect(tx).to.not.reverted;
    });

    it("Emits AlarmCreation events", async () => {
      const tx = commitmentHub.createAlarm(
        alarmTypeVals["PartnerAlarmClock"],
        baseInitData,
        { value: 1 }
      );
      await expect(tx).to.emit(commitmentHub, "AlarmCreation");
    });

    it("Emit creation events", async () => {
      const txs = await repeat(
        commitmentHub.createAlarm,
        [alarmTypeVals["PartnerAlarmClock"], baseInitData, { value: 1 }],
        5
      );
      await waitAll(txs);
      const events = await commitmentHub.queryFilter(
        commitmentHub.filters.AlarmCreation(owner.address as any)
      );
      expect(events.length).to.equal(5);
    });

    it("Records alarm addresses indexed by an incrementing id", async () => {
      const startingId = await commitmentHub.nextAlarmId();
      const tx = commitmentHub.createAlarm(
        alarmTypeVals["PartnerAlarmClock"],
        baseInitData,
        { value: 1 }
      );

      await expect(tx).to.not.be.reverted;
      expect(await commitmentHub.alarms(startingId)).to.be.properAddress;
      expect(await commitmentHub.nextAlarmId()).to.eq(startingId.add(1));
    });
  });
});
