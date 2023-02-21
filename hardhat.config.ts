import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

const API_URL = "https://eth-rinkeby.alchemyapi.io/v2/KEY";
const PRIVATE_KEY = "hackmetofindout";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

export default {
	solidity: "0.8.15",
	defaultNetwork: "hardhat",
	allowUnlimitedContractSize: true,
	networks: {
		hardhat: {
			accounts: {
				count: 10
			}
		},
		rinkeby: {
			url: API_URL,
			accounts: [`0x${PRIVATE_KEY}`],
			gasPrice: 200000000000,
			gas: 60000000
		}
	},
};
