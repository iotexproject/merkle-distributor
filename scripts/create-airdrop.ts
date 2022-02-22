import fs from "fs-extra"
import { parseBalanceMap } from '../utils/parse-balance-map'

const balances = require('./airdrop.json')

async function main() {
  const ret = parseBalanceMap(balances)
  const sharedAddressPath = `${process.cwd()}/merkle-distribution-info/md-week1.json`
  await fs.writeFile(sharedAddressPath, JSON.stringify(ret, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })