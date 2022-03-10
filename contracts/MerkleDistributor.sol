// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IMerkleDistributor.sol";
import "./interfaces/IWETH.sol";

contract MerkleDistributor is IMerkleDistributor, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    address public override wNative;
    address public override token;
    bytes32 public override merkleRoot;

    mapping(uint256 => uint256) private claimedBitMap;

    event WithdrawTokens(address indexed withdrawer, address token, uint256 amount);
    event WithdrawRewardTokens(address indexed withdrawer, uint256 amount);
    event WithdrawAllRewardTokens(address indexed withdrawer, uint256 amount);
    event Deposit(address indexed depositor, uint256 amount);

    modifier transferTokenToVault(uint256 value) {
        if (msg.value != 0) {
            require(token == wNative, "token is not wNative");
            require(value == msg.value, "value != msg.value");
            IWETH(wNative).deposit{ value: msg.value }();
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), value);
        }
        _;
    }

    function initialize(
        address wNative_,
        address token_,
        bytes32 merkleRoot_
    ) external virtual initializer {
        __Ownable_init();
        wNative = wNative_;
        token = token_;
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
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external override {
        require(!isClaimed(index), "MerkleDistributor::claim:: drop already claimed");

        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "MerkleDistributor::claim:: invalid proof");

        _setClaimed(index);
        _safeUnwrap(account, amount);

        emit Claimed(index, account, amount);
    }

    function deposit(uint256 _amount)
        external
        payable
        transferTokenToVault(_amount)
    {
        emit Deposit(msg.sender, _amount);
    }

    function withdrawTokens(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit WithdrawTokens(msg.sender, _token, _amount);
    }

    function withdrawRewardTokens(uint256 _amount) external onlyOwner {
        _safeUnwrap(msg.sender, _amount);
        emit WithdrawRewardTokens(msg.sender, _amount);
    }

    function withdrawAllRewardTokens() external onlyOwner {
        uint256 amount = IERC20(token).balanceOf(address(this));
        _safeUnwrap(msg.sender, amount);
        emit WithdrawAllRewardTokens(msg.sender, amount);
    }

    function _safeUnwrap(address to, uint256 amount) internal {
        if (token == wNative) {
            IWETH(token).withdraw(amount);
            Address.sendValue(payable(to), amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
