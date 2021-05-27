import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";
import {MaxUint256} from "../test/ts/shared/common";
import {getWeth} from "./007_deploy_epoch_reward";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy, get, read, execute, getOrNull, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const HOUR = 3600;
    const MINUTE = 60;
    const wethAddress = await getWeth(hre);

    const priceFeedMock = await deploy("EthPriceFeedMock", {
        contract: "EthPriceFeedMock",
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: ["131191333474"],
        log: true,
    });

    if (network.name == "kovan") {
        const oracle = await deploy("OracleMultiPair", {
            contract: "OracleMultiPair",
            skipIfAlreadyDeployed: true,
            from: deployer,
            args: [
                ["0x2639435F7116aF5629488d016E95F98A6A568106", "0x3e5C057919e6fC17422006910d2ba15e9a1aF4Ba"], //pair weth-vusd
                "0x3057a093dd26295f7edac1de4a52c3be6861a736", //vusd
                "0xAd341200C008158e2B36EB5F33280f41c4cCE42E",
                20 * HOUR,
                5 * MINUTE,
                Math.floor(Date.now() / 1000) - 5 * MINUTE,
                (await get("BdexFactory")).address,
                priceFeedMock.address,
                1,
            ],
            log: true,
        });

        if (oracle.newlyDeployed) {
            await execute("OracleMultiPair", {from: deployer, log: true}, "setChainLinkOracle", wethAddress, priceFeedMock.address);
        }
    }
};

export default func;
func.tags = ["oracle"];
