import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy, get, read, execute, getOrNull, log} = deployments;
	const {deployer} = await getNamedAccounts();

	const wethAddress = await getWeth(hre);

	const formula = await get("BdexFormula");

	const factoty = await get("BdexFactory");


	const router = await get("BdexRouter");

	const zapper = await deploy("BdexZap", {
		contract: "BdexZap",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});

	if (zapper.newlyDeployed) {
		await execute("BdexZap", {from: deployer, log: true}, "setBdexFactory", factoty.address);
		await execute("BdexZap", {from: deployer, log: true}, "setBdexRouter", router.address);
		await execute("BdexZap", {from: deployer, log: true}, "setBdexFormula", formula.address);
		await execute("BdexZap", {from: deployer, log: true}, "setWBNB", wethAddress);
	}
};

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
func.tags = ["zap"];
