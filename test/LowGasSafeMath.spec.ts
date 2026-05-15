import { waffle } from 'hardhat'
import { getContractFactory } from './shared/feArtifacts'

describe('LowGasSafeMath', () => {
  const fixture = async () => {
    const factory = await getContractFactory('LowGasSafeMathEchidnaTest')
    return factory.deploy()
  }

  it('checks uint256 addition', async () => {
    const math = await waffle.loadFixture(fixture)
    await math.checkAdd(1, 2)
  })

  it('checks uint256 subtraction', async () => {
    const math = await waffle.loadFixture(fixture)
    await math.checkSub(2, 1)
  })

  it('checks uint256 multiplication', async () => {
    const math = await waffle.loadFixture(fixture)
    await math.checkMul(2, 3)
  })

  it('checks int256 addition', async () => {
    const math = await waffle.loadFixture(fixture)
    await math.checkAddi(2, -1)
    await math.checkAddi(-2, 1)
  })

  it('checks int256 subtraction', async () => {
    const math = await waffle.loadFixture(fixture)
    await math.checkSubi(2, 1)
    await math.checkSubi(-2, -1)
  })
})
