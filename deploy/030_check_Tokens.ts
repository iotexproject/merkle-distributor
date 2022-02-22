import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isMainnet } from "../utils/network"
import { BigNumber } from "ethers"

const TOKENS_ARGS: { [token: string]: any[] } = {
  USDT: ["Tether USD", "USDT", "18"],
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { deploy, execute } = deployments
  const { deployer } = await getNamedAccounts()

  for (const token in TOKENS_ARGS) {
    const result = await deploy(token, {
      from: deployer,
      log: true,
      contract: "GenericERC20",
      args: TOKENS_ARGS[token],
      skipIfAlreadyDeployed: true,
    })

    if (!isMainnet(await getChainId()) && result.newlyDeployed) {
      const decimals = TOKENS_ARGS[token][2]
      await execute(
        token,
        { from: deployer, log: true },
        "mint",
        deployer,
        BigNumber.from(10).pow(decimals).mul(1000000),
      )
    }
  }
}

export default func
func.tags = ["Tokens"]
