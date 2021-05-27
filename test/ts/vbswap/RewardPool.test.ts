import {expect} from "../chai-setup";
import {ethers} from 'hardhat';
import {Contract, ContractFactory, BigNumber, utils} from 'ethers';
import {Provider} from '@ethersproject/providers';
import {SignerWithAddress} from 'hardhat-deploy-ethers/dist/src/signer-with-address';

import {
    ADDRESS_ZERO, fromWei,
    getLatestBlock,
    getLatestBlockNumber,
    maxUint256,
    mineBlocks, mineBlockTimeStamp,
    toWei
} from "../shared/utilities";

const DAY = 86400;
const ZERO = BigNumber.from(0);
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const INITIAL_AMOUNT = utils.parseEther('1000');
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffff';

async function latestBlocktime(provider: Provider): Promise<number> {
    const {timestamp} = await provider.getBlock('latest');
    return timestamp;
}

async function latestBlocknumber(provider: Provider): Promise<number> {
    return await provider.getBlockNumber();
}

describe('RewardPool.test', () => {
    const {provider} = ethers;

    let operator: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;
    let david: SignerWithAddress;

    before('provider & accounts setting', async () => {
        [operator, bob, carol, david] = await ethers.getSigners();
    });

    // core
    let RewardPool: ContractFactory;
    let vBSWAP: ContractFactory;
    let TToken: ContractFactory;

    before('fetch contract factories', async () => {
        RewardPool = await ethers.getContractFactory('RewardPool');
        vBSWAP = await ethers.getContractFactory('vBSWAP');
        TToken = await ethers.getContractFactory('TToken');
    });

    let pool: Contract;
    let vbswap: Contract;
    let lp: Contract;

    let startBlock: BigNumber;

    before('deploy contracts', async () => {
        vbswap = await vBSWAP.connect(operator).deploy('vBSWAP', 'vBSWAP', 18, toWei('100000'));
        lp = await TToken.connect(operator).deploy('Fake LP', 'LP', 18);

        startBlock = BigNumber.from(10);
        pool = await RewardPool.connect(operator).deploy();
        await pool.initialize(vbswap.address, startBlock);
        await pool.connect(operator).add(1000, lp.address, false, 0);

        await vbswap.addMinter(pool.address);
    });

    describe('#constructor', () => {
        it('should works correctly', async () => {
            expect(String(await pool.startBlock())).to.eq('10');
            expect(String(await pool.epochEndBlocks(0))).to.eq(String(10 + 28800));
            expect(String(await pool.epochEndBlocks(1))).to.eq(String(10 + 28800 * 29));
            expect(String(await pool.epochEndBlocks(2))).to.eq(String(10 + 28800 * (29 + 28)));
            expect(String(await pool.epochEndBlocks(28))).to.eq(String(10 + 28800 * (29 + 28 * 27)));
            expect(String(await pool.firstEpochRewardPerBlock())).to.eq(String(toWei('0.0124')));
            expect(String(await pool.epochRewardPerBlock(0))).to.eq(String(toWei('0.00124')));
            expect(String(await pool.epochRewardPerBlock(1))).to.eq(String(toWei('0.0124')));
            expect(String(await pool.epochRewardPerBlock(2))).to.eq(String(toWei('0.01116')));
            expect(String(await pool.epochRewardPerBlock(10))).to.eq(String(toWei('0.0048040140636')));
            expect(String(await pool.epochRewardPerBlock(20))).to.eq(String(toWei('0.001675056129914508')));
            expect(String(await pool.epochRewardPerBlock(27))).to.eq(String(toWei('0.000801174154264104')));
            expect(String(await pool.epochRewardPerBlock(28))).to.eq(String(toWei('0.000721056738837693')));
            expect(String(await pool.epochRewardPerBlock(29))).to.eq(String(toWei('0')));
            expect(String(await pool.getGeneratedReward(10, 11))).to.eq(String(toWei('0.00124')));
            expect(String(await pool.getGeneratedReward(20, 30))).to.eq(String(toWei('0.0124')));
            expect(String(await pool.getGeneratedReward(28809, 28810))).to.eq(String(toWei('0.00124')));
            expect(String(await pool.getGeneratedReward(28810, 28811))).to.eq(String(toWei('0.0124')));
        });
    });

    describe('#deposit/withdraw', () => {
        it('bob deposit 10 DAI', async () => {
            await lp.mint(bob.address, toWei('1000'));
            await lp.connect(bob).approve(pool.address, maxUint256);
            await pool.connect(bob).deposit(0, toWei('10'));
        });

        it('bob withdraw 10 DAI', async () => {
            await mineBlocks(ethers, 10);
            console.log('bob pending reward = %s', fromWei(await pool.pendingReward(0, bob.address)));
            await pool.connect(bob).withdraw(0, toWei('10'));
            console.log('bob vBSWAP = %s', fromWei(await vbswap.balanceOf(bob.address)));
        });

        it('bob deposit for carol', async () => {
            await pool.setExchangeProxy(bob.address);
            await pool.connect(bob).depositFor(carol.address, 0, toWei('10'));
            await pool.setExchangeProxy(ADDRESS_ZERO);
            await mineBlocks(ethers, 10);
            console.log('carol pending reward = %s', fromWei(await pool.pendingReward(0, carol.address)));
            await pool.connect(carol).withdraw(0, toWei('10'));
            console.log('carol vBSWAP = %s', fromWei(await vbswap.balanceOf(carol.address)));
        });

        it('bob withdraw for carol', async () => {
            if (pool.withdrawFor) { // has the function
                await lp.connect(carol).approve(pool.address, maxUint256);
                await pool.connect(carol).deposit(0, toWei('10'));
                await expect(pool.connect(bob).withdrawFor(carol.address, 0, toWei('10'))).to.revertedWith('RewardPool: caller is not the exchangeProxy');
                await pool.setExchangeProxy(bob.address);
                await expect(async () => {
                    await pool.connect(bob).withdrawFor(carol.address, 0, toWei('10'));
                }).to.changeTokenBalances(lp, [carol, pool], [toWei('10'), toWei('-10')]);
            }
        });
    });
});
