import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import { ethers, network, waffle } from 'hardhat'
import { TestUniswapV3Callee } from '../typechain/TestUniswapV3Callee'
import { TestERC20 } from '../typechain/TestERC20'
import { poolFixture } from './shared/fixtures'
import { constants } from 'ethers'

const createFixtureLoader = waffle.createFixtureLoader

describe('TestUniswapV3Callee', () => {
  let wallet: any
  let callee: TestUniswapV3Callee
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

  beforeEach('deploy callee', async () => {
    const fixture = await loadFixture(poolFixture)
    const pool = await fixture.createPool(3000, 60)
    callee = fixture.swapTargetCallee
    token0 = fixture.token0
    token1 = fixture.token1
    poolAddress = pool.address
  })

  it('emits swap callback deltas', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])

    await expect(callee.uniswapV3SwapCallback(0, 0, data)).to.emit(callee, 'SwapCallback').withArgs(0, 0)
  })

  it('emits mint callback amounts', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])

    await expect(callee.uniswapV3MintCallback(0, 0, data)).to.emit(callee, 'MintCallback').withArgs(0, 0)
  })

  it('emits flash callback fees', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 0, 0])

    await expect(callee.uniswapV3FlashCallback(4, 7, data)).to.emit(callee, 'FlashCallback').withArgs(4, 7)
  })

  it('pays token0 during swap callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])
    await token0.approve(callee.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(callee.connect(poolSigner).uniswapV3SwapCallback(12, 0, data))
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, poolAddress, 12)
    })
  })

  it('pays token1 during swap callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])
    await token1.approve(callee.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(callee.connect(poolSigner).uniswapV3SwapCallback(0, 13, data))
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, poolAddress, 13)
    })
  })

  it('pays owed tokens during mint callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])
    await token0.approve(callee.address, constants.MaxUint256)
    await token1.approve(callee.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(callee.connect(poolSigner).uniswapV3MintCallback(14, 15, data))
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, poolAddress, 14)
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, poolAddress, 15)
    })
  })

  it('pays requested tokens during flash callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 16, 17])
    await token0.approve(callee.address, constants.MaxUint256)
    await token1.approve(callee.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(callee.connect(poolSigner).uniswapV3FlashCallback(4, 7, data))
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, poolAddress, 16)
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, poolAddress, 17)
    })
  })
})
