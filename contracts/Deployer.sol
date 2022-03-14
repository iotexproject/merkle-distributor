// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/IWETH.sol";

interface IDistributor {
    function initialize(
        address wNative_,
        address token_,
        bytes32 merkleRoot_
    ) external;

    function deposit(uint256 _amount) external payable;
}

interface IDistributorERC721 {
    function initialize(
        address token_,
        address holder_,
        bytes32 merkleRoot_
    ) external;
}

interface IOwnable {
    function transferOwnership(address newOwner) external;
}

contract Deployer {
    using SafeERC20 for IERC20;

    address public immutable wNative;

    event NewDistributor(
        uint256 index,
        address deployer,
        address distributor,
        address token,
        uint256 amount,
        bytes32 merkleRoot
    );

    event NewDistributorERC721(
        uint256 index,
        address deployer,
        address distributor,
        address token,
        address holder,
        bytes32 merkleRoot
    );

    event NewClone(address indexed target, address cloneAddress);

    constructor(address _wNative) public {
        wNative = _wNative;
    }

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
        address distributor,
        address token,
        uint256 amount,
        bytes32 merkleRoot
    ) external payable returns (address) {
        address cloned = _clone(distributor);
        IDistributor(cloned).initialize(
            wNative,
            token,
            merkleRoot
        );

        if (amount > 0) {
            if (token != wNative) {
                IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
                IERC20(token).safeApprove(cloned, amount);
            }
            IDistributor(cloned).deposit{ value: msg.value }(amount);
        }

        IOwnable(cloned).transferOwnership(msg.sender);
        emit NewDistributor(index, msg.sender, cloned, token, amount, merkleRoot);
        return cloned;
    }

    function deployERC721(
        uint256 index,
        address distributor,
        address token,
        address holder,
        bytes32 merkleRoot
    ) external payable returns (address) {
        address cloned = _clone(distributor);
        IDistributorERC721(cloned).initialize(
            token,
            holder,
            merkleRoot
        );

        IOwnable(cloned).transferOwnership(msg.sender);
        emit NewDistributorERC721(index, msg.sender, cloned, token, holder, merkleRoot);
        return cloned;
    }

    receive() external payable {}
}