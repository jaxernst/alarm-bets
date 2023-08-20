import { HardhatUserConfig, task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-abi-exporter";
import "@typechain/hardhat";

import * as dotenv from "dotenv";
dotenv.config();

task("automine", "Turn automine off or on")
  .addFlag("off")
  .addFlag("on")
  .addOptionalParam("interval")
  .setAction(
    async (
      args: { off: boolean; on: boolean; interval: string | undefined },
      hre: HardhatRuntimeEnvironment
    ) => {
      if (args.on && args.off) {
        throw "select only off or on.";
      }
      if (!args.on && !args.off) {
        throw "select either --on or --off";
      }

      if (args.on) {
        await hre.ethers.provider.send("evm_setAutomine", [true]);
      } else {
        await hre.ethers.provider.send("evm_setAutomine", [false]);
      }
      await hre.ethers.provider.send("evm_setIntervalMining", [
        args.interval ? Number(args.interval) : 5000,
      ]);
    }
  );

const deployNetworks = {
  lattice: {
    url: "http://localhost:8545",
    accounts: [process.env.TEST_U1_KEY ?? ""],
  },
  "base-goerli": {
    url: "https://goerli.base.org",
    accounts: [process.env.TEST_U1_KEY ?? ""],
  },
  "base-mainnet": {
    url: "https://mainnet.base.org",
    accounts: [process.env.TEST_U1_KEY as string],
  },
  "optimism-goerli": {
    url: "https://opt-goerli.g.alchemy.com/v2/_k4Jxl6GexIvooQrdgnxZj9OFj8pGWrw",
    accounts: [process.env.TEST_U1_KEY ?? ""],
  },
  "op-mainnet": {
    url: "https://opt-mainnet.g.alchemy.com/v2/pvNYFwyAKEEyZqsPdStj8B3mJqsUEnFM",
    accounts: [process.env.TEST_U1_KEY as string],
  },
};

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    ...(process.env.TEST_U1_KEY ? deployNetworks : {}),
  },
  abiExporter: [
    {
      runOnCompile: false,
      path: "../client/src/lib/abi",
      format: "json",
      flat: true,
      only: ["SocialAlarmClockHub.sol", "PartnerAlarmClock.sol"],
    },
  ],
};

export default config;
