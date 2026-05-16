import { expect } from './shared/expect'
import { ethers, network, waffle } from 'hardhat'
import { TestUniswapV3Router } from '../typechain/TestUniswapV3Router'
import { TestERC20 } from '../typechain/TestERC20'
import { poolFixture } from './shared/fixtures'
import { constants } from 'ethers'

const createFixtureLoader = waffle.createFixtureLoader

describe('TestUniswapV3Router', () => {
  let wallet: any
  let router: TestUniswapV3Router
  let token0: TestERC20
  let token1: TestERC20
  let poolAddress: string

  let loadFixture: ReturnType<typeof createFixtureLoader>

  before('create fixture loader', async () => {
    ;[wallet] = await ethers.getSigners()
    loadFixture = createFixtureLoader([wallet])
  })

  beforeEach('deploy router fixture', async () => {
    const fixture = await loadFixture(poolFixture)
    const { createPool, swapTargetRouter } = fixture
    const pool = await createPool(3000, 60)
    token0 = fixture.token0
    token1 = fixture.token1
    router = swapTargetRouter
    poolAddress = pool.address
  })

  it('emits swap callback deltas for an empty route', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address[]', 'address'], [[], wallet.address])
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [poolAddress],
    })
    await network.provider.send('hardhat_setBalance', [poolAddress, '0x1000000000000000000'])
    const poolSigner = await ethers.getSigner(poolAddress)

    await expect(router.connect(poolSigner).uniswapV3SwapCallback(0, 0, data))
      .to.emit(router, 'SwapCallback')
      .withArgs(0, 0)

    await network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [poolAddress],
    })
  })

  it('pays token0 to the pool for an empty route', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address[]', 'address'], [[], wallet.address])
    await token0.approve(router.address, constants.MaxUint256)
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [poolAddress],
    })
    await network.provider.send('hardhat_setBalance', [poolAddress, '0x1000000000000000000'])
    const poolSigner = await ethers.getSigner(poolAddress)

    await expect(router.connect(poolSigner).uniswapV3SwapCallback(10, 0, data))
      .to.emit(token0, 'Transfer')
      .withArgs(wallet.address, poolAddress, 10)

    await network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [poolAddress],
    })
  })

  it('pays token1 to the pool for an empty route', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address[]', 'address'], [[], wallet.address])
    await token1.approve(router.address, constants.MaxUint256)
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [poolAddress],
    })
    await network.provider.send('hardhat_setBalance', [poolAddress, '0x1000000000000000000'])
    const poolSigner = await ethers.getSigner(poolAddress)

    await expect(router.connect(poolSigner).uniswapV3SwapCallback(0, 11, data))
      .to.emit(token1, 'Transfer')
      .withArgs(wallet.address, poolAddress, 11)

    await network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [poolAddress],
    })
  })
})
