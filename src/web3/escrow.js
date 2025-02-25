import { ethers } from 'ethers'
import { customWeb3modal } from './walletConnect'
import CompetitionEscrow from 'src/contracts/artifacts/contracts/CompetitionEscrow.sol/CompetitionEscrow.json'

const iface = new ethers.utils.Interface(CompetitionEscrow.abi)

const checkConnection = async () => {
  if (!customWeb3modal.getAddress()) {
    await customWeb3modal.open()
    return true
  }
  return true
}

const getProvider = async () => {
  try {
    const isConnected = await checkConnection()
    if (isConnected) {
      const walletProvider = customWeb3modal.getWalletProvider()
      return new ethers.providers.Web3Provider(walletProvider)
    }
  } catch (error) {
    console.error('Error getting provider:', error)
    throw new Error('please connect your wallet')
  }
}

const getContractInstance = async () => {
  const provider = await getProvider()
  const signer = provider.getSigner()
  const contractAddress = import.meta.env.VITE_ESCROW_CONTRACT
  return new ethers.Contract(contractAddress, CompetitionEscrow.abi, signer)
}

export const depositFunds = async (payload = { amountInMatic: 0 }) => {
  if (payload.amountInMatic > 0) {
    try {
      const escrowContract = await getContractInstance()
      const amountInWei = ethers.utils.parseUnits(payload.amountInMatic, 'ether')

      const tx = await escrowContract.deposit({ value: amountInWei })

      const receipt = await tx.wait()
      const events = receipt.logs.map((log) => decodeLog(log)).filter((log) => log !== null)
      return { status: 'success', events }
    } catch (error) {
      console.error('Error depositing funds:', error)
      return { status: 'error', error: { message: error.message } }
    }
  } else {
    const errorMessage = 'Make sure the deposit is greater than zero'
    console.error('Error deposing funds:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}

export const setRecipient = async (payload = { escrowId: 0, recipient: '' }) => {
  if (payload.escrowId > 0 && payload.recipient.length > 0) {
    try {
      const escrowContract = await getContractInstance()
      const valueInWei = ethers.utils.parseUnits(payload.escrowId, 'ether')
      const tx = await escrowContract.setRecipient(valueInWei, payload.recipient)

      const receipt = await tx.wait()
      const events = receipt.logs.map((log) => decodeLog(log)).filter((log) => log !== null)
      return { status: 'success', events }
    } catch (error) {
      console.error('Error setting recipient:', error)
      return { status: 'error', error: { message: error.message } }
    }
  } else {
    const errorMessage = 'Make sure the escrowId and recipient address are valid'
    console.error('Error setting recipient:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}

export const releaseFunds = async (payload = { escrowId: 0 }) => {
  if (payload.escrowId > 0) {
    try {
      const escrowContract = await getContractInstance()
      const valueInWei = ethers.utils.parseUnits(payload.escrowId, 'ether')
      const tx = await escrowContract.release(valueInWei)

      const receipt = await tx.wait()
      // Extract the transaction hash
      const transactionHash = receipt.transactionHash
      const events = receipt.logs.map((log) => decodeLog(log)).filter((log) => log !== null)
      return { status: 'success', transactionHash, events }
    } catch (error) {
      console.error('Error releasing funds:', error)
      return { status: 'error', error: { message: error.message } }
    }
  } else {
    const errorMessage = 'Make sure the escrowId is valid'
    console.error('Error releasing funds:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}

export const refundFunds = async (payload = { escrowId: 0 }) => {
  if (payload.escrowId > 0) {
    try {
      const escrowContract = await getContractInstance()
      const tx = await escrowContract.refund(payload.escrowId)

      const receipt = await tx.wait()
      const events = receipt.logs.map((log) => decodeLog(log)).filter((log) => log !== null)
      return { status: 'success', events }
    } catch (error) {
      console.error('Error refunding funds:', error)
      return { status: 'error', error: { message: error.message } }
    }
  } else {
    const errorMessage = 'Make sure the escrowId is valid'
    console.error('Error refunding funds:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}

export const resolveDispute = async (payload = { escrowId: 0, depositorPercentage: 0 }) => {
  if (payload.escrowId > 0 && payload.depositorPercentage >= 0 && payload.depositorPercentage <= 100) {
    try {
      const escrowContract = await getContractInstance()
      const tx = await escrowContract.resolveDispute(payload.escrowId, payload.depositorPercentage)

      const receipt = await tx.wait()
      const events = receipt.logs.map((log) => decodeLog(log)).filter((log) => log !== null)
      return { status: 'success', events }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      return { status: 'error', error: { message: error.message } }
    }
  } else {
    const errorMessage = 'Make sure the escrowId is valid and depositorPercentage is between 0 and 100'
    console.error('Error resolving dispute:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}

export const getEscrowDetails = async (payload = { escrowId: 0 }) => {
  if (payload.escrowId > 0) {
    try {
      const escrowContract = await getContractInstance()
      const valueInWei = ethers.utils.parseUnits(payload.escrowId, 'ether')
      const escrowDetails = await escrowContract.getEscrowDetails(valueInWei)
      return { status: 'success', data: escrowDetails }
    } catch (error) {
      console.error('Error fetching escrow details:', error)
      return { status: 'error', error: { message: error.message } }
    }
  } else {
    const errorMessage = 'Make sure the escrowId is valid'
    console.error('Error fetching escrow details:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}

function decodeLog(log) {
  try {
    const eventFragment = iface.getEvent(log.topics[0])
    const decodedLog = iface.decodeEventLog(eventFragment, log.data, log.topics)
    const args = {}
    for (const [key, value] of Object.entries(decodedLog)) {
      if (ethers.BigNumber.isBigNumber(value)) {
        args[key] = ethers.utils.formatEther(value)
      } else {
        args[key] = value
      }
    }

    return {
      event_name: eventFragment.name,
      args: args
    }
  } catch (error) {
    console.log('Log could not be decoded:', error)
    return null
  }
}

export const getEventsForEscrow = async (payload = { escrowId: 0 }) => {
  if (payload.escrowId > 0) {
    try {
      const escrowContract = await getContractInstance()
      const valueInWei = ethers.utils.parseUnits(payload.escrowId, 'ether')
      const depositLogs = await escrowContract.queryFilter(escrowContract.filters.Deposited(valueInWei))
      const releaseLogs = await escrowContract.queryFilter(escrowContract.filters.Released(valueInWei))
      const refundLogs = await escrowContract.queryFilter(escrowContract.filters.Refunded(valueInWei))
      const disputeLogs = await escrowContract.queryFilter(escrowContract.filters.DisputeResolved(valueInWei))
      const recipientSetLogs = await escrowContract.queryFilter(escrowContract.filters.RecipientSet(valueInWei))

      const depositEvents = depositLogs.map((log) => decodeLog(log)).filter((event) => event !== null)
      const releaseEvents = releaseLogs.map((log) => decodeLog(log)).filter((event) => event !== null)
      const refundEvents = refundLogs.map((log) => decodeLog(log)).filter((event) => event !== null)
      const disputeEvents = disputeLogs.map((log) => decodeLog(log)).filter((event) => event !== null)
      const recipientSetEvents = recipientSetLogs.map((log) => decodeLog(log)).filter((event) => event !== null)

      const result = {
        depositEvents,
        releaseEvents,
        refundEvents,
        disputeEvents,
        recipientSetEvents
      }

      return { status: 'success', events: result }
    } catch (error) {
      const errorMessage = error.error ? error.error.data : error
      return { status: 'error', error: { message: errorMessage } }
    }
  } else {
    const errorMessage = 'Make sure the escrowId is valid'
    console.error('Error retrieving events:', errorMessage)
    return { status: 'error', error: { message: errorMessage } }
  }
}
