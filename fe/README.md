# Fe MVS port

Build with Fe commit `eeedc2db6e1d93ba3c2bd9d935ccefa9ced21486` on
[`v3-buffer-writer-20261010`](https://github.com/sbillig/fe/tree/v3-buffer-writer-20261010).
It extends MVS `c329ceff361ae1e26d3b9a07358146bb53faa3b2` with checked
`MemBuffer.write_word` and pins Sonatina
`361e0e86a88413f12e0ef1cb16b7ef75bbb10034` in Cargo.lock. Use the explicit
compiler path; an installed Fe release may use a different API.

```sh
git clone https://github.com/sbillig/fe.git /tmp/fe-v3-mvs
git -C /tmp/fe-v3-mvs checkout eeedc2db6e1d93ba3c2bd9d935ccefa9ced21486
(cd /tmp/fe-v3-mvs && cargo build --release --locked -p fe --all-features -j 2)

# From this repository, using Yarn 1.22.22:
yarn install --frozen-lockfile --ignore-scripts
FE_BIN=/tmp/fe-v3-mvs/target/release/fe yarn compile:fe
yarn compile
FE_ARTIFACTS=1 yarn test --no-compile
yarn tsc --noEmit
```

The bridge builds 31 Fe artifacts with size optimization (`FE_OPTIMIZE=s`).
The Fe-backed Hardhat suite uses Osaka and enforces the contract size limit.
The verified result is **986 passing, 95 pending**. Of the pending cases, 75
require the unavailable Fe `black_box` builtin; 20 were already pending.
The eight canonical oracle-encoding tests also pass with Solidity fixtures.

## Current MVS syntax

Owned mutable locals use `var`. A pattern's `mut` marker opens an access to
another owner's data, so mutable value components also use `var`:

```fe
var amount_remaining = amount_specified
let (var tick_next, initialized) = next_initialized_tick_within_one_word_at(
    tick: tick_current,
    tick_spacing,
    lte: zero_for_one,
    bitmap: ref store.bitmap,
)
let info = mut store.positions[position_key]
```

This migration changes 109 value bindings across 13 files. Explicit storage
accesses remain `ref`/`mut`; no unsafe access is added to the v3 sources.

Current runtime sizes are 16,744 bytes for UniswapV3Pool, 16,822 for the mock
pool, 18,554 for the factory, and 3,114 for OracleTest. All 31 ABIs are unchanged.
The suite enforces the 24,576-byte contract limit with this compiler checkpoint.

## Single-buffer oracle encoding

`OracleTest.observe` and the pools encode both result arrays directly into one
owned `MemBuffer`. Checked word writes accept unaligned offsets, preserve bytes
outside each word, zero gaps, and reject writes beyond the allocation. Encoding
needs no unsafe pointer access or temporary array builders.

These are total `estimateGas.observe` measurements on Osaka, with mixed signed
history results and repeated, out-of-order queries. The first two gas columns
are the historical matched-compiler comparison using Fe `cf82c10c7` and Sonatina
`361e0e86`: baseline port `0c3a2de` versus single-buffer port `fe08f92`. All 31
baseline artifacts were verified byte-for-byte against the compiler without the
writer before measuring that source change. The final column is freshly measured
with this latest-MVS syntax checkpoint and includes its standard library changes.

| Queries | Baseline, cf82c10c7 | Single buffer, cf82c10c7 | Current MVS |
| ---: | ---: | ---: | ---: |
| 0 | 26,543 | 24,898 | 24,889 |
| 1 | 30,193 | 28,407 | 28,398 |
| 2 | 31,831 | 29,879 | 29,869 |
| 3 | 36,483 | 34,305 | 34,296 |
| 8 | 46,555 | 43,457 | 43,448 |
| 17 | 65,388 | 60,582 | 60,573 |
| 32 | 97,235 | 89,536 | 89,526 |
| 64 | 164,105 | 150,301 | 150,290 |

The historical single-buffer change saves 5.9–8.4% across these cases (first
two gas columns), with OracleTest runtime 3,119 → 2,954 bytes on that compiler.
The current checkpoint uses a newer compiler and is a separate measurement.
No master compiler testing was performed.

To print the measurements for the checked-out source:

```sh
FE_ARTIFACTS=1 PRINT_GAS=1 yarn hardhat test --no-compile test/Oracle.encoding.spec.ts
```

The older `getGasCostOfObserve` helper has an internal timing boundary and now
includes header initialization. Its readings do not measure the same work as a
complete `observe` call and should not be substituted for the numbers above.
