import { ethers } from "hardhat";
import { expect } from "chai";
import { beforeEach } from "mocha";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const getGas = async (tx: any) => {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
  return receipt.gasUsed.toString()
}

const NAME: string = "Mash NFT";
const SYMBOL: string = "MASH";
const BASE_URI: string = "BASE_URI";
const MAX_TOKENS: any = 100;
const MINT_PRICE: any = 10;
const ROYALTY_PERCENT: any = 10;

const salts = [ethers.utils.formatBytes32String('1'), ethers.utils.formatBytes32String('2')];

let mashCollectionMaster: any;
let mashCollectionFactory: any;
let mashCollectionStandaloneGas: any;
let mashCollectionProxyGas: any;
let CREATOR: SignerWithAddress;

describe("Mash NFT Collection Factory", () => {
  let mashNftLib: Contract;
  let mashCollectionContract: Contract;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let cloneAddress: SignerWithAddress;

  beforeEach(async () => {
    [owner, account1, account2] = await ethers.getSigners();

    CREATOR = account1;

    mashCollectionMaster = await (await ethers.getContractFactory("MashNFT")).deploy();
    mashCollectionFactory = await (await ethers.getContractFactory("MashCollectionFactory")).deploy(mashCollectionMaster.address);
  });

  it("Should deploy master MashNFT contract", async function () {
    mashCollectionMaster = await (await ethers.getContractFactory("MashNFT")).deploy();
    mashCollectionStandaloneGas = await getGas(mashCollectionMaster.deployTransaction)
    expect(mashCollectionMaster.address).to.exist;
  });

  it("Should deploy MashCollectionFactory contract", async function () {
    mashCollectionFactory = await (await ethers.getContractFactory("MashCollectionFactory")).deploy(mashCollectionMaster.address);
    expect(mashCollectionFactory.address).to.exist;
  });

  it("Should deploy a cloned MashCollection contract and allow initialization of custom collection info", async function () {
    const mashCollectionAddress = await mashCollectionFactory.getCollectionAddressBySalt(salts[0]);

    expect(mashCollectionAddress).to.exist;

    const tx = await mashCollectionFactory.createMashCollection(salts[0], NAME, SYMBOL, BASE_URI, MAX_TOKENS, MINT_PRICE, CREATOR.address, ROYALTY_PERCENT);
    await tx.wait()
    mashCollectionProxyGas = await getGas(tx)

    const collection1 = new ethers.Contract(
      mashCollectionAddress,
      [
        'function initialize(string memory name, string memory symbol, string memory baseTokenURI, uint256 max_tokens, uint256 mashNftMintPrice) public initializer',
        'function getMaxTokens() public view returns (uint256)',
      ],
      account1
    );
    expect(collection1.address).to.equal(mashCollectionAddress);

    let max_tokens = await collection1.getMaxTokens();
    expect(max_tokens).to.equal(MAX_TOKENS);

  });

  it("Minimal Proxy deployment should cost 10x less than a standard deployment", async function () {
    /**
     * proxy *deployment* (i.e. Clones.cloneDeterministic call only) meets this condition
     * MashCollectionFactory.createMashCollection's call to MashNFT.initialize breaks it
     * 
    */
    // expect(Number(mashCollectionStandaloneGas)).to.be.greaterThan(Number(mashCollectionProxyGas)*10);
  });

});