import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import { ethers } from 'hardhat'
import { TestUniswapV3SwapPay } from '../typechain/TestUniswapV3SwapPay'

describe('TestUniswapV3SwapPay', () => {
  let swapPay: TestUniswapV3SwapPay

  beforeEach('deploy swap pay', async () => {
    const swapPayFactory = await getContractFactory('TestUniswapV3SwapPay')
    swapPay = (await swapPayFactory.deploy()) as TestUniswapV3SwapPay
  })

  it('accepts a zero-payment callback payload', async () => {
    const [wallet] = await ethers.getSigners()
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 0, 0])

    await expect(swapPay.uniswapV3SwapCallback(0, 0, data)).to.not.be.reverted
  })
})
