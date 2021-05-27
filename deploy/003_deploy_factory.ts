import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {expandDecimals, isNotDeployed, maxUint256, toWei} from "../test/ts/shared/utilities";
import {DeploymentsExtension} from "hardhat-deploy/dist/types";
import {BigNumber, BigNumberish} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;
	const {deploy, get, read, execute, getOrNull, log, save} = deployments;
	const {deployer, proxyAdmin, governance} = await getNamedAccounts();

	const wethAddress = await getWeth(hre);

	const formula = await deploy("BdexFormula", {
		contract: "BdexFormula",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});

	const factoryImpl = await deploy("BdexFactoryImpl", {
		contract: "BdexFactory",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});

	const factoryProxy = await deploy("BdexFactoryProxy", {
		contract: "AdminUpgradeabilityProxy",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [
			factoryImpl.address,
			proxyAdmin,
			"0x",
		],
		log: true,
	})
	if (factoryProxy.newlyDeployed) {
		const factory = factoryImpl
		factory.address = factoryProxy.address
		await save("BdexFactory", factory)
		await execute("BdexFactory", {
				from: deployer,
				log: true,
			}, "initialize",
			deployer, formula.address
		)
		const protocolFeeRemover = await deploy("ProtocolFeeRemover", {
			contract: "ProtocolFeeRemover",
			skipIfAlreadyDeployed: true,
			from: deployer,
			args: [],
			log: true,
		});
		if (protocolFeeRemover.newlyDeployed) {
			await execute("ProtocolFeeRemover", {from: deployer, log: true}, "setReceiver", governance);
			await execute("ProtocolFeeRemover", {from: deployer, log: true}, "setGovernance", governance);
		}
		await execute("BdexFactory", {from: deployer, log: true}, "setFeeTo", protocolFeeRemover.address);
		await execute("BdexFactory", {from: deployer, log: true}, "setProtocolFee", BigNumber.from(13333));

	}


	const routerImpl = await deploy("BdexRouterImpl", {
		contract: "BdexRouter",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [],
		log: true,
	});
	const routerProxy = await deploy("BdexRouterProxy", {
		contract: "AdminUpgradeabilityProxy",
		skipIfAlreadyDeployed: true,
		from: deployer,
		args: [
			routerImpl.address,
			proxyAdmin,
			"0x",
		],
		log: true,
	})
	if (routerProxy.newlyDeployed) {
		const router = routerImpl
		router.address = routerProxy.address
		await save("BdexRouter", router)
		await execute("BdexRouter", {
				from: deployer,
				log: true,
			}, "initialize",
			factoryProxy.address, wethAddress
		)

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
func.tags = ["factory"];
