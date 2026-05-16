import { waffle } from 'hardhat'
import { OracleEchidnaTest } from '../typechain/OracleEchidnaTest'
import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'

describe('OracleEchidnaTest', () => {
  let oracle: OracleEchidnaTest

  const fixture = async () => {
    const factory = await getContractFactory('OracleEchidnaTest')
    return (await factory.deploy()) as OracleEchidnaTest
  }

  beforeEach('deploy OracleEchidnaTest', async () => {
    oracle = await waffle.loadFixture(fixture)
  })

  it('checks basic oracle invariants after initialization', async () => {
    expect(await oracle.callStatic.echidna_indexAlwaysLtCardinality()).to.eq(true)
    expect(await oracle.callStatic.echidna_AlwaysInitialized()).to.eq(true)
    expect(await oracle.callStatic.echidna_cardinalityAlwaysLteNext()).to.eq(true)
    expect(await oracle.callStatic.echidna_canAlwaysObserve0IfInitialized()).to.eq(true)

    await oracle.initialize(0, 0, 1)

    expect(await oracle.callStatic.echidna_indexAlwaysLtCardinality()).to.eq(true)
    expect(await oracle.callStatic.echidna_AlwaysInitialized()).to.eq(true)
    expect(await oracle.callStatic.echidna_cardinalityAlwaysLteNext()).to.eq(true)
    expect(await oracle.callStatic.echidna_canAlwaysObserve0IfInitialized()).to.eq(true)
  })

  it('checks adjacent observation and time weighted average invariants', async () => {
    await oracle.initialize(0, 0, 1)
    await oracle.grow(4)
    await oracle.update(3, 3, 2)
    await oracle.update(4, -7, 6)

    await oracle.checkTwoAdjacentObservationsTickCumulativeModTimeElapsedAlways0(2)
    await oracle.checkTimeWeightedAveragesAlwaysFitsType(4)
  })

  it('checks advanceTime keeps initialized observe-zero valid', async () => {
    await oracle.initialize(5, -2, 3)
    await oracle.advanceTime(7)

    expect(await oracle.callStatic.echidna_canAlwaysObserve0IfInitialized()).to.eq(true)
    expect(await oracle.callStatic.echidna_cardinalityAlwaysLteNext()).to.eq(true)
  })
})
