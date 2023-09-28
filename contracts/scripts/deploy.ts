import { ethers } from "hardhat";
import { AlarmBetsHub } from "../typechain-types";
import { AlarmType, alarmTypeVals } from "../lib/types";
import { parseUnits } from "ethers/lib/utils";

let gasPrice = parseUnits("1", "gwei");

/**
 * Deploy protocol hub and register commitment types
 */
async function main() {
  const factory = await ethers.getContractFactory("AlarmBetsHub");
  gasPrice = await ethers.provider.getGasPrice();
  // const CPH = await factory.deploy({ gasPrice });
  const hub = await factory.attach(
    "0x92eb8aD38ce67B3499CdEEaD96f97D45087c37D4"
  );
  // console.log("Deployed protocol hub to", hub.address);

  await registerType(hub, "PartnerAlarmClock");
}

async function registerType(hub: AlarmBetsHub, type: AlarmType) {
  const contract = await (await ethers.getContractFactory(type)).deploy();
  await (
    await hub.registerAlarmType(alarmTypeVals[type], contract.address, {
      gasPrice,
    })
  ).wait();
  console.log("Registered", type, "at", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
