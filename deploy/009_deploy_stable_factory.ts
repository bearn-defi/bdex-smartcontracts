import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, read, get} = deployments;
    const {deployer} = await getNamedAccounts();

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const dai = await createTokenAndMint(deployments, deployer, "DAI", 18);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const usdc = await createTokenAndMint(deployments, deployer, "USDC", 6);

    const mathUtils = await deploy("MathUtils", {
        contract: "MathUtils",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [],
        log: true,
    });

    const swapUtils = await deploy("SwapUtils", {
        contract: "SwapUtils",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [],
        libraries: {
            MathUtils: mathUtils.address,
        },
        log: true,
    });

    const creator = await deploy("SwapCreator", {
        contract: "SwapCreator",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [],
        libraries: {
            SwapUtils: swapUtils.address,
        },
        log: true,
    });

    const factory = await deploy("StableSwapFactory", {
        contract: "StableSwapFactory",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [deployer, creator.address],
        proxy: "initialize",
        log: true,
    });

    if (factory.newlyDeployed) {
        await execute("StableSwapFactory", {from: deployer, log: true}, "setFeeTo", deployer);
    }

    //set up fee
    if (factory.newlyDeployed) {
        await execute("StableSwapFactory", {from: deployer, log: true}, "setFeeToken", (await get("TKA")).address);
        await execute("StableSwapFactory", {from: deployer, log: true}, "setFeeAmount", expandDecimals(1, 18));
    }

    await deploy("StableSwapRouter", {
        contract: "StableSwapRouter",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [],
        log: true,
    });

    // await deploy("Swap", {
    //     contract: "Swap",
    //     skipIfAlreadyDeployed: true,
    //     from: deployer,
    //     args: [],
    //     libraries: {
    //         SwapUtils: swapUtils.address,
    //     },
    //     log: true,
    // });
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

async function createTokenAndMint(deployments: DeploymentsExtension, deployer: string, name: string, decimal: number) {
    const token = await createToken(deployments, deployer, name, decimal);
    if ((await token.balanceOf(deployer)).eq(BigNumber.from(0))) {
        await token.minTo(deployer, 800000000);
    }
    return token;
}

export default func;
func.tags = ["stable-factory"];
