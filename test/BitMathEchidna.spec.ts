import { ethers, waffle } from 'hardhat'
import { BitMathEchidnaTest } from '../typechain/BitMathEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'

const { BigNumber } = ethers

describe('BitMathEchidnaTest', () => {
  let bitMath: BitMathEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('BitMathEchidnaTest')
    return (await factory.deploy()) as BitMathEchidnaTest
  }

  beforeEach('deploy BitMathEchidnaTest', async () => {
    bitMath = await waffle.loadFixture(fixture)
  })

  it('checks most significant bit invariant for representative inputs', async () => {
    await bitMath.mostSignificantBitInvariant(1)
    await bitMath.mostSignificantBitInvariant(2)
    await bitMath.mostSignificantBitInvariant(BigNumber.from(2).pow(128))
    await bitMath.mostSignificantBitInvariant(BigNumber.from(2).pow(256).sub(1))
  })

  it('checks least significant bit invariant for representative inputs', async () => {
    await bitMath.leastSignificantBitInvariant(1)
    await bitMath.leastSignificantBitInvariant(2)
    await bitMath.leastSignificantBitInvariant(BigNumber.from(2).pow(128))
    await bitMath.leastSignificantBitInvariant(BigNumber.from(2).pow(256).sub(1))
  })
})
