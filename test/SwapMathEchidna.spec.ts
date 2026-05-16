import { BigNumber } from 'ethers'
import { waffle } from 'hardhat'
import { SwapMathEchidnaTest } from '../typechain/SwapMathEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'
import { encodePriceSqrt, expandTo18Decimals } from './shared/utilities'

describe('SwapMathEchidnaTest', () => {
  let swapMath: SwapMathEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('SwapMathEchidnaTest')
    return (await factory.deploy()) as SwapMathEchidnaTest
  }

  beforeEach('deploy SwapMathEchidnaTest', async () => {
    swapMath = await waffle.loadFixture(fixture)
  })

  it('checks computeSwapStep invariants for representative inputs', async () => {
    const price = encodePriceSqrt(1, 1)
    const liquidity = expandTo18Decimals(2)

    await swapMath.checkComputeSwapStepInvariants(price, price, liquidity, expandTo18Decimals(1), 600)
    await swapMath.checkComputeSwapStepInvariants(
      price,
      encodePriceSqrt(101, 100),
      liquidity,
      expandTo18Decimals(1),
      600
    )
    await swapMath.checkComputeSwapStepInvariants(
      price,
      encodePriceSqrt(101, 100),
      liquidity,
      expandTo18Decimals(1).mul(-1),
      600
    )
    await swapMath.checkComputeSwapStepInvariants(
      BigNumber.from('417332158212080721273783715441582'),
      BigNumber.from('1452870262520218020823638996'),
      '159344665391607089467575320103',
      '-1',
      1
    )
  })
})
