import { waffle } from 'hardhat'
import { TickBitmapEchidnaTest } from '../typechain/TickBitmapEchidnaTest'
import { getContractFactory } from './shared/feArtifacts'

describe('TickBitmapEchidnaTest', () => {
  let tickBitmap: TickBitmapEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('TickBitmapEchidnaTest')
    return (await factory.deploy()) as TickBitmapEchidnaTest
  }

  beforeEach('deploy TickBitmapEchidnaTest', async () => {
    tickBitmap = await waffle.loadFixture(fixture)
  })

  it('checks flipTick toggles representative ticks', async () => {
    await tickBitmap.flipTick(-230)
    await tickBitmap.flipTick(-230)
    await tickBitmap.flipTick(0)
    await tickBitmap.flipTick(257)
  })

  it('checks next initialized tick invariants in both directions', async () => {
    await tickBitmap.flipTick(-200)
    await tickBitmap.flipTick(-55)
    await tickBitmap.flipTick(78)
    await tickBitmap.flipTick(535)

    await tickBitmap.checkNextInitializedTickWithinOneWordInvariants(-55, true)
    await tickBitmap.checkNextInitializedTickWithinOneWordInvariants(79, true)
    await tickBitmap.checkNextInitializedTickWithinOneWordInvariants(-56, false)
    await tickBitmap.checkNextInitializedTickWithinOneWordInvariants(255, false)
  })
})
