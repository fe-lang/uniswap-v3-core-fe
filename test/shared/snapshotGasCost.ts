import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'
import { expect } from './expect'
import { Contract, BigNumber, ContractTransaction } from 'ethers'
import { network } from 'hardhat'

interface StructLog {
  op: string
  gasCost: number
  depth: number
}

async function printTrace(txHash: string): Promise<void> {
  if (process.env.PRINT_TRACE !== '1') return

  const trace = (await network.provider.send('debug_traceTransaction', [
    txHash,
    { disableMemory: true, disableStack: true, disableStorage: true },
  ])) as { structLogs: StructLog[] }
  const byOp = new Map<string, number>()
  const byDepthOp = new Map<string, number>()
  for (const log of trace.structLogs) {
    byOp.set(log.op, (byOp.get(log.op) ?? 0) + log.gasCost)
    const depthOp = `${log.depth}:${log.op}`
    byDepthOp.set(depthOp, (byDepthOp.get(depthOp) ?? 0) + log.gasCost)
  }
  const topOps = [...byOp].sort((a, b) => b[1] - a[1]).slice(0, 25)
  const topDepthOps = [...byDepthOp].sort((a, b) => b[1] - a[1]).slice(0, 35)
  console.log(`TRACE_OPS ${JSON.stringify(topOps)}`)
  console.log(`TRACE_DEPTH_OPS ${JSON.stringify(topDepthOps)}`)
}

export default async function snapshotGasCost(
  x:
    | TransactionResponse
    | Promise<TransactionResponse>
    | ContractTransaction
    | Promise<ContractTransaction>
    | TransactionReceipt
    | Promise<BigNumber>
    | BigNumber
    | Contract
    | Promise<Contract>
): Promise<void> {
  const resolved = await x
  const printGas = process.env.PRINT_GAS === '1'
  const printOnly = process.env.PRINT_GAS_ONLY === '1'

  if ('deployTransaction' in resolved) {
    const receipt = await resolved.deployTransaction.wait()
    await printTrace(receipt.transactionHash)
    if (printGas) console.log(`GAS ${receipt.gasUsed.toNumber()}`)
    if (printOnly || process.env.FE_ARTIFACTS === '1') return
    expect(receipt.gasUsed.toNumber()).toMatchSnapshot()
  } else if ('wait' in resolved) {
    const waited = await resolved.wait()
    await printTrace(waited.transactionHash)
    if (printGas) console.log(`GAS ${waited.gasUsed.toNumber()}`)
    if (printOnly || process.env.FE_ARTIFACTS === '1') return
    expect(waited.gasUsed.toNumber()).toMatchSnapshot()
  } else if (BigNumber.isBigNumber(resolved)) {
    if (printGas) console.log(`GAS ${resolved.toNumber()}`)
    if (printOnly || process.env.FE_ARTIFACTS === '1') return
    expect(resolved.toNumber()).toMatchSnapshot()
  }
}
