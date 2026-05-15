import { BigNumber, constants } from 'ethers'
import { ethers } from 'hardhat'
import { MockTimeUniswapV3Pool } from '../typechain/MockTimeUniswapV3Pool'
import { TestERC20 } from '../typechain/TestERC20'
import { TestUniswapV3Callee } from '../typechain/TestUniswapV3Callee'
import { TestUniswapV3ReentrantCallee } from '../typechain/TestUniswapV3ReentrantCallee'
import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import {
  encodePriceSqrt,
  expandTo18Decimals,
  FeeAmount,
  getMaxTick,
  getMinTick,
  TICK_SPACINGS,
} from './shared/utilities'

describe('TestUniswapV3ReentrantCallee', () => {
  async function createSolidityPool(): Promise<MockTimeUniswapV3Pool> {
    const tokenFactory = await ethers.getContractFactory('TestERC20')
    const tokenA = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
    const tokenB = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
    const [token0, token1] = [tokenA, tokenB].sort((a, b) =>
      a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1
    )

    const factory = await (await ethers.getContractFactory('UniswapV3Factory')).deploy()
    const deployer = await (await ethers.getContractFactory('MockTimeUniswapV3PoolDeployer')).deploy()
    const fee = FeeAmount.MEDIUM
    const tickSpacing = TICK_SPACINGS[fee]
    const tx = await deployer.deploy(factory.address, token0.address, token1.address, fee, tickSpacing)
    const receipt = await tx.wait()
    const poolAddress = receipt.events?.[0].args?.pool as string
    const pool = (await ethers.getContractFactory('MockTimeUniswapV3Pool')).attach(poolAddress) as MockTimeUniswapV3Pool

    const callee = (await (await ethers.getContractFactory('TestUniswapV3Callee')).deploy()) as TestUniswapV3Callee
    await token0.approve(callee.address, constants.MaxUint256)
    await token1.approve(callee.address, constants.MaxUint256)
    await pool.initialize(encodePriceSqrt(1, 1))
    await callee.mint(
      pool.address,
      (await ethers.provider.getSigner(0).getAddress()),
      getMinTick(tickSpacing),
      getMaxTick(tickSpacing),
      expandTo18Decimals(1)
    )

    return pool
  }

  it('checks every locked pool entrypoint during the swap callback', async () => {
    const pool = await createSolidityPool()
    const reentrant = (await (
      await getContractFactory('TestUniswapV3ReentrantCallee')
    ).deploy()) as TestUniswapV3ReentrantCallee

    await expect(reentrant.swapToReenter(pool.address)).to.be.revertedWith('Unable to reenter')
  })
})
