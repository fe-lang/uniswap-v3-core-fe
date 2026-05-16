import { ethers, waffle } from 'hardhat'
import { FullMathEchidnaTest } from '../typechain/FullMathEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'

const {
  BigNumber,
  constants: { MaxUint256 },
} = ethers
const Q128 = BigNumber.from(2).pow(128)

describe('FullMathEchidnaTest', () => {
  let fullMath: FullMathEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('FullMathEchidnaTest')
    return (await factory.deploy()) as FullMathEchidnaTest
  }

  beforeEach('deploy FullMathEchidnaTest', async () => {
    fullMath = await waffle.loadFixture(fixture)
  })

  it('checks floor and ceiling relationship for representative inputs', async () => {
    await fullMath.checkMulDivRounding(35, 8, 10)
    await fullMath.checkMulDivRounding(6, 7, 5)
    await fullMath.checkMulDivRounding(Q128, BigNumber.from(35).mul(Q128), BigNumber.from(8).mul(Q128))
    await fullMath.checkMulDivRounding(MaxUint256, MaxUint256, MaxUint256)
  })

  it('checks floor recomposition invariant for representative inputs', async () => {
    await fullMath.checkMulDiv(0, 7, 5)
    await fullMath.checkMulDiv(6, 7, 5)
    await fullMath.checkMulDiv(Q128, BigNumber.from(35).mul(Q128), BigNumber.from(8).mul(Q128))
    await fullMath.checkMulDiv(MaxUint256, MaxUint256, MaxUint256)
  })

  it('checks ceiling recomposition invariant for representative inputs', async () => {
    await fullMath.checkMulDivRoundingUp(0, 7, 5)
    await fullMath.checkMulDivRoundingUp(6, 7, 5)
    await fullMath.checkMulDivRoundingUp(Q128, BigNumber.from(35).mul(Q128), BigNumber.from(8).mul(Q128))
    await fullMath.checkMulDivRoundingUp(MaxUint256, MaxUint256, MaxUint256)
  })
})
