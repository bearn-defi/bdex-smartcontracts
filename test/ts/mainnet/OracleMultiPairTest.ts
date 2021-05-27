import {ethers, deployments} from "hardhat";
import {expect} from "../chai-setup";

import {
    collapseDecimals,
    expandDecimals,
    forkBlockNumber,
    fromWei,
    getLatestBlock,
    getLatestBlockTime,
    maxUint256,
    moveForwardSeconds,
    toWei,
    unlockForkAddress,
} from "../shared/utilities";
import {
    Erc20Factory,
    Erc20,
    OracleMultiPair,
    OracleMultiPairFactory,
    BdexFactoryFactory,
    BdexFactory,
    BdexRouter,
    BdexRouterFactory,
    BdexProvider,
    BdexProviderFactory,
    EpochControllerMockFactory,
    EpochControllerMock,
} from "../../../typechain";
import {SignerWithAddress} from "hardhat-deploy-ethers/dist/src/signer-with-address";
import {BigNumber, Contract} from "ethers";
import {MaxUint256} from "../shared/common";

const verbose = process.env.VERBOSE;

describe("OracleMultiPair", function () {
    const MINUTE = 60;
    const HOUR = 3600;
    const DAY = 86400;

    let deployer: SignerWithAddress;
    let signers: SignerWithAddress[];

    let oracleMultiPairStartTime: BigNumber;
    let oracleMultiPair: OracleMultiPair;
    let pairFactory: BdexFactory;
    let router: BdexRouter;
    let provider: BdexProvider;
    let mockEpochController: EpochControllerMock;

    let vusd: Erc20;
    let weth: Erc20;
    let pair80Address: string;
    let pair98Address: string;

    let currentEpoch: String;

    before(async function () {
        await forkBlockNumber(ethers, 11728841);

        signers = await ethers.getSigners();
        deployer = signers[0];

        oracleMultiPairStartTime = BigNumber.from(await getLatestBlockTime(ethers));
        console.log("oracleMultiPairStartTime = %s", oracleMultiPairStartTime);

        vusd = Erc20Factory.connect("0x3479B0ACF875405D7853f44142FE06470a40f6CC", deployer);
        weth = Erc20Factory.connect("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", deployer);
        pairFactory = BdexFactoryFactory.connect("0x5021470FC598373fBA4fE3384745940eaB3E653d", deployer);
        provider = BdexProviderFactory.connect("0x6a7F824579e280a717D44a96Ae8df7fbaA774b36", deployer);
        router = BdexRouterFactory.connect("0x52F75ee5033E25f2D8343E0323F1b3fE0B9a0A03", deployer);

        await faucet("0x1840c62fD7e2396e470377e6B2a833F3A1E96221", weth, toWei(10000));
        await faucet("0x4B502A08bc54C05772B2c63469E366C2E78459ed", vusd, toWei(80000));

        pair80Address = await createPair(weth, vusd, 20, toWei(3), toWei(15600)); //price: 0.00076923076 eth
        pair98Address = await createPair(weth, vusd, 2, toWei(0.75), toWei(55125)); //price: 0.00066666666 eth

        mockEpochController = await new EpochControllerMockFactory(deployer).deploy(vusd.address);
        await mockEpochController.updateEpochTime(oracleMultiPairStartTime);

        oracleMultiPair = await new OracleMultiPairFactory(deployer).deploy(
            [pair80Address, pair98Address],
            vusd.address,
            mockEpochController.address,
            20 * HOUR,
            2 * HOUR,
            oracleMultiPairStartTime.sub(2 * HOUR),
            pairFactory.address,
            "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
            0
        );
        await oracleMultiPair.setChainLinkOracle(weth.address, "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419");
        currentEpoch = String(await oracleMultiPair.epoch());
    });

    const faucet = async (testAddress: string, token: Erc20, amount: BigNumber) => {
        await unlockForkAddress(ethers, testAddress);
        let testUser = await ethers.getSigner(testAddress);
        await token.connect(testUser).transfer(deployer.address, amount);
    };

    const createPair = async (token1: Erc20, token2: Erc20, weight1: number, liqToken1: BigNumber, liqToken2: BigNumber): Promise<string> => {
        await pairFactory.createPair(token1.address, token2.address, weight1, 3);
        const pairAddress = await pairFactory.getPair(token1.address, token2.address, weight1, 3);

        await token1.approve(router.address, maxUint256);
        await token2.approve(router.address, maxUint256);
        await router.addLiquidity(pairAddress, token1.address, token2.address, liqToken1, liqToken2, liqToken1, liqToken2, deployer.address, MaxUint256);
        return pairAddress;
    };

    const swap = async (tokenFrom: Erc20, tokenTo: Erc20, swapAmount: BigNumber, pair: string) => {
        await router.swapExactTokensForTokens(tokenFrom.address, tokenTo.address, swapAmount, 0, [pair], deployer.address, MaxUint256, 0);
    };

    describe("#setup", async () => {
        it("set up correctly", async () => {
            expect(await oracleMultiPair.pairs(1)).to.equal(pair98Address);
            expect(await oracleMultiPair.decimalFactors(1)).to.equal(BigNumber.from(1));
            expect(await oracleMultiPair.isToken0s(1)).to.equal(true);
            expect(await oracleMultiPair.mainTokenWeights(1)).to.equal(98);
        });

        it("Can remove pair", async () => {
            await oracleMultiPair.removePair(pair80Address);

            expect(await oracleMultiPair.pairs(0)).to.equal(pair98Address);
            expect(await oracleMultiPair.decimalFactors(0)).to.equal(BigNumber.from(1));
            expect(await oracleMultiPair.isToken0s(0)).to.equal(true);
            expect(await oracleMultiPair.mainTokenWeights(0)).to.equal(98);
        });

        it("Can add more pair", async () => {
            await oracleMultiPair.addPair(pair80Address);

            expect(await oracleMultiPair.pairs(1)).to.equal(pair80Address);
            expect(await oracleMultiPair.decimalFactors(1)).to.equal(BigNumber.from(1));
            expect(await oracleMultiPair.isToken0s(1)).to.equal(true);
            expect(await oracleMultiPair.mainTokenWeights(1)).to.equal(80);
        });
    });

    describe("#update", async () => {
        it("not start until start time", async () => {
            await moveForwardSeconds(ethers, oracleMultiPairStartTime.sub(await getLatestBlockTime(ethers)).toNumber() - MINUTE);
            console.log("oracleMultiPair.nextEpochPoint = %s", String(await oracleMultiPair.nextEpochPoint()));
            console.log("1: currentEpoch = %s", currentEpoch);

            await expect(oracleMultiPair.update()).to.revertedWith("OracleMultiPair: not opened yet");
            expect(await oracleMultiPair.nextEpochPoint()).to.eq(oracleMultiPairStartTime.add((Number.parseInt(String(currentEpoch)) + 1) * 12 * HOUR));
            expect(await oracleMultiPair.epoch()).to.eq(BigNumber.from(Number.parseInt(String(currentEpoch))));
        });

        it("next epoch: should works correctly", async () => {
            console.log(
                "epoch = %s, oracleMultiPair.nextEpochPoint = %s",
                String(await oracleMultiPair.epoch()),
                String(await oracleMultiPair.nextEpochPoint())
            );
            const _nextEpochPoint = await oracleMultiPair.nextEpochPoint();
            await moveForwardSeconds(ethers, _nextEpochPoint.sub(await getLatestBlockTime(ethers)).toNumber() + MINUTE);
            console.log(
                "epoch = %s, oracleMultiPair.nextEpochPoint = %s",
                String(await oracleMultiPair.epoch()),
                String(await oracleMultiPair.nextEpochPoint())
            );

            // next epoch
            await expect(oracleMultiPair.update()).to.emit(oracleMultiPair, "Updated");
            await mockEpochController.resetEpochTime();

            // check double update
            await expect(oracleMultiPair.update()).to.revertedWith("OracleMultiPair: not opened yet");
        });

        it("gas updateCumulative", async () => {
            await moveForwardSeconds(ethers, 2 * HOUR);
            const tx = await oracleMultiPair.updateCumulative();
            const receipt = await tx.wait();
            expect(receipt.gasUsed).to.eq(87194);
        });

        it("gas update", async () => {
            await moveForwardSeconds(ethers, 10 * HOUR);
            const tx = await oracleMultiPair.update();
            await mockEpochController.resetEpochTime();
            const receipt = await tx.wait();
            expect(receipt.gasUsed).to.eq(130521);
        });

        it("should work normally with update cumulative during epoch", async () => {
            for (let i = 0; i < 25; i++) {
                if (i % 3 == 1) {
                    await swap(weth, vusd, toWei(0.005), pair98Address);
                } else if (i % 3 == 2) {
                    await swap(weth, vusd, toWei(0.009), pair80Address);
                } else {
                    await swap(vusd, weth, toWei(10), pair80Address);
                }
                await moveForwardSeconds(ethers, 2 * HOUR);
                await oracleMultiPair.updateCumulative();
            }
        });

        it("should works correctly", async () => {
            await expect(oracleMultiPair.update()).to.emit(oracleMultiPair, "Updated");
            await mockEpochController.resetEpochTime();
        });

        it("consult after swap", async () => {
            const priceMainAvg = await oracleMultiPair.consult(vusd.address, toWei(1));
            expect(priceMainAvg).to.gt(toWei(Number(0.000752301263548689) * 0.99995));
            expect(priceMainAvg).to.lt(toWei(Number(0.000752301263548689) * 1.00005));
            await oracleMultiPair.updateCumulative();
            console.log(fromWei(await oracleMultiPair.twap(toWei(1))));
            console.log(fromWei(await oracleMultiPair.twapDollarPrice(weth.address, toWei(1))));
        });
    });
});
