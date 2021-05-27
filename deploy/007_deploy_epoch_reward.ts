import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {ADDRESS_ZERO, expandDecimals, getLatestBlockNumber, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";
import {ethers} from "hardhat";
import {encodeEpochPoolInfo, MaxUint256} from "../test/ts/shared/common";
import {getAddress} from "ethers/lib/utils";
import {Erc20Factory, StakePoolEpochRewardFactory} from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy, get, read, execute, getOrNull, log} = deployments;
    const {deployer} = await getNamedAccounts();

    const stakePoolEpochRewardCreator = await deploy("StakePoolEpochRewardCreator", {
        contract: "StakePoolEpochRewardCreator",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [],
        log: true,
    });

    if (stakePoolEpochRewardCreator.newlyDeployed) {
        await execute("StakePoolController", {from: deployer, log: true}, "addStakePoolCreator", stakePoolEpochRewardCreator.address);
    }

    const wethAddress = await getWeth(hre);

    if (network.name === "kovan") {
        await createPair(
            wethAddress,
            "0x3057a093dd26295f7edac1de4a52c3be6861a736",
            20,
            6,
            toWei(1),
            toWei(5200),
            "0x3057a093dd26295f7edac1de4a52c3be6861a736",
            4,
            2,
            hre
        );
        await createPair(
            wethAddress,
            "0x3057a093dd26295f7edac1de4a52c3be6861a736",
            2,
            6,
            toWei(0.25),
            toWei(15925),
            "0x3057a093dd26295f7edac1de4a52c3be6861a736",
            8,
            4,
            hre
        );
    }
};

async function createPair(
    token0Address: string,
    token1Address: string,
    token0Weight: number,
    swapFee: number,
    amount0Liq: BigNumber,
    amount1Liq: BigNumber,
    rewardTokenAddress: string,
    withdrawLockupEpochs: number,
    rewardLockupEpochs: number,
    hre: HardhatRuntimeEnvironment
) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, get, read, execute, getOrNull, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const signer = (await ethers.getSigners())[0];

    const router = await get("BdexRouter");

    //create pair
    await execute("BdexFactory", {from: deployer, log: true}, "createPair", token0Address, token1Address, token0Weight, swapFee);
    const pairAddress = await read("BdexFactory", "getPair", token0Address, token1Address, token0Weight, swapFee);

    //add liquidity
    const token0Contract = await Erc20Factory.connect(token0Address, signer);
    await token0Contract.approve(router.address, maxUint256);
    const token1Contract = await Erc20Factory.connect(token1Address, signer);
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

    //create faas
    const tx = await execute(
        "StakePoolController",
        {from: deployer, log: true},
        "create",
        4001,
        pairAddress,
        rewardTokenAddress,
        0,
        3600 * 48,
        encodeEpochPoolInfo({
            epochController: (await get("SimpleEpochController")).address,
            withdrawLockupEpochs: withdrawLockupEpochs,
            rewardLockupEpochs: rewardLockupEpochs,
        })
    );
    // @ts-ignore
    let stakePoolAddress = getAddress(tx.logs[0].topics[1].slice(26)) ?? null;
    await execute("StakePoolController", {from: deployer, log: true}, "setWhitelistStakePool", stakePoolAddress, 1);
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
func.dependencies = ["mock"];
func.tags = ["epoch"];
