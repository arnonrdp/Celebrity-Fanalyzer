import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    wallet_info: {
      wallet_address: '',
      network_id: '',
      signer: null
    },
    temp_address: '',
    chains: {
      amoy: {
        chainId: import.meta.env.VITE_POLYGON_AMOY_NETWORK_ID,
        name: import.meta.env.VITE_POLYGON_AMOY_NETWORK_NAME,
        currency: import.meta.env.VITE_POLYGON_AMOY_CURRENCY,
        explorerUrl: import.meta.env.VITE_ALCHEMY_POLYGON_AMOY_SCAN_URL,
        rpcUrl: import.meta.env.VITE_ALCHEMY_POLYGON_AMOY_PROVIDER_URL
      },
      sepolia: {
        chainId: import.meta.env.VITE_SEPOLIA_NETWORK_ID,
        name: import.meta.env.VITE_SEPOLIA_NETWORK_NAME,
        currency: import.meta.env.VITE_SEPOLIA_CURRENCY,
        explorerUrl: import.meta.env.VITE_ALCHEMY_SEPOLIA_SCAN_URL,
        rpcUrl: import.meta.env.VITE_ALCHEMY_SEPOLIA_PROVIDER_URL
      },
      matic: {
        chainId: 137,
        name: import.meta.env.VITE_INFURA_POLYGON_MAINET_NETWORK_NAME,
        currency: import.meta.env.VITE_POLYGON_MAINET_CURRENCY,
        explorerUrl: import.meta.env.VITE_INFURA_POLYGON_MAINET_SCAN_URL,
        rpcUrl: 'https://polygon-rpc.com',
        blockExplorerUrls: ['https://polygonscan.com/'],

        nativeCurrency: {
          name: 'Polygon',
          symbol: 'MATIC',
          decimals: 18
        }
      },
      hardhat: {
        chainId: 31337,
        name: 'Hardhat Network',
        currency: 'ETH',
        explorerUrl: '',
        rpcUrl: 'http://127.0.0.1:8545'
      }
    }
  }),

  getters: {
    getWalletInfo: (state) => state.wallet_info,
    getTempAddress: (state) => state.temp_address,
    getChains: (state) => state.chains
  },

  actions: {
    setWalletAddress(address) {
      this.wallet_info.wallet_address = address
    },
    setNetworkId(id) {
      this.wallet_info.network_id = id
    },
    setSigner(signer) {
      this.wallet_info.signer = signer
    },
    setTempAddress(adress) {
      this.temp_address = adress
    },
    resetTempAddress() {
      this.temp_address = this.wallet_info.wallet_address
    },
    getChainConfig(networkName) {
      console.log('the network name is ', networkName)
      for (const key in this.chains) {
        if (networkName.includes(key)) {
          return this.chains[key]
        }
      }
      console.warn(`Network configuration for "${networkName}" not found, using default.`)
      // Default to Polygon Amoy if no match is found
      return this.chains['amoy']
    }
  }
})
