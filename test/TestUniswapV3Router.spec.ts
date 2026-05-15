import { expect } from './shared/expect'
import { ethers, network, waffle } from 'hardhat'
import { TestUniswapV3Router } from '../typechain/TestUniswapV3Router'
import { poolFixture } from './shared/fixtures'

const createFixtureLoader = waffle.createFixtureLoader

describe('TestUniswapV3Router', () => {
  let wallet: any
  let router: TestUniswapV3Router
  let poolAddress: string

  let loadFixture: ReturnType<typeof createFixtureLoader>

  before('create fixture loader', async () => {
    ;[wallet] = await ethers.getSigners()
    loadFixture = createFixtureLoader([wallet])
  })

  beforeEach('deploy router fixture', async () => {
    const { createPool, swapTargetRouter } = await loadFixture(poolFixture)
    const pool = await createPool(3000, 60)
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
})
