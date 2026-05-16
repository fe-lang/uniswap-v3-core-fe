import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import { ethers, network, waffle } from 'hardhat'
import { TestUniswapV3SwapPay } from '../typechain/TestUniswapV3SwapPay'
import { TestERC20 } from '../typechain/TestERC20'
import { poolFixture } from './shared/fixtures'
import { constants } from 'ethers'

const createFixtureLoader = waffle.createFixtureLoader

describe('TestUniswapV3SwapPay', () => {
  let wallet: any
  let swapPay: TestUniswapV3SwapPay
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

  beforeEach('deploy swap pay', async () => {
    const fixture = await loadFixture(poolFixture)
    const pool = await fixture.createPool(3000, 60)
    token0 = fixture.token0
    token1 = fixture.token1
    poolAddress = pool.address

    const swapPayFactory = await getContractFactory('TestUniswapV3SwapPay')
    swapPay = (await swapPayFactory.deploy()) as TestUniswapV3SwapPay
  })

  it('accepts a zero-payment callback payload', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 0, 0])

    await expect(swapPay.uniswapV3SwapCallback(0, 0, data)).to.not.be.reverted
  })

  it('pays token0 during swap callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 18, 0])
    await token0.approve(swapPay.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(swapPay.connect(poolSigner).uniswapV3SwapCallback(0, 0, data))
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, poolAddress, 18)
    })
  })

  it('pays token1 during swap callback', async () => {
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 0, 19])
    await token1.approve(swapPay.address, constants.MaxUint256)

    await withPoolSigner(async (poolSigner) => {
      await expect(swapPay.connect(poolSigner).uniswapV3SwapCallback(0, 0, data))
        .to.emit(token1, 'Transfer')
        .withArgs(wallet.address, poolAddress, 19)
    })
  })
})
