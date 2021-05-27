import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy, get, read, execute, getOrNull, log} = deployments;
    const {deployer} = await getNamedAccounts();

    if (network.name == "bsctestnet") {
        const oracle = await deploy("OracleVPeg", {
            contract: "OracleVPeg",
            skipIfAlreadyDeployed: true,
            from: deployer,
            args: [],
            log: true,
        });

        if (oracle.newlyDeployed) {
            await execute(
                "OracleVPeg",
                {from: deployer, log: true},
                "initialize",
                "0x7737923e5A3Be061d7aF31081077080B6b5D66ba", //pool dai-usdc
                "0x05aa371d5b9e1d666724f3045339fa8df64d808a", // dai
                "0xc22bf875bde78d9f38346ca0a69a6dec2a175a3c", // usdc
                0,
                60 * 4,
                Math.floor(Date.now() / 1000) - 60 * 4,
                60 * 2,
                Math.floor(Date.now() / 1000) - 60 * 2
            );
        }

        // update cumulative
        // wait 2 min, update
    }
};

export default func;
func.tags = ["oracle-vpeg"];
