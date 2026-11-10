import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { OracleTest } from '../typechain/OracleTest'
import { expect } from './shared/expect'
import { getContractFactory } from './shared/feArtifacts'

describe('Oracle return encoding', () => {
  let oracle: OracleTest

  beforeEach(async () => {
    oracle = (await (await getContractFactory('OracleTest')).deploy()) as OracleTest
    await oracle.initialize({ time: 0, tick: -3, liquidity: 8 })
    await oracle.grow(2)
    await oracle.update({ advanceTimeBy: 4, tick: 5, liquidity: 8 })
    await oracle.advanceTime(4)
  })

  for (const length of [0, 1, 2, 3, 8, 17, 32, 64]) {
    it(`returns canonical ABI for ${length} mixed history queries`, async () => {
      const secondsAgos = Array.from({ length }, (_, i) => (i * 7 + 3) % 9)
      const ticks = secondsAgos.map((ago) => (ago <= 4 ? 8 - 5 * ago : -3 * (8 - ago)))
      const seconds = secondsAgos.map((ago) => BigNumber.from(8 - ago).shl(125))
      const data = oracle.interface.encodeFunctionData('observe', [secondsAgos])
      const result = await ethers.provider.call({ to: oracle.address, data })
      expect(result).to.eq(ethers.utils.defaultAbiCoder.encode(['int56[]', 'uint160[]'], [ticks, seconds]))
      expect(ethers.utils.arrayify(result).length).to.eq(128 + 64 * length)
      if (process.env.PRINT_GAS === '1') {
        const gas = await oracle.estimateGas.observe(secondsAgos)
        console.log(`ENCODING_GAS ${JSON.stringify({ length, gas: gas.toNumber() })}`)
      }
    })
  }
})
