// SPDX-License-Identifier: MIT

pragma solidity >=0.6.12;

interface IEpochController {
    function epoch() external view returns (uint256);

    function nextEpochPoint() external view returns (uint256);

    function nextEpochLength() external view returns (uint256);

    function nextEpochAllocatedReward(address _pool) external view returns (uint256);
}
