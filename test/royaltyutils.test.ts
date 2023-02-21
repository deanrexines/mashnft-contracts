import { ethers } from "hardhat";
import { expect } from "chai";
import { beforeEach } from "mocha";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const NAME: string = "Mash NFT";
const SYMBOL: string = "MASH";
const BASE_URI: string = "BASE_URI";
const MAX_TOKENS: any = 100;
const MINT_PRICE: any = 10;
const BASE_ROYALTY_PRICE: any = 8;
const TEST_SALE_PRICE: any = 100;

const INITIAL_MINT: any = [];
const INITIAL_MINT_COUNT: any = 3;
const salts = [ethers.utils.formatBytes32String('1'), ethers.utils.formatBytes32String('2')];


describe("Royalties", () => {
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let CREATOR: SignerWithAddress;

  let collector1Contract: Contract;
  let collector2Contract: Contract;

  let mashCollectionMaster: any;
  let collector1: any;
  let collector2: any;
  let creator: any;


  beforeEach(async () => {
    [owner, account1, account2, CREATOR] = await ethers.getSigners();
    collector1 = await account1.getAddress();
    collector2 = await account2.getAddress();
    creator = await CREATOR.getAddress();

    const MashNftLibrary = await ethers.getContractFactory("MashNFT");
    mashCollectionMaster = await MashNftLibrary.connect(owner).deploy();
    await mashCollectionMaster.initialize(NAME, SYMBOL, BASE_URI, MAX_TOKENS, MINT_PRICE, CREATOR.address, BASE_ROYALTY_PRICE);

    mashCollectionMaster.grantPauserRole(owner.address);

    collector1Contract = mashCollectionMaster.connect(account1);

    const INITIAL_MINT_COUNT = 3;
    const INITIAL_MINT = [];
    for (let i = 1; i <= INITIAL_MINT_COUNT; i++) {
        await mashCollectionMaster.mint(collector1, i.toString(), { value: ethers.BigNumber.from(MINT_PRICE) });
        INITIAL_MINT.push(i.toString());
    }
  });

  it('Pays out correct royalty to Creator upon invoking safeTransferWithCreatorRoyalty', async function () {
    let tokenId = "1";
    const creator_balance_before = await ethers.provider.getBalance(creator);
    
    const creator_cut = await mashCollectionMaster.getSalePayoutForCreator(BASE_ROYALTY_PRICE, TEST_SALE_PRICE);

    await collector1Contract["safeTransferWithCreatorRoyalty(address,address,address,uint256,uint256,uint8,uint256)"](
        collector1,
        collector2, 
        creator,
        ethers.BigNumber.from(tokenId),
        TEST_SALE_PRICE,
        BASE_ROYALTY_PRICE,
        creator_cut,
        { value: ethers.BigNumber.from(TEST_SALE_PRICE) }
    );

    const creator_balance_after = await ethers.provider.getBalance(creator);

    expect(BigNumber.from(creator_balance_after).sub(BigNumber.from(creator_balance_before)))
      .to.equal(BigNumber.from(creator_cut)); 
  });

  it('Verify successful transfer of token to Buyer upon invoking safeTransferWithCreatorRoyalty', async function () {
    let tokenId = "1";    
    const creator_sale_cut = await mashCollectionMaster.getSalePayoutForCreator(BASE_ROYALTY_PRICE, TEST_SALE_PRICE);

    await collector1Contract["safeTransferWithCreatorRoyalty(address,address,address,uint256,uint256,uint8,uint256)"](
        collector1,
        collector2, 
        creator,
        ethers.BigNumber.from(tokenId),
        TEST_SALE_PRICE,
        BASE_ROYALTY_PRICE,
        creator_sale_cut,
        { value: ethers.BigNumber.from(TEST_SALE_PRICE) }
    );

    expect(await mashCollectionMaster.ownerOf(tokenId)).to.equal(collector2);
  });

  it('Emits a CreatorSalePayout Event on NFT sale', async function () {
    let tokenId = "1";    
    const creator_sale_cut = await mashCollectionMaster.getSalePayoutForCreator(BASE_ROYALTY_PRICE, TEST_SALE_PRICE);

    await expect(await collector1Contract["safeTransferWithCreatorRoyalty(address,address,address,uint256,uint256,uint8,uint256)"](
        collector1,
        collector2, 
        creator,
        ethers.BigNumber.from(tokenId),
        TEST_SALE_PRICE,
        BASE_ROYALTY_PRICE,
        creator_sale_cut,
        { value: ethers.BigNumber.from(TEST_SALE_PRICE) }
    ))
    .to.emit(mashCollectionMaster, "CreatorSalePayout")
    .withArgs(tokenId, creator, BASE_ROYALTY_PRICE, TEST_SALE_PRICE);
  });
});