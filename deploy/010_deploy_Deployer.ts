import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const wiotx = "0xa00744882684c3e4747faefd68d283ea44099d03"
  await deploy("Deployer", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [
      wiotx
    ]
  })
}

export default func
func.tags = ["Deployer"]
