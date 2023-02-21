// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";


contract RoyaltyUtils is ERC721Upgradeable {
    event CreatorSalePayout(uint256 tokenId, address _creator, uint8 _royaltyPercent, uint256 salePrice);

    function safeTransferWithCreatorRoyalty(
        address _from,
        address _to,
        address _creator,
        uint256 tokenId,
        uint256 salePrice,
        uint8 royaltyAmount,
        uint256 creatorCutOfSale
    ) public virtual payable {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");

        (bool sent_creator_cut, ) = _creator.call{value: creatorCutOfSale}("");
        require(sent_creator_cut, "Failed to send Ether to Creator wallet");
        
        (bool sent_seller_cut, ) = _from.call{value: salePrice - creatorCutOfSale}("");
        require(sent_seller_cut, "Failed to send Ether to Seller wallet");

        emit CreatorSalePayout(tokenId, _creator, royaltyAmount, salePrice);

        _safeTransfer(_from, _to, tokenId, new bytes(0));
    }
}