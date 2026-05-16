import { waffle } from 'hardhat'
import { TickEchidnaTest } from '../typechain/TickEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'

describe('TickEchidnaTest', () => {
  let tick: TickEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('TickEchidnaTest')
    return (await factory.deploy()) as TickEchidnaTest
  }

  beforeEach('deploy TickEchidnaTest', async () => {
    tick = await waffle.loadFixture(fixture)
  })

  it('checks tick spacing parameter invariants for representative spacings', async () => {
    await tick.checkTickSpacingToParametersInvariants(1)
    await tick.checkTickSpacingToParametersInvariants(10)
    await tick.checkTickSpacingToParametersInvariants(60)
    await tick.checkTickSpacingToParametersInvariants(887272)
  })
})
