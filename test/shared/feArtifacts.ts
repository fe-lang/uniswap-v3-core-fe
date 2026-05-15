import fs from 'fs'
import path from 'path'
import { ContractFactory, Signer } from 'ethers'
import { ethers } from 'hardhat'

export async function getContractFactory(name: string, signer?: Signer): Promise<ContractFactory> {
  if (process.env.FE_ARTIFACTS !== '1') {
    return ethers.getContractFactory(name, signer)
  }

  const artifactPath = path.join(__dirname, '..', '..', 'fe', 'hardhat-artifacts', `${name}.json`)
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
  const defaultSigner = signer ?? (await (ethers as any).getSigners())[0]
  return new ethers.ContractFactory(artifact.abi, artifact.bytecode, defaultSigner)
}
