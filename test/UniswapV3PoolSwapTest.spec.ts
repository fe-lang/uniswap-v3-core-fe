import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import { ethers } from 'hardhat'
import { UniswapV3PoolSwapTest } from '../typechain/UniswapV3PoolSwapTest'

describe('UniswapV3PoolSwapTest', () => {
  let swapTest: UniswapV3PoolSwapTest

  beforeEach('deploy swap test', async () => {
    const swapTestFactory = await getContractFactory('UniswapV3PoolSwapTest')
    swapTest = (await swapTestFactory.deploy()) as UniswapV3PoolSwapTest
  })

  it('accepts a zero-delta callback payload', async () => {
    const [wallet] = await ethers.getSigners()
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])

    await expect(swapTest.uniswapV3SwapCallback(0, 0, data)).to.not.be.reverted
  })
})
