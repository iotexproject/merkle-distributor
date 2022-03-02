// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

interface IDistributor {
    function initialize(
        address token_,
        bytes32 merkleRoot_
    ) external;
}

interface IOwnable {
    function transferOwnership(address newOwner) external;
}

contract Deployer {
    event NewDistributor(
        uint256 index,
        address deployer,
        address distributorAddress,
        address token,
        bytes32 merkleRoot
    );
    event NewClone(address indexed target, address cloneAddress);

    function clone(address target) external returns (address) {
        address newClone = _clone(target);
        emit NewClone(target, newClone);
        return newClone;
    }

    function _clone(address target) internal returns (address) {
        return Clones.clone(target);
    }

    function deploy(
        uint256 index,
        address distributorAddress,
        address token,
        bytes32 merkleRoot
    ) external returns (address) {
        address cloned = _clone(distributorAddress);
        IDistributor(cloned).initialize(
            token,
            merkleRoot
        );
        IOwnable(cloned).transferOwnership(msg.sender);
        emit NewDistributor(index, msg.sender, cloned, token, merkleRoot);
        return cloned;
    }
}