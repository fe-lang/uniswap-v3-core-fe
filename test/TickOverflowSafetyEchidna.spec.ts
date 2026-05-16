import { waffle } from 'hardhat'
import { TickOverflowSafetyEchidnaTest } from '../typechain/TickOverflowSafetyEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'

describe('TickOverflowSafetyEchidnaTest', () => {
  let tick: TickOverflowSafetyEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('TickOverflowSafetyEchidnaTest')
    return (await factory.deploy()) as TickOverflowSafetyEchidnaTest
  }

  beforeEach('deploy TickOverflowSafetyEchidnaTest', async () => {
    tick = await waffle.loadFixture(fixture)
  })

  it('checks fee growth overflow while moving across a position', async () => {
    await tick.setPosition(-1, 1, 1000)
    await tick.increaseFeeGrowthGlobal0X128(1)
    await tick.increaseFeeGrowthGlobal1X128(2)
    await tick.moveToTick(1)
    await tick.moveToTick(-1)
    await tick.setPosition(-1, 1, -1000)
  })

  it('checks adjacent positions can be added and removed safely', async () => {
    await tick.setPosition(-2, 0, 500)
    await tick.setPosition(0, 2, 700)
    await tick.moveToTick(2)
    await tick.setPosition(-2, 0, -500)
    await tick.moveToTick(0)
    await tick.setPosition(0, 2, -700)
  })
})
