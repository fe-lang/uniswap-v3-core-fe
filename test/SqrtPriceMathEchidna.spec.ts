import { waffle } from 'hardhat'
import { SqrtPriceMathEchidnaTest } from '../typechain/SqrtPriceMathEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'
import { encodePriceSqrt, expandTo18Decimals } from './shared/utilities'

describe('SqrtPriceMathEchidnaTest', () => {
  let sqrtPriceMath: SqrtPriceMathEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('SqrtPriceMathEchidnaTest')
    return (await factory.deploy()) as SqrtPriceMathEchidnaTest
  }

  beforeEach('deploy SqrtPriceMathEchidnaTest', async () => {
    sqrtPriceMath = await waffle.loadFixture(fixture)
  })

  it('checks rounding relationships for representative inputs', async () => {
    await sqrtPriceMath.mulDivRoundingUpInvariants(35, 8, 10)
    await sqrtPriceMath.mulDivRoundingUpInvariants(6, 7, 5)
  })

  it('checks next sqrt price input and output invariants', async () => {
    const price = encodePriceSqrt(1, 1)
    const liquidity = expandTo18Decimals(1)
    const amount = expandTo18Decimals(1).div(10)

    await sqrtPriceMath.getNextSqrtPriceFromInputInvariants(price, liquidity, amount, true)
    await sqrtPriceMath.getNextSqrtPriceFromInputInvariants(price, liquidity, amount, false)
    await sqrtPriceMath.getNextSqrtPriceFromOutputInvariants(price, liquidity, amount, true)
    await sqrtPriceMath.getNextSqrtPriceFromOutputInvariants(price, liquidity, amount, false)
  })

  it('checks amount-specific next sqrt price invariants', async () => {
    const price = encodePriceSqrt(1, 1)
    const liquidity = expandTo18Decimals(1)
    const amount = expandTo18Decimals(1).div(10)

    await sqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUpInvariants(price, liquidity, amount, true)
    await sqrtPriceMath.getNextSqrtPriceFromAmount0RoundingUpInvariants(price, liquidity, amount, false)
    await sqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDownInvariants(price, liquidity, amount, true)
    await sqrtPriceMath.getNextSqrtPriceFromAmount1RoundingDownInvariants(price, liquidity, amount, false)
  })

  it('checks amount delta invariants', async () => {
    const price = encodePriceSqrt(1, 1)
    const higherPrice = encodePriceSqrt(121, 100)
    const liquidity = expandTo18Decimals(1)

    await sqrtPriceMath.getAmount0DeltaInvariants(price, higherPrice, liquidity)
    await sqrtPriceMath.getAmount0DeltaEquivalency(higherPrice, price, liquidity, true)
    await sqrtPriceMath.getAmount0DeltaEquivalency(higherPrice, price, liquidity, false)
    await sqrtPriceMath.getAmount1DeltaInvariants(price, higherPrice, liquidity)
  })

  it('checks signed delta and mint invariants', async () => {
    const price = encodePriceSqrt(1, 1)
    const higherPrice = encodePriceSqrt(121, 100)
    const liquidity = expandTo18Decimals(1)

    await sqrtPriceMath.getAmount0DeltaSignedInvariants(price, higherPrice, 1000)
    await sqrtPriceMath.getAmount0DeltaSignedInvariants(price, higherPrice, -1000)
    await sqrtPriceMath.getAmount1DeltaSignedInvariants(price, higherPrice, 1000)
    await sqrtPriceMath.getAmount1DeltaSignedInvariants(price, higherPrice, -1000)
    await sqrtPriceMath.getOutOfRangeMintInvariants(price, higherPrice, 1000)
    await sqrtPriceMath.getInRangeMintInvariants(price, price, higherPrice, liquidity)
  })
})
