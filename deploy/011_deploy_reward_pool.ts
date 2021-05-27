import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, get, read, execute, getOrNull, log} = deployments;
    const {deployer} = await getNamedAccounts();

    const rewardPool = await deploy("RewardPool", {
        contract: "RewardPool",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [],
        log: true,
    });

    if (rewardPool.newlyDeployed) {
        await execute("RewardPool", {from: deployer, log: true}, "initialize", (await get("TKA")).address, 6617500);
        await execute("RewardPool", {from: deployer, log: true}, "add", 1000, "0xD66caF886f02ac76bBFa05Da5216673288d7fb5B", false, 0);
    }
};

export default func;
func.tags = ["reward-pool"];
