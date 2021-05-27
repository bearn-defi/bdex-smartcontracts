pragma solidity 0.6.12;

import './interfaces/IBdexPair.sol';
import './libraries/TransferHelper.sol';
contract ProtocolFeeRemover {
    address public receiver;
    address public governance;

    event RemoveLiquidity(address indexed pair, uint token0, uint token1);


    constructor() public {
        governance = msg.sender;
    }


    function setReceiver(address _receiver) external {
        require(msg.sender == governance, 'ProtocolFeeRemover: FORBIDDEN');
        receiver = _receiver;
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, 'ProtocolFeeRemover: FORBIDDEN');
        governance = _governance;
    }

    function transfer(address _token, uint256 _value) external {
        require(msg.sender == governance, 'ProtocolFeeRemover: FORBIDDEN');
        require(receiver != address(0), 'ProtocolFeeRemover: Invalid Receiver address');
        TransferHelper.safeTransfer(_token, receiver, _value);
    }

    function remove(address[] calldata pairs) external {
        address _receiver = receiver;
        // save gas
        require(_receiver != address(0), 'ProtocolFeeRemover: Invalid Receiver address');
        for (uint i = 0; i < pairs.length; i++) {
            IBdexPair pair = IBdexPair(pairs[i]);
            uint liquidity = pair.balanceOf(address(this));
            if (liquidity > 0) {
                pair.transfer(address(pair), liquidity);
                (uint amount0, uint amount1) = pair.burn(_receiver);
                emit RemoveLiquidity(address(pair), amount0, amount1);
            }
        }
    }
}
