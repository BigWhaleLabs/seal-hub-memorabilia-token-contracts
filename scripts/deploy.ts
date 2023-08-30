import { SEAL_HUB_CONTRACT_ADDRESS } from '@big-whale-labs/constants'
import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import { version } from '../package.json'

async function main() {
  const [deployer] = await ethers.getSigners()
  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )
  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    5: 'goerli',
  } as { [chainId: number]: string }
  const chainName = chains[chainId]
  const contractNames = ['NullifierCreatorVerifier', 'SealHubMemorabiliaToken']
  let verifierAddress = ''
  for (const verifierContractName of contractNames) {
    console.log(`Deploying ${verifierContractName}...`)
    const Verifier = await ethers.getContractFactory(verifierContractName)
    const constructorArguments =
      verifierContractName === 'NullifierCreatorVerifier'
        ? [version]
        : [version, verifierAddress, SEAL_HUB_CONTRACT_ADDRESS]
    const verifier = await Verifier.deploy(...constructorArguments)
    console.log(
      'Deploy tx gas price:',
      utils.formatEther(verifier.deployTransaction.gasPrice || 0)
    )
    console.log(
      'Deploy tx gas limit:',
      utils.formatEther(verifier.deployTransaction.gasLimit)
    )
    await verifier.deployed()
    const address = verifier.address
    console.log('Contract deployed to:', address)
    console.log('Wait for 1 minute to make sure blockchain is updated')
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000))
    // Try to verify the contract on Etherscan
    try {
      await run('verify:verify', {
        address,
        constructorArguments,
      })
    } catch (err) {
      console.log(
        'Error verifiying contract on Etherscan:',
        err instanceof Error ? err.message : err
      )
    }
    // Print out the information
    console.log(`${verifierContractName} deployed and verified on Etherscan!`)
    console.log('Contract address:', address)
    console.log(
      'Etherscan URL:',
      `https://${
        chainName !== 'mainnet' ? `${chainName}.` : ''
      }etherscan.io/address/${address}`
    )
    if (verifierContractName === 'NullifierCreatorVerifier') {
      verifierAddress = address
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
