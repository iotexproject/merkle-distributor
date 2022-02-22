import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const mtree = require('../merkle-distribution-info/md-week1.json')

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  const { merkleRoot } = mtree
  const distributor = await getOrNull("USDTDistributor")
  if (distributor) {
    log(`reusing "USDTDistributor" at ${distributor.address}`)
  } else {
    const receipt = await execute(
      "Deployer",
      { from: deployer, log: true },
      "deploy",
      (
        await get("MerkleDistributor")
      ).address,
      (
        await get("USDT")
      ).address,
      merkleRoot
    )

    const newEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewDistributor",
    )
    const distributorAddress = newEvent["args"]["distributorAddress"]
    log(`deployed USDT distributor (targeting "MerkleDistributor") at ${distributorAddress}`)
    await save("USDTDistributor", {
      abi: (await get("MerkleDistributor")).abi,
      address: distributorAddress,
    })
  }
}

export default func
func.tags = ["USDTDistributor"]
func.dependencies = [
  "Deployer",
  "MerkleDistributor"
]
