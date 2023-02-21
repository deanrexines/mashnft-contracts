import { ethers } from "hardhat";
import { expect } from "chai";
import { beforeEach } from "mocha";
import { Contract, BigNumber } from "ethers";
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
const BASE_ROYALTY_PRICE: any = 1;
const TEST_SALE_PRICE: any = 100;

const INITIAL_MINT: any = [];
const INITIAL_MINT_COUNT: any = 3;
const salts = [ethers.utils.formatBytes32String('1'), ethers.utils.formatBytes32String('2')];


describe("Mash NFT Collection", () => {
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let CREATOR: SignerWithAddress;

  let deployer: Contract;
  let collector1Contract: Contract;
  let collector2Contract: Contract;

  let mashCollectionMaster: any;
  let collector1: any;
  let collector2: any;
  let creator: any;
  let mashCollectionStandaloneGas: any;

  beforeEach(async () => {
    const MashNftLibrary = await ethers.getContractFactory("MashNFT");

    [owner, account1, account2, CREATOR] = await ethers.getSigners();

    collector1 = await account1.getAddress();
    collector2 = await account2.getAddress();
    creator = await CREATOR.getAddress();

    mashCollectionMaster = await MashNftLibrary.connect(owner).deploy();
    await mashCollectionMaster.initialize(NAME, SYMBOL, BASE_URI, MAX_TOKENS, MINT_PRICE, CREATOR.address, BASE_ROYALTY_PRICE);

    deployer = mashCollectionMaster.connect(owner);
    collector1Contract = mashCollectionMaster.connect(account1);
    collector2Contract = mashCollectionMaster.connect(account2);

    mashCollectionMaster.grantPauserRole(owner.address);

    const INITIAL_MINT_COUNT = 3;
    const INITIAL_MINT = [];
    for (let i = 1; i <= INITIAL_MINT_COUNT; ++i) {
        await mashCollectionMaster.mint(collector1, "uri" + (i-1).toString(), { value: ethers.BigNumber.from(MINT_PRICE) });
        INITIAL_MINT.push(i.toString());
    }
  });

  it("Should deploy MashNFT contract", async function () {
    mashCollectionMaster = await (await ethers.getContractFactory("MashNFT")).deploy();
    // mashCollectionStandaloneGas = await getGas(mashCollectionMaster.deployTransaction)
    expect(mashCollectionMaster.address).to.exist;
  });

  it('Creates a token collection with a name', async function () {
    expect(await mashCollectionMaster.name()).to.exist;
  });

  it('Creates a token collection with a symbol', async function () {
    expect(await mashCollectionMaster.symbol()).to.exist;
  });

  it('Verifies that mint is not possible when saleState is turned off', async function () {
    expect(await mashCollectionMaster.paused()).to.equal(false);
    await deployer.pause();
    expect(await mashCollectionMaster.paused()).to.equal(true);
    await expect(mashCollectionMaster.mint(collector1, "100", { value: ethers.BigNumber.from(MINT_PRICE) })).to.be.reverted;
  });

  it('Mints initial set of NFTs from collection to token owner', async function () {
    for (let i = 0; i < INITIAL_MINT.length; i++) {
        expect(await mashCollectionMaster.ownerOf(INITIAL_MINT[i])).to.equal(this.collector1);
    }
  });

  it('Mints initial set of NFTs from collection to token owner', async function () {
    for (let i = 0; i < INITIAL_MINT.length; i++) {
        expect(await mashCollectionMaster.ownerOf(INITIAL_MINT[i])).to.equal(collector1);
    }
  });

  it('Is able to query the NFT balances of an address', async function () {
    expect(await mashCollectionMaster.balanceOf(collector1)).to.equal(INITIAL_MINT_COUNT);
  });


  it('Is able to mint new NFTs to the collection to collector', async function () {
    let tokenURI = (INITIAL_MINT_COUNT+1).toString();
    await mashCollectionMaster.mint(collector2, tokenURI, { value: ethers.BigNumber.from(MINT_PRICE) });
  });

  it('Emits a transfer event for newly minted NFTs', async function () {
    let tokenId = (INITIAL_MINT_COUNT).toString();

    await expect(mashCollectionMaster.mint(collector1, tokenId, { value: ethers.BigNumber.from(MINT_PRICE) }))
    .to.emit(mashCollectionMaster, "Transfer")
    .withArgs("0x0000000000000000000000000000000000000000", collector1, INITIAL_MINT_COUNT);
  });

  it('Is able to transfer NFTs to another wallet when called by owner', async function () {
    let tokenId = "1";
    await collector1Contract["safeTransferFrom(address,address,uint256)"](
      collector1, 
      collector2, 
      BigNumber.from(tokenId)
    );
    expect(await mashCollectionMaster.ownerOf(tokenId)).to.equal(collector2);
  });

  it('Emits a royalty set event for newly minted NFTs', async function () {
    let tokenId = (INITIAL_MINT_COUNT).toString();
    const balance = await ethers.provider.getBalance(creator);

    await mashCollectionMaster.mint(collector1, tokenId, { value: ethers.BigNumber.from(MINT_PRICE) });
    const balance1 = await ethers.provider.getBalance(creator);

    expect(BigNumber.from(balance1).sub(BigNumber.from(balance)))
      .to.equal(BigNumber.from(await mashCollectionMaster.getMintPayoutForCreator(MINT_PRICE)));
  });

  it('Emits a royalty set event for newly minted NFTs', async function () {
    let tokenId = (INITIAL_MINT_COUNT).toString();

    await expect(mashCollectionMaster.mint(collector1, tokenId, { value: ethers.BigNumber.from(MINT_PRICE) }))
    .to.emit(mashCollectionMaster, "RoyaltySet")
    .withArgs(tokenId, creator, BASE_ROYALTY_PRICE);
  });

  it('Get token URI by ID in a collection returns correct token', async function () {
    let tokenId = "1";

    const tokenURI = await mashCollectionMaster.getTokenURIbyID(tokenId);
    expect(tokenURI).to.equal("uri1");
  });

  it('Get all token URIs in a collection returns correct amount', async function () {
    const tokenURIs = await mashCollectionMaster.getTokenURIs();
    expect(tokenURIs.length).to.equal(INITIAL_MINT_COUNT);
  });
});