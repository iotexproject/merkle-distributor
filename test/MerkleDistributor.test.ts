import _ from 'lodash'
import { solidity } from "ethereum-waffle"
import chai from "chai"
import { BigNumber, Signer } from "ethers"
import { ethers, deployments } from "hardhat"
import { parseBalanceMap } from "../utils/parse-balance-map"
import {
  MerkleDistributor,
  GenericERC20,
  Deployer
} from '../build/typechain'

chai.use(solidity)
const { expect } = chai
const { get } = deployments

describe("MerkleDistributor", () => {
  let deployer: Signer;
  let alice: Signer;
  let bob: Signer;
  let catherine: Signer;
  let token: GenericERC20;
  let deployerContract: Deployer
  let merkleDistributor: MerkleDistributor;
  let claims: {
    [account: string]: {
      index: number;
      amount: string;
      proof: string[];
    };
  };

  const setupTest = deployments.createFixture(
    async ({ deployments, ethers }) => {
      await deployments.fixture()

      const signers = await ethers.getSigners();
      [deployer, alice, bob, catherine] = signers

      const {
        claims: innerClaims,
        merkleRoot,
        tokenTotal,
      } = parseBalanceMap({
        [await alice.getAddress()]: 200,
        [await bob.getAddress()]: 300,
        [await catherine.getAddress()]: 250,
      })

      token = (await ethers.getContractAt(
        "GenericERC20",
        (await get("USDT")).address
      )) as GenericERC20

      deployerContract = (await ethers.getContractAt(
        "Deployer",
        (await get("Deployer")).address
      )) as Deployer

      const tx = await deployerContract.deploy(
        (await get("MerkleDistributor")).address,
        token.address,
        merkleRoot
      )
      const receipt = await tx.wait()
      const newEvent = receipt?.events?.find(
        (e: any) => e["event"] == "NewDistributor",
      )
      const distributorAddress = _.get(newEvent, "args.distributorAddress")
      merkleDistributor = (await ethers.getContractAt(
        "MerkleDistributor",
        distributorAddress
      )) as MerkleDistributor

      claims = innerClaims

      await token.approve(distributorAddress, tokenTotal)
      await merkleDistributor.deposit(tokenTotal)
    }
  )

  beforeEach(async () => {
    await setupTest()
  })

  describe("validate parseBalanceMap function", () => {
    it.skip("should generate correct proof", async () => {
      // Alice
      expect(claims[await alice.getAddress()].amount).to.equal(BigNumber.from(200).toHexString())
      expect(claims[await alice.getAddress()].proof).to.deep.equal([
        "0x1c7cd16d5e49ed5aec8653361fe3c0496e8b9cda29a74e2913c7bd2e830ffad1",
        "0xa1281640dd3f2f3e400a42e90527e508f5a7ee4286dff710c570775145ee0165",
      ])
      // Bob
      expect(claims[await bob.getAddress()].amount).to.equal(BigNumber.from(300).toHexString())
      expect(claims[await bob.getAddress()].proof).to.deep.equal([
        "0x947a7b7d06336aaaad02bfbe9ae36b7ad7b5d36a98931901e958544620016414",
        "0xa1281640dd3f2f3e400a42e90527e508f5a7ee4286dff710c570775145ee0165",
      ])
      // Catherine
      expect(claims[await catherine.getAddress()].amount).to.equal(BigNumber.from(250).toHexString())
      expect(claims[await catherine.getAddress()].proof).to.deep.equal([
        "0xd1df20cc2fcab841bf3870b019038437dbd4c8db2bff627a8b385ebcc951f3a6",
      ])
    })

    it("should allow to claim only once", async () => {
      expect(await token.balanceOf(merkleDistributor.address)).to.not.eq(0)
      for (let account in claims) {
        const claim = claims[account]
        await expect(merkleDistributor.claim(claim.index, account, claim.amount, claim.proof))
          .to.emit(merkleDistributor, "Claimed")
          .withArgs(claim.index, account, claim.amount)
        await expect(merkleDistributor.claim(claim.index, account, claim.amount, claim.proof)).to.be.revertedWith(
          "MerkleDistributor::claim:: drop already claimed"
        )
      }
      expect(await token.balanceOf(merkleDistributor.address)).to.eq(0)
    })

    it(`should distribute reward to correct person`, async () => {
      for (let account in claims) {
        const claim = claims[account]
        await merkleDistributor.claim(claim.index, account, claim.amount, claim.proof)
      }
      expect(await token.balanceOf(await alice.getAddress())).to.eq(200)
      expect(await token.balanceOf(await bob.getAddress())).to.eq(300)
      expect(await token.balanceOf(await catherine.getAddress())).to.eq(250)
    })
  })
})
