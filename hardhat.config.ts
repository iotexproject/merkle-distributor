import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-web3"
import "@nomiclabs/hardhat-etherscan"
import "@typechain/hardhat"
import "hardhat-gas-reporter"
import "solidity-coverage"
import "hardhat-deploy"
import "hardhat-spdx-license-identifier"

import { HardhatUserConfig } from "hardhat/config"
import dotenv from "dotenv"

dotenv.config()

const {
  CODE_COVERAGE,
  ETHERSCAN_API,
  ACCOUNT_PRIVATE_KEYS,
  FORK_MAINNET,
  MAINNET_API = "https://babel-api.mainnet.iotex.io",
  TESTNET_API = "https://babel-api.testnet.iotex.io"
} = process.env

let config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      hardfork: CODE_COVERAGE ? "berlin" : "london",
    },
    mainnet: {
      url: MAINNET_API,
      gas: 8000000,
      gasPrice: 1000000000000,
    },
    testnet: {
      url: TESTNET_API,
      gas: 8000000,
      gasPrice: 1000000000000,
    },
  },
  paths: {
    artifacts: "./build/artifacts",
    cache: "./build/cache",
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      }
    ],
  },
  typechain: {
    outDir: "./build/typechain/",
    target: "ethers-v5",
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 21,
  },
  mocha: {
    timeout: 200000,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      4689: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4690: 0,
    },
    libraryDeployer: {
      default: 1, // use a different account for deploying libraries on the hardhat network
      4689: 0, // use the same address as the main deployer on mainnet
      4690: 0,
    },
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
}

if (ETHERSCAN_API) {
  config = { ...config, etherscan: { apiKey: ETHERSCAN_API } }
}

if (ACCOUNT_PRIVATE_KEYS) {
  config.networks = {
    ...config.networks,
    mainnet: {
      ...config.networks?.mainnet,
      accounts: JSON.parse(ACCOUNT_PRIVATE_KEYS),
    },
    testnet: {
      ...config.networks?.testnet,
      accounts: JSON.parse(ACCOUNT_PRIVATE_KEYS),
    },
  }
}

if (FORK_MAINNET === "true" && config.networks) {
  console.log("FORK_MAINNET is set to true")
  config = {
    ...config,
    networks: {
      ...config.networks,
      hardhat: {
        ...config.networks.hardhat,
        forking: {
          url: MAINNET_API || "",
        },
        chainId: 4689,
      },
    },
    external: {
      deployments: {
        hardhat: ["deployments/mainnet"],
      },
    },
  }
}

export default config
