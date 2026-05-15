import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'
import { ethers } from 'hardhat'
import { TestUniswapV3Callee } from '../typechain/TestUniswapV3Callee'

describe('TestUniswapV3Callee', () => {
  let callee: TestUniswapV3Callee

  beforeEach('deploy callee', async () => {
    const calleeFactory = await getContractFactory('TestUniswapV3Callee')
    callee = (await calleeFactory.deploy()) as TestUniswapV3Callee
  })

  it('emits swap callback deltas', async () => {
    const [wallet] = await ethers.getSigners()
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])

    await expect(callee.uniswapV3SwapCallback(0, 0, data)).to.emit(callee, 'SwapCallback').withArgs(0, 0)
  })

  it('emits mint callback amounts', async () => {
    const [wallet] = await ethers.getSigners()
    const data = ethers.utils.defaultAbiCoder.encode(['address'], [wallet.address])

    await expect(callee.uniswapV3MintCallback(0, 0, data)).to.emit(callee, 'MintCallback').withArgs(0, 0)
  })

  it('emits flash callback fees', async () => {
    const [wallet] = await ethers.getSigners()
    const data = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'uint256'], [wallet.address, 0, 0])

    await expect(callee.uniswapV3FlashCallback(4, 7, data)).to.emit(callee, 'FlashCallback').withArgs(4, 7)
  })
})
