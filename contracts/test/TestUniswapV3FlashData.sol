// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../interfaces/IUniswapV3Pool.sol';
import '../interfaces/callback/IUniswapV3FlashCallback.sol';

contract TestUniswapV3FlashData is IUniswapV3FlashCallback {
    event FlashData(bytes data);

    function flash(address pool, bytes calldata data) external {
        IUniswapV3Pool(pool).flash(address(this), 0, 0, data);
    }

    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external override {
        require(fee0 == 0 && fee1 == 0);
        emit FlashData(data);
    }
}
