import { BigNumber } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'

describe('TestERC20', () => {
  const fixture = async () => {
    const [wallet, other, third] = await (ethers as any).getSigners()
    const factory = await getContractFactory('TestERC20')
    const token = await factory.deploy(100)
    return { token, wallet, other, third }
  }

  it('mints constructor balance to deployer', async () => {
    const { token, wallet } = await waffle.loadFixture(fixture)
    expect(await token.balanceOf(wallet.address)).to.eq(100)
  })

  it('transfers balance and emits Transfer', async () => {
    const { token, wallet, other } = await waffle.loadFixture(fixture)
    await expect(token.transfer(other.address, 40)).to.emit(token, 'Transfer').withArgs(wallet.address, other.address, 40)
    expect(await token.balanceOf(wallet.address)).to.eq(60)
    expect(await token.balanceOf(other.address)).to.eq(40)
  })

  it('approves allowance and emits Approval', async () => {
    const { token, wallet, other } = await waffle.loadFixture(fixture)
    await expect(token.approve(other.address, 55)).to.emit(token, 'Approval').withArgs(wallet.address, other.address, 55)
    expect(await token.allowance(wallet.address, other.address)).to.eq(55)
  })

  it('transfers from allowance', async () => {
    const { token, wallet, other, third } = await waffle.loadFixture(fixture)
    await token.approve(other.address, 70)
    await expect(token.connect(other).transferFrom(wallet.address, third.address, 30))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, third.address, 30)
    expect(await token.balanceOf(wallet.address)).to.eq(70)
    expect(await token.balanceOf(third.address)).to.eq(30)
    expect(await token.allowance(wallet.address, other.address)).to.eq(40)
  })

  it('mints public balance', async () => {
    const { token, other } = await waffle.loadFixture(fixture)
    await token.mint(other.address, BigNumber.from(2).pow(128))
    expect(await token.balanceOf(other.address)).to.eq(BigNumber.from(2).pow(128))
  })
})
