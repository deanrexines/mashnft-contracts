// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./MashNFT.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract MashCollectionFactory is Ownable {

  address public master;
  mapping (string => address) private _mashCollections;

  using Clones for address;

  event MashCollectionCreated(address indexed newClone, string name, string symbol, 
                              uint256 max_tokens, uint256 mintPrice, address creator,
                              uint8 royaltyPercent);

  constructor(address _master) {
      master = _master;
  }

  function getCollectionAddressByName(string memory name) public view returns (address) {
    return _mashCollections[name];
  }

  function getCollectionAddressBySalt(bytes32 salt) external view returns (address) {
      require(master != address(0), "master must be set");
      return master.predictDeterministicAddress(salt);
  }

  function _createCollectionDeterministic(bytes32 salt) internal returns (address) {
      return master.cloneDeterministic(salt);
  }

  function createMashCollection(bytes32 salt,
                                string memory _name, 
                                string memory _symbol, 
                                string memory _baseTokenURI,
                                uint256 _max_tokens, 
                                uint256 _mintPrice,
                                address payable creator,
                                uint8 royaltyPercent) external payable onlyOwner returns (address) {
    address clone = _createCollectionDeterministic(salt);
    
    MashNFT(clone).initialize(_name, _symbol, _baseTokenURI, _max_tokens, _mintPrice, creator, royaltyPercent);
    _mashCollections[_name] = clone;

    emit MashCollectionCreated(clone, _name, _symbol, _max_tokens, _mintPrice, creator, royaltyPercent);
        
    return clone;
  }
}