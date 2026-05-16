import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import { ethers, network, waffle } from 'hardhat'
import { UniswapV3PoolSwapTest } from '../typechain/UniswapV3PoolSwapTest'
import { TestERC20 } from '../typechain/TestERC20'
import { poolFixture } from './shared/fixtures'
import { constants } from 'ethers'

const createFixtureLoader = waffle.createFixtureLoader

describe('UniswapV3PoolSwapTest', () => {
  let wallet: any
  let swapTest: UniswapV3PoolSwapTest
  let token0: TestERC20
  let token1: TestERC20
  let poolAddress: string

  let loadFixture: ReturnType<typeof createFixtureLoader>

  async function withPoolSigner(fn: (poolSigner: any) => Promise<void>): Promise<void> {
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [poolAddress],
    })
    await network.provider.send('hardhat_setBalance', [poolAddress, '0x1000000000000000000'])
    const poolSigner = await ethers.getSigner(poolAddress)
    try {
      await fn(poolSigner)
    } finally {
      await network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [poolAddress],
      })
    }
  }

  before('create fixture loader', async () => {
    ;[wallet] = await ethers.getSigners()
    loadFixture = createFixtureLoader([wallet])
  })

  beforeEach('deploy swap test', async () => {
    const fixture = await loadFixture(poolFixture)
    const pool = await fixture.createPool(3000, 60)
    token0 = fixture.token0
    token1 = fixture.token1
    poolAddress = pool.address

    const swapTestFactory = await getContractFactory('UniswapV3PoolSwapTest')
    swapTest = (await swapTestFactory.deploy()) as UniswapV3PoolSwapTest
  })

  it('accepts a zero-delta callback payload', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])

    await expect(swapTest.uniswapV3SwapCallback(0, 0, data)).to.not.be.reverted
  })

  it('pays token0 during swap callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])
    await token0.approve(swapTest.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(swapTest.connect(poolSigner).uniswapV3SwapCallback(20, 0, data))
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, poolAddress, 20)
    })
  })

  it('pays token1 during swap callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])
    await token1.approve(swapTest.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(swapTest.connect(poolSigner).uniswapV3SwapCallback(0, 21, data))
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, poolAddress, 21)
    })
  })
})
