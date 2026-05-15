const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const feRoot = path.join(repoRoot, 'fe')
const feOutDir = path.join(feRoot, 'out')
const hardhatOutDir = path.join(feRoot, 'hardhat-artifacts')
const feBin = process.env.FE_BIN || '/Users/sean/code/fe/pr-review/target/release/fe'
const contracts = process.argv.slice(2)

const abiOverrides = {
  SwapMathTest: [
    {
      type: 'function',
      name: 'computeSwapStep',
      inputs: [
        { name: 'sqrtP', type: 'uint160' },
        { name: 'sqrtPTarget', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amountRemaining', type: 'int256' },
        { name: 'feePips', type: 'uint24' },
      ],
      outputs: [
        { name: 'sqrtQ', type: 'uint160' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOut', type: 'uint256' },
        { name: 'feeAmount', type: 'uint256' },
      ],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getGasCostOfComputeSwapStep',
      inputs: [
        { name: 'sqrtP', type: 'uint160' },
        { name: 'sqrtPTarget', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amountRemaining', type: 'int256' },
        { name: 'feePips', type: 'uint24' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ],
  SqrtPriceMathTest: [
    {
      type: 'function',
      name: 'getNextSqrtPriceFromInput',
      inputs: [
        { name: 'sqrtP', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'zeroForOne', type: 'bool' },
      ],
      outputs: [{ name: 'sqrtQ', type: 'uint160' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getGasCostOfGetNextSqrtPriceFromInput',
      inputs: [
        { name: 'sqrtP', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'zeroForOne', type: 'bool' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getNextSqrtPriceFromOutput',
      inputs: [
        { name: 'sqrtP', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amountOut', type: 'uint256' },
        { name: 'zeroForOne', type: 'bool' },
      ],
      outputs: [{ name: 'sqrtQ', type: 'uint160' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getGasCostOfGetNextSqrtPriceFromOutput',
      inputs: [
        { name: 'sqrtP', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amountOut', type: 'uint256' },
        { name: 'zeroForOne', type: 'bool' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getAmount0Delta',
      inputs: [
        { name: 'sqrtLower', type: 'uint160' },
        { name: 'sqrtUpper', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'roundUp', type: 'bool' },
      ],
      outputs: [{ name: 'amount0', type: 'uint256' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getAmount1Delta',
      inputs: [
        { name: 'sqrtLower', type: 'uint160' },
        { name: 'sqrtUpper', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'roundUp', type: 'bool' },
      ],
      outputs: [{ name: 'amount1', type: 'uint256' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getGasCostOfGetAmount0Delta',
      inputs: [
        { name: 'sqrtLower', type: 'uint160' },
        { name: 'sqrtUpper', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'roundUp', type: 'bool' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getGasCostOfGetAmount1Delta',
      inputs: [
        { name: 'sqrtLower', type: 'uint160' },
        { name: 'sqrtUpper', type: 'uint160' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'roundUp', type: 'bool' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ],
}

function prefixedHex(hex) {
  const trimmed = hex.trim()
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
}

function runFeBuild(contract) {
  const args = ['build', feRoot, '--out-dir', feOutDir]
  if (contract) args.push('--contract', contract)

  const result = spawnSync(feBin, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function artifactNames() {
  if (contracts.length > 0) return contracts

  return fs
    .readdirSync(feOutDir)
    .filter((name) => name.endsWith('.abi.json'))
    .map((name) => name.slice(0, -'.abi.json'.length))
}

function writeHardhatArtifact(contractName) {
  const abiPath = path.join(feOutDir, `${contractName}.abi.json`)
  const bytecodePath = path.join(feOutDir, `${contractName}.bin`)
  const runtimePath = path.join(feOutDir, `${contractName}.runtime.bin`)
  const abi = abiOverrides[contractName] || JSON.parse(fs.readFileSync(abiPath, 'utf8'))

  const artifact = {
    _format: 'hh-sol-artifact-1',
    contractName,
    sourceName: `fe/${contractName}.fe`,
    abi,
    bytecode: prefixedHex(fs.readFileSync(bytecodePath, 'utf8')),
    deployedBytecode: prefixedHex(fs.readFileSync(runtimePath, 'utf8')),
    linkReferences: {},
    deployedLinkReferences: {},
  }

  fs.mkdirSync(hardhatOutDir, { recursive: true })
  const outPath = path.join(hardhatOutDir, `${contractName}.json`)
  fs.writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`)
  console.log(`Wrote ${path.relative(repoRoot, outPath)}`)
}

if (!fs.existsSync(feBin)) {
  console.error(`Missing Fe binary: ${feBin}`)
  process.exit(1)
}

if (contracts.length === 0) {
  runFeBuild()
} else {
  for (const contract of contracts) runFeBuild(contract)
}

for (const contractName of artifactNames()) {
  writeHardhatArtifact(contractName)
}
