// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interfaces/IMerkleDistributorERC721.sol";

contract MerkleDistributorERC721 is IMerkleDistributorERC721, OwnableUpgradeable {

    address public override token;
    address public override holder;
    bytes32 public override merkleRoot;

    mapping(uint256 => uint256) private claimedBitMap;

    function initialize(
        address token_,
        address holder_,
        bytes32 merkleRoot_
    ) external virtual initializer {
        __Ownable_init();
        token = token_;
        holder = holder_;
        merkleRoot = merkleRoot_;
    }

    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    function claim(
        uint256 index,
        address account,
        uint256 tokenId,
        bytes32[] calldata merkleProof
    ) external override {
        require(!isClaimed(index), "MerkleDistributorERC721::claim:: drop already claimed");

        bytes32 node = keccak256(abi.encodePacked(index, account, tokenId));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "MerkleDistributorERC721::claim:: invalid proof");

        _setClaimed(index);
        IERC721(token).safeTransferFrom(holder, account, tokenId);

        emit Claimed(index, account, tokenId);
    }
}
