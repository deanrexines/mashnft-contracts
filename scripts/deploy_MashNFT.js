async function main() {
   const MashNFT = await ethers.getContractFactory("MashNFT");

   const mashNFT = await MashNFT.deploy();
   console.log("Contract deployed to address:", mashNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });