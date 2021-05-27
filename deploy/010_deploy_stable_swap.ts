import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber} from "ethers";
import {getAddress} from "ethers/lib/utils";
import {SwapFactory} from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, read, get} = deployments;
    const {deployer} = await getNamedAccounts();

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const dai = await getToken(deployments, deployer, "DAI");
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const usdc = await getToken(deployments, deployer, "USDC");
    const tokenA = await getToken(deployments, deployer, "TKA");

    await tokenA.approve((await get("StableSwapFactory")).address, maxUint256);
    const tx = await execute(
        "StableSwapFactory",
        {from: deployer, log: true},
        "createPool",
        [dai.address, usdc.address],
        [18, 6],
        "vPeg DAI/USDC",
        "vPegDU",
        200,
        1e8, // 1%
        5e9, // 50%
        5e7, // 0.5%
        300
    );

    // @ts-ignore
    const swapAddress = getAddress(tx.logs[4].topics[1].slice(26)) ?? null;
    const swapContract = await SwapFactory.connect(swapAddress, (await ethers.getSigners())[0]);

    await dai.approve(swapAddress, maxUint256);
    await usdc.approve(swapAddress, maxUint256);
    await swapContract.addLiquidity([toWei(1000), expandDecimals(1000, 6)], 0, maxUint256);
};

async function getToken(deployments: DeploymentsExtension, fromAddress: string, name: string) {
    const {execute, read, get} = deployments;
    const token = await get(name);
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

export default func;
func.dependencies = ["stable-factory"];
func.tags = ["stable-swap"];
