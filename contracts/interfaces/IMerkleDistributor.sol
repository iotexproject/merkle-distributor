// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IMerkleDistributor {
    function wNative() external view returns (address);

    function token() external view returns (address);

    function merkleRoot() external view returns (bytes32);

    function isClaimed(uint256 index) external view returns (bool);

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external;

    event Claimed(uint256 index, address account, uint256 amount);
}