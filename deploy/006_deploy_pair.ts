import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {ADDRESS_ZERO, expandDecimals, getLatestBlockNumber, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";
import { encodePoolInfo, MaxUint256 } from "../test/ts/shared/common";
import {ethers} from "hardhat";
import {Erc20Factory} from "../typechain";
import {getAddress} from "ethers/lib/utils";
import {waitForTx} from "hardhat-deploy/dist/src/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, network} = hre;
  const {deploy, get, read, execute, getOrNull, log} = deployments;
  const {deployer} = await getNamedAccounts();

  const tokenA = await getToken(deployments, deployer, "TKA");
  const dai = await getToken(deployments, deployer, "DAI");
  const usdc = await getToken(deployments, deployer, "USDC");
  const deflatingA = await getToken(deployments, deployer, "DFA");
  const value = await getToken(deployments, deployer, "BFI"); //reward token
  const wethAddress = await getWeth(hre);

  await createPair(tokenA.address, dai.address, 80, 20, toWei(1000), toWei(1000), hre);
  await createPair(tokenA.address, usdc.address, 70, 20, toWei(1000), expandDecimals(1000, 6), hre);
  await createPair(tokenA.address, wethAddress, 20, 20, toWei(1000), toWei(1), hre);
  await createPair(tokenA.address, deflatingA.address, 80, 20, toWei(1000), toWei(1000), hre);
  await createPair(wethAddress, deflatingA.address, 80, 20, toWei(1), toWei(1000), hre);
};

async function createPair(
  token0Address: string,
  token1Address: string,
  token0Weight: number,
  swapFee: number,
  amount0Liq: BigNumber,
  amount1Liq: BigNumber,
  hre: HardhatRuntimeEnvironment
) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, get, read, execute, getOrNull, log} = deployments;
  const {deployer} = await getNamedAccounts();

  const router = await get("BdexRouter");

  //create pair
  await execute("BdexFactory", {from: deployer, log: true}, "createPair", token0Address, token1Address, token0Weight, swapFee);
  const pairAddress = await read("BdexFactory", "getPair", token0Address, token1Address, token0Weight, swapFee);

  //add liquidity
  const token0Contract = await Erc20Factory.connect(token0Address, (await ethers.getSigners())[0]);
  await token0Contract.approve(router.address, maxUint256);
  const token1Contract = await Erc20Factory.connect(token1Address, (await ethers.getSigners())[0]);
  await token1Contract.approve(router.address, maxUint256);

  await execute(
    "BdexRouter",
    {from: deployer, log: true},
    "addLiquidity",
    pairAddress,
    token0Address,
    token1Address,
    amount0Liq,
    amount1Liq,
    amount0Liq,
    amount1Liq,
    deployer,
    MaxUint256
  );

  // //create faas
  // const rewardToken = await getToken(deployments, deployer, "BFI");
  // await rewardToken.approve((await get("StakePoolController")).address);
  // let latestBlockNumber = await getLatestBlockNumber(ethers);
  // const tx = await execute(
  //   "StakePoolController",
  //   {from: deployer, log: true},
  //   "create",
  //   3001,
  //   pairAddress,
  //   rewardToken.address,
  //   toWei("1000000"),
  //   3600 * 48,
  //   encodePoolInfo({
  //     rewardRebaser: ADDRESS_ZERO,
  //     rewardMultiplier: ADDRESS_ZERO,
  //     startBlock: latestBlockNumber + 1,
  //     endRewardBlock: latestBlockNumber + 10000000,
  //     rewardPerBlock: toWei(0.2),
  //     lockRewardPercent: 25,
  //     startVestingBlock: latestBlockNumber + 2001,
  //     endVestingBlock: latestBlockNumber + 3000,
  //     unstakingFrozenTime: 600,
  //   })
  // );
  // // @ts-ignore
  // let stakePoolAddress = getAddress(tx.logs[1].topics[1].slice(26)) ?? null;
  // await execute("StakePoolController", {from: deployer, log: true}, "setWhitelistStakePool", stakePoolAddress, 1);
}

async function getToken(deployments: DeploymentsExtension, fromAddress: string, name: string) {
  const {execute, read, get} = deployments;
  let token = await get(name);
  const decimal = await read(name, "decimals");
  return {
    address: token.address,
    token,
    minTo: async (receiveAddress: string, amount: any) => {
      return await execute(
        name,
        {
          from: fromAddress,
          log: true,
        },
        "mint",
        receiveAddress,
        expandDecimals(amount, decimal)
      );
    },
    balanceOf: async (address: string) => {
      return await read(name, "balanceOf", address);
    },
    transfer: async (toAddress: string, amount: any) => {
      return await read(name, "transfer", toAddress, amount);
    },
    approve: async (spender: string, amount: any = maxUint256) => {
      return await execute(name, {from: fromAddress, log: true}, "approve", spender, amount);
    },
  };
}

export async function getWeth(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, get, read, execute, getOrNull, log} = deployments;
  let {deployer, weth} = await getNamedAccounts();
  if (!weth) {
    const wethContract = await deploy("WETH", {
      contract: "WETH9",
      from: deployer,
      args: [],
      log: true,
    });

    if ((await read("WETH", "balanceOf", deployer)).eq(BigNumber.from(0))) {
      await execute("WETH", {from: deployer, log: true, value: expandDecimals(800, 18)}, "deposit");
    }
    weth = wethContract.address;
  }
  return weth;
}

export default func;
func.tags = ["pair"];
func.dependencies = ["mock"];
