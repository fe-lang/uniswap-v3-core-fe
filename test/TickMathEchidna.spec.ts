import { BigNumber } from 'ethers'
import { waffle } from 'hardhat'
import { TickMathEchidnaTest } from '../typechain/TickMathEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'
import { MAX_SQRT_RATIO, MIN_SQRT_RATIO, encodePriceSqrt } from './shared/utilities'

const MIN_TICK = -887272
const MAX_TICK = 887272

describe('TickMathEchidnaTest', () => {
  let tickMath: TickMathEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('TickMathEchidnaTest')
    return (await factory.deploy()) as TickMathEchidnaTest
  }

  beforeEach('deploy TickMathEchidnaTest', async () => {
    tickMath = await waffle.loadFixture(fixture)
  })

  it('checks sqrt ratio invariants for representative ticks', async () => {
    await tickMath.checkGetSqrtRatioAtTickInvariants(MIN_TICK + 1)
    await tickMath.checkGetSqrtRatioAtTickInvariants(-1)
    await tickMath.checkGetSqrtRatioAtTickInvariants(0)
    await tickMath.checkGetSqrtRatioAtTickInvariants(1)
    await tickMath.checkGetSqrtRatioAtTickInvariants(MAX_TICK - 1)
  })

  it('checks tick invariants for representative ratios', async () => {
    await tickMath.checkGetTickAtSqrtRatioInvariants(MIN_SQRT_RATIO)
    await tickMath.checkGetTickAtSqrtRatioInvariants(encodePriceSqrt(1, 1))
    await tickMath.checkGetTickAtSqrtRatioInvariants(BigNumber.from('79228162514264337593543950336000'))
    await tickMath.checkGetTickAtSqrtRatioInvariants(MAX_SQRT_RATIO.sub(1))
  })
})
