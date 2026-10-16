# Fe MVS port

Build with Fe
[`8b904587cfe81322ac5897695b24feb650eee7d6`](https://github.com/sbillig/fe/commit/8b904587cfe81322ac5897695b24feb650eee7d6),
based on current master `33ee9be2820f2d296e6d9c7a9d3f6f081a5f1959`.
It adds the ABI metadata fix in [Fe PR #1807](https://github.com/argotorg/fe/pull/1807),
which keeps built-in errors implicit so ethers can load generated ABIs.
That PR is a compiler prerequisite; the port does not filter ABI errors.
Mutable value semantics and checked `MemBuffer.write_word` are already in
master. Committed Cargo dependencies pin Sonatina
`cdb34cbb9563333cde4d2c64b594a0807d23e80c`. Use the explicit compiler path;
an installed Fe release may use a different API.

```sh
git clone https://github.com/sbillig/fe.git /tmp/fe-v3-master
git -C /tmp/fe-v3-master checkout 8b904587cfe81322ac5897695b24feb650eee7d6
(cd /tmp/fe-v3-master && cargo build --release --locked -p fe -j 2)

# From this repository, using Yarn 1.22.22:
yarn install --frozen-lockfile --ignore-scripts
FE_BIN=/tmp/fe-v3-master/target/release/fe yarn compile:fe
yarn compile
FE_ARTIFACTS=1 yarn test --no-compile
yarn tsc --noEmit
```

The bridge builds 31 Fe artifacts with size optimization (`FE_OPTIMIZE=s`).
The Fe-backed Hardhat suite uses Osaka and enforces the contract size limit.
The pinned compiler builds all 31 bridge artifacts. Runtime sizes are 16,548 bytes
for UniswapV3Pool, 16,770 for the mock pool, 18,455 for the factory, and 2,976
for OracleTest. All are below the 24,576-byte EIP-170 limit.

The full Fe-backed suite passes: **986 passing, 95 pending, zero failing**.
Of the pending cases, 75 require the unavailable Fe `black_box` builtin;
20 were already pending. TypeScript checking passes with ethers 5.8 and its
aligned dependencies.

The compiler ABI fix keeps `Panic(uint256)` and `Error(string)` implicit;
no ABI filtering or additional overrides are applied in the bridge. All 31
bridge ABIs match the previous port, and the ABI fix leaves all 62 init/runtime
bytecode artifacts unchanged. The default Solidity suite retains its documented
baseline: 1,037 passing, 20 pending, 24 failing (23 gas snapshots differ by
12 gas and one Echidna arithmetic invariant fails).

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
writer before measuring that source change. The final column was measured on
October 10 with Fe `eeedc2db6` / Sonatina
`361e0e86` and includes that checkpoint's standard library changes.

| Queries | Baseline, cf82c10c7 | Single buffer, cf82c10c7 | October 10 MVS |
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
These historical measurements are separate from the current master refresh.

To print the measurements for the checked-out source:

```sh
FE_ARTIFACTS=1 PRINT_GAS=1 yarn hardhat test --no-compile test/Oracle.encoding.spec.ts
```

The older `getGasCostOfObserve` helper has an internal timing boundary and now
includes header initialization. Its readings do not measure the same work as a
complete `observe` call and should not be substituted for the numbers above.
