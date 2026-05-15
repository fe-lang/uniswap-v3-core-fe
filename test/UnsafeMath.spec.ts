import { waffle } from 'hardhat'
import { getContractFactory } from './shared/feArtifacts'

describe('UnsafeMath', () => {
  const fixture = async () => {
    const factory = await getContractFactory('UnsafeMathEchidnaTest')
    return factory.deploy()
  }

  it('rounds exact division down', async () => {
    const unsafeMath = await waffle.loadFixture(fixture)
    await unsafeMath.checkDivRoundingUp(10, 5)
  })

  it('rounds inexact division up', async () => {
    const unsafeMath = await waffle.loadFixture(fixture)
    await unsafeMath.checkDivRoundingUp(11, 5)
  })

})
