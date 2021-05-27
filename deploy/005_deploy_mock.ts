import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";
import {MaxUint256} from "../test/ts/shared/common";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, get, read, execute, getOrNull, log} = deployments;
  const {deployer} = await getNamedAccounts();

  const TKA = await createTokenAndMint(deployments, deployer, "TKA", 18);
  const dai = await createTokenAndMint(deployments, deployer, "DAI", 18);
  const DFA = await createDefaltingTokenAndMint(deployments, deployer, "DFA");
  const usdc = await createTokenAndMint(deployments, deployer, "USDC", 6);
  const usdt = await createTokenAndMint(deployments, deployer, "USDT", 18);
  const busd = await createTokenAndMint(deployments, deployer, "BUSD", 18);
  const bdo = await createTokenAndMint(deployments, deployer, "BDO", 18); //reward token
  const sBDO = await createTokenAndMint(deployments, deployer, "sBDO", 18); //reward token
  const bBDO = await createTokenAndMint(deployments, deployer, "bBDO", 18); //reward token
  const BFI = await createTokenAndMint(deployments, deployer, "BFI", 18); //reward token
};

async function createTokenAndMint(deployments: DeploymentsExtension, deployer: string, name: string, decimal: number) {
  const token = await createToken(deployments, deployer, name, decimal);
  if ((await token.balanceOf(deployer)).eq(BigNumber.from(0))) {
    await token.minTo(deployer, 800000000);
  }
  return token;
}

async function createToken(deployments: DeploymentsExtension, deployer: string, name: string, decimal: number) {
  const {deploy} = deployments;
  if (await isNotDeployed(deployments, name)) {
    await deploy(name, {
      contract: "TToken",
      from: deployer,
      args: [name, name, decimal],
      skipIfAlreadyDeployed: true,
      log: true,
    });
  }
  return getToken(deployments, deployer, name);
}

async function createDefaltingTokenAndMint(deployments: DeploymentsExtension, deployer: string, name: string) {
  const token = await createDeflatingToken(deployments, deployer, name);
  if ((await token.balanceOf(deployer)).eq(BigNumber.from(0))) {
    await token.minTo(deployer, 800000000);
  }
  return token;
}

async function createDeflatingToken(deployments: DeploymentsExtension, deployer: string, name: string) {
  const {deploy} = deployments;
  if (await isNotDeployed(deployments, name)) {
    await deploy(name, {
      contract: "DeflatingERC20",
      from: deployer,
      args: [toWei(0)],
      skipIfAlreadyDeployed: true,
      log: true,
    });
  }
  return getToken(deployments, deployer, name);
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
func.tags = ["mock"];
func.dependencies = ["factory"];
