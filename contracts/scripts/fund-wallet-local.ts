import { isAddress, parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const VAL = parseEther("1");

async function main() {
  if (hre.network.name !== "localhost") throw Error(`Localhost not selected`);

  if (!process.env.FUND_WALLET_1 || !process.env.FUND_WALLET_2) {
    console.error("*** .env must have FUND_WALLET_(1 and 2) addresses to send funds to ***");
    return
  }

  if (![process.env.FUND_WALLET_1, process.env.FUND_WALLET_2].every((addr) => isAddress(addr ?? ""))) {
    console.error("*** FUND_WALLET_(1 and 2) must be valid addresses ***");
    return
  }

  const [signer] = await ethers.getSigners();
  await signer.sendTransaction({
    to: process.env.FUND_WALLET_1,
    value: VAL,
  });

  await signer.sendTransaction({
    to: process.env.FUND_WALLET_2,
    value: VAL,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
