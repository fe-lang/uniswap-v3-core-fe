const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const feRoot = path.join(repoRoot, 'fe')
const feOutDir = path.join(feRoot, 'out')
const hardhatOutDir = path.join(feRoot, 'hardhat-artifacts')
const feBin = process.env.FE_BIN || '/Users/sean/code/fe/pr-review/target/release/fe'
const contracts = process.argv.slice(2)

const tickInfoComponents = [
  { name: 'liquidityGross', type: 'uint128' },
  { name: 'liquidityNet', type: 'int128' },
  { name: 'feeGrowthOutside0X128', type: 'uint256' },
  { name: 'feeGrowthOutside1X128', type: 'uint256' },
  { name: 'tickCumulativeOutside', type: 'int56' },
  { name: 'secondsPerLiquidityOutsideX128', type: 'uint160' },
  { name: 'secondsOutside', type: 'uint32' },
  { name: 'initialized', type: 'bool' },
]

const oracleInitializeParamsComponents = [
  { name: 'time', type: 'uint32' },
  { name: 'tick', type: 'int24' },
  { name: 'liquidity', type: 'uint128' },
]

const abiOverrides = {
  UniswapV3Factory: [
    {
      type: 'constructor',
      inputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'event',
      name: 'OwnerChanged',
      inputs: [
        { name: 'oldOwner', type: 'address', indexed: true },
        { name: 'newOwner', type: 'address', indexed: true },
      ],
    },
    {
      type: 'event',
      name: 'PoolCreated',
      inputs: [
        { name: 'token0', type: 'address', indexed: true },
        { name: 'token1', type: 'address', indexed: true },
        { name: 'fee', type: 'uint24', indexed: true },
        { name: 'tickSpacing', type: 'int24', indexed: false },
        { name: 'pool', type: 'address', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'FeeAmountEnabled',
      inputs: [
        { name: 'fee', type: 'uint24', indexed: true },
        { name: 'tickSpacing', type: 'int24', indexed: true },
      ],
    },
    {
      type: 'function',
      name: 'parameters',
      inputs: [],
      outputs: [
        { name: 'factory', type: 'address' },
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'owner',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'feeAmountTickSpacing',
      inputs: [{ name: 'fee', type: 'uint24' }],
      outputs: [{ name: '', type: 'int24' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getPool',
      inputs: [
        { name: 'tokenA', type: 'address' },
        { name: 'tokenB', type: 'address' },
        { name: 'fee', type: 'uint24' },
      ],
      outputs: [{ name: 'pool', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'createPool',
      inputs: [
        { name: 'tokenA', type: 'address' },
        { name: 'tokenB', type: 'address' },
        { name: 'fee', type: 'uint24' },
      ],
      outputs: [{ name: 'pool', type: 'address' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setOwner',
      inputs: [{ name: '_owner', type: 'address' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'enableFeeAmount',
      inputs: [
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  ],
  UniswapV3Pool: [
    {
      type: 'constructor',
      inputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'factory',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'token0',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'token1',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'fee',
      inputs: [],
      outputs: [{ name: '', type: 'uint24' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'tickSpacing',
      inputs: [],
      outputs: [{ name: '', type: 'int24' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'maxLiquidityPerTick',
      inputs: [],
      outputs: [{ name: '', type: 'uint128' }],
      stateMutability: 'view',
    },
  ],
  MockTimeUniswapV3PoolDeployer: [
    {
      type: 'constructor',
      inputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'event',
      name: 'PoolDeployed',
      inputs: [{ name: 'pool', type: 'address', indexed: false }],
    },
    {
      type: 'function',
      name: 'parameters',
      inputs: [],
      outputs: [
        { name: 'factory', type: 'address' },
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'deploy',
      inputs: [
        { name: 'factory', type: 'address' },
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
      ],
      outputs: [{ name: 'pool', type: 'address' }],
      stateMutability: 'nonpayable',
    },
  ],
  MockTimeUniswapV3Pool: [
    {
      type: 'constructor',
      inputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'event',
      name: 'Initialize',
      inputs: [
        { name: 'sqrtPriceX96', type: 'uint160', indexed: false },
        { name: 'tick', type: 'int24', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'IncreaseObservationCardinalityNext',
      inputs: [
        { name: 'observationCardinalityNextOld', type: 'uint16', indexed: false },
        { name: 'observationCardinalityNextNew', type: 'uint16', indexed: false },
      ],
    },
    {
      type: 'function',
      name: 'factory',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'token0',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'token1',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'fee',
      inputs: [],
      outputs: [{ name: '', type: 'uint24' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'tickSpacing',
      inputs: [],
      outputs: [{ name: '', type: 'int24' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'maxLiquidityPerTick',
      inputs: [],
      outputs: [{ name: '', type: 'uint128' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'slot0',
      inputs: [],
      outputs: [
        { name: 'sqrtPriceX96', type: 'uint160' },
        { name: 'tick', type: 'int24' },
        { name: 'observationIndex', type: 'uint16' },
        { name: 'observationCardinality', type: 'uint16' },
        { name: 'observationCardinalityNext', type: 'uint16' },
        { name: 'feeProtocol', type: 'uint8' },
        { name: 'unlocked', type: 'bool' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'observations',
      inputs: [{ name: 'index', type: 'uint256' }],
      outputs: [
        { name: 'blockTimestamp', type: 'uint32' },
        { name: 'tickCumulative', type: 'int56' },
        { name: 'secondsPerLiquidityCumulativeX128', type: 'uint160' },
        { name: 'initialized', type: 'bool' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'initialize',
      inputs: [{ name: 'sqrtPriceX96', type: 'uint160' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'increaseObservationCardinalityNext',
      inputs: [{ name: 'observationCardinalityNext', type: 'uint16' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'time',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'advanceTime',
      inputs: [{ name: 'by', type: 'uint256' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setFeeGrowthGlobal0X128',
      inputs: [{ name: '_feeGrowthGlobal0X128', type: 'uint256' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setFeeGrowthGlobal1X128',
      inputs: [{ name: '_feeGrowthGlobal1X128', type: 'uint256' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'feeGrowthGlobal0X128',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'feeGrowthGlobal1X128',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ],
  NoDelegateCallTest: [
    {
      type: 'function',
      name: 'canBeDelegateCalled',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'cannotBeDelegateCalled',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getGasCostOfCanBeDelegateCalled',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getGasCostOfCannotBeDelegateCalled',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'callsIntoNoDelegateCallFunction',
      inputs: [],
      outputs: [],
      stateMutability: 'view',
    },
  ],
  OracleTest: [
    {
      type: 'function',
      name: 'observations',
      inputs: [{ name: '', type: 'uint256' }],
      outputs: [
        { name: 'blockTimestamp', type: 'uint32' },
        { name: 'tickCumulative', type: 'int56' },
        { name: 'secondsPerLiquidityCumulativeX128', type: 'uint160' },
        { name: 'initialized', type: 'bool' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'time',
      inputs: [],
      outputs: [{ name: '', type: 'uint32' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'tick',
      inputs: [],
      outputs: [{ name: '', type: 'int24' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'liquidity',
      inputs: [],
      outputs: [{ name: '', type: 'uint128' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'index',
      inputs: [],
      outputs: [{ name: '', type: 'uint16' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'cardinality',
      inputs: [],
      outputs: [{ name: '', type: 'uint16' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'cardinalityNext',
      inputs: [],
      outputs: [{ name: '', type: 'uint16' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'initialize',
      inputs: [{ name: 'params', type: 'tuple', components: oracleInitializeParamsComponents }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'advanceTime',
      inputs: [{ name: 'by', type: 'uint32' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'update',
      inputs: [{ name: 'params', type: 'tuple', components: oracleInitializeParamsComponents.map((component, i) => i === 0 ? { name: 'advanceTimeBy', type: 'uint32' } : component) }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'grow',
      inputs: [{ name: '_cardinalityNext', type: 'uint16' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'observe',
      inputs: [{ name: 'secondsAgos', type: 'uint32[]' }],
      outputs: [
        { name: 'tickCumulatives', type: 'int56[]' },
        { name: 'secondsPerLiquidityCumulativeX128s', type: 'uint160[]' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getGasCostOfObserve',
      inputs: [{ name: 'secondsAgos', type: 'uint32[]' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ],
  TickTest: [
    {
      type: 'function',
      name: 'ticks',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: tickInfoComponents,
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'tickSpacingToMaxLiquidityPerTick',
      inputs: [{ name: 'tickSpacing', type: 'int24' }],
      outputs: [{ name: '', type: 'uint128' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'setTick',
      inputs: [
        { name: 'tick', type: 'int24' },
        { name: 'info', type: 'tuple', components: tickInfoComponents },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'getFeeGrowthInside',
      inputs: [
        { name: 'tickLower', type: 'int24' },
        { name: 'tickUpper', type: 'int24' },
        { name: 'tickCurrent', type: 'int24' },
        { name: 'feeGrowthGlobal0X128', type: 'uint256' },
        { name: 'feeGrowthGlobal1X128', type: 'uint256' },
      ],
      outputs: [
        { name: 'feeGrowthInside0X128', type: 'uint256' },
        { name: 'feeGrowthInside1X128', type: 'uint256' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'update',
      inputs: [
        { name: 'tick', type: 'int24' },
        { name: 'tickCurrent', type: 'int24' },
        { name: 'liquidityDelta', type: 'int128' },
        { name: 'feeGrowthGlobal0X128', type: 'uint256' },
        { name: 'feeGrowthGlobal1X128', type: 'uint256' },
        { name: 'secondsPerLiquidityCumulativeX128', type: 'uint160' },
        { name: 'tickCumulative', type: 'int56' },
        { name: 'time', type: 'uint32' },
        { name: 'upper', type: 'bool' },
        { name: 'maxLiquidity', type: 'uint128' },
      ],
      outputs: [{ name: 'flipped', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'clear',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'cross',
      inputs: [
        { name: 'tick', type: 'int24' },
        { name: 'feeGrowthGlobal0X128', type: 'uint256' },
        { name: 'feeGrowthGlobal1X128', type: 'uint256' },
        { name: 'secondsPerLiquidityCumulativeX128', type: 'uint160' },
        { name: 'tickCumulative', type: 'int56' },
        { name: 'time', type: 'uint32' },
      ],
      outputs: [{ name: 'liquidityNet', type: 'int128' }],
      stateMutability: 'nonpayable',
    },
  ],
  TickBitmapTest: [
    {
      type: 'function',
      name: 'flipTick',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'getGasCostOfFlipTick',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'nextInitializedTickWithinOneWord',
      inputs: [
        { name: 'tick', type: 'int24' },
        { name: 'lte', type: 'bool' },
      ],
      outputs: [
        { name: 'next', type: 'int24' },
        { name: 'initialized', type: 'bool' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getGasCostOfNextInitializedTickWithinOneWord',
      inputs: [
        { name: 'tick', type: 'int24' },
        { name: 'lte', type: 'bool' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isInitialized',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'view',
    },
  ],
  TickMathTest: [
    {
      type: 'function',
      name: 'getSqrtRatioAtTick',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: [{ name: '', type: 'uint160' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getGasCostOfGetSqrtRatioAtTick',
      inputs: [{ name: 'tick', type: 'int24' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getTickAtSqrtRatio',
      inputs: [{ name: 'sqrtPriceX96', type: 'uint160' }],
      outputs: [{ name: '', type: 'int24' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'getGasCostOfGetTickAtSqrtRatio',
      inputs: [{ name: 'sqrtPriceX96', type: 'uint160' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'MIN_SQRT_RATIO',
      inputs: [],
      outputs: [{ name: '', type: 'uint160' }],
      stateMutability: 'pure',
    },
    {
      type: 'function',
      name: 'MAX_SQRT_RATIO',
      inputs: [],
      outputs: [{ name: '', type: 'uint160' }],
      stateMutability: 'pure',
    },
  ],
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
