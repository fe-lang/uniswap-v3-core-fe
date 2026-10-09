# Fe MVS port

Build with Fe commit `cf82c10c76229aa48812614570a55d087aa98d7b` on
[`v3-buffer-writer-20261009`](https://github.com/sbillig/fe/tree/v3-buffer-writer-20261009).
It extends MVS `a87320382` with checked `MemBuffer.write_word` and pins Sonatina
`361e0e86a88413f12e0ef1cb16b7ef75bbb10034` in Cargo.lock. Use the explicit
compiler path; an installed Fe release may use a different API.

```sh
git clone https://github.com/sbillig/fe.git /tmp/fe-v3-mvs
git -C /tmp/fe-v3-mvs checkout cf82c10c76229aa48812614570a55d087aa98d7b
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

## Single-buffer oracle encoding

`OracleTest.observe` and the pools encode both result arrays directly into one
owned `MemBuffer`. Checked word writes accept unaligned offsets, preserve bytes
outside each word, zero gaps, and reject writes beyond the allocation. Encoding
needs no unsafe pointer access or temporary array builders.

These are total `estimateGas.observe` measurements on Osaka, with mixed signed
history results and repeated, out-of-order queries. The baseline is port commit
`0c3a2de` after the RawMem cutover. Both versions use the same compiler/backend;
all 31 baseline artifacts were verified byte-for-byte against the compiler
without the new writer before measuring the source change.

| Queries | Baseline gas | Single-buffer gas |
| ---: | ---: | ---: |
| 0 | 26,543 | 24,898 |
| 1 | 30,193 | 28,407 |
| 2 | 31,831 | 29,879 |
| 3 | 36,483 | 34,305 |
| 8 | 46,555 | 43,457 |
| 17 | 65,388 | 60,582 |
| 32 | 97,235 | 89,536 |
| 64 | 164,105 | 150,301 |

Savings are 5.9–8.4% across these cases. OracleTest runtime shrinks from 3,119
to 2,954 bytes. All contract ABIs are unchanged. This is an MVS source comparison;
no master compiler testing was performed.

To print the measurements for the checked-out source:

```sh
FE_ARTIFACTS=1 PRINT_GAS=1 yarn hardhat test --no-compile test/Oracle.encoding.spec.ts
```

The older `getGasCostOfObserve` helper has an internal timing boundary and now
includes header initialization. Its readings do not measure the same work as a
complete `observe` call and should not be substituted for the numbers above.
