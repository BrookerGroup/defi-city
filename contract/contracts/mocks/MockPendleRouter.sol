// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IPendleRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockPT
 * @notice Mock Principal Token for testing Pendle integration
 * @dev Uses same decimals as underlying (6 for USDC)
 *      1 PT = 1 USDC at maturity
 */
contract MockPT is ERC20 {
    address public router;
    uint8 private _decimals;

    error OnlyRouter();

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address _router
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        router = _router;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != router) revert OnlyRouter();
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        if (msg.sender != router) revert OnlyRouter();
        _burn(from, amount);
    }
}

/**
 * @title MockPendleMarket
 * @notice Mock Pendle Market for testing
 */
contract MockPendleMarket is IPendleMarket {
    address public immutable SY_TOKEN;
    address public immutable PT_TOKEN;
    address public immutable YT_TOKEN;
    uint256 public maturityTimestamp;
    address public owner;

    constructor(
        address _pt,
        uint256 _maturity
    ) {
        SY_TOKEN = address(0); // SY not used in mock
        PT_TOKEN = _pt;
        YT_TOKEN = address(0); // YT not used in mock
        maturityTimestamp = _maturity;
        owner = msg.sender;
    }

    function readTokens() external view override returns (address, address, address) {
        return (SY_TOKEN, PT_TOKEN, YT_TOKEN);
    }

    function expiry() external view override returns (uint256) {
        return maturityTimestamp;
    }

    function isExpired() external view override returns (bool) {
        return block.timestamp >= maturityTimestamp;
    }

    function setMaturity(uint256 _maturity) external {
        require(msg.sender == owner, "Not owner");
        maturityTimestamp = _maturity;
    }
}

/**
 * @title MockPendleRouter
 * @notice Mock Pendle Router V4 for testing
 * @dev Simulates PT buy/sell/redeem with configurable implied rate
 *
 *      Buy:  1000 USDC → 1052 PT (at 5% implied yield)
 *      Sell: 1052 PT → ~1000 USDC (before maturity, at market rate)
 *      Redeem: 1052 PT → 1052 USDC (at maturity, 1:1)
 */
contract MockPendleRouter is IPendleRouter {
    IERC20 public immutable usdc;
    MockPT public immutable pt;
    MockPendleMarket public immutable market;

    // PT price in USDC terms (6 decimals)
    // e.g., 950000 = 0.95 USDC per PT → 5.26% implied yield
    uint256 public ptPrice = 950000;
    uint256 public constant PRICE_PRECISION = 1e6;

    event PtPriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(
        address _usdc,
        uint256 _maturityTimestamp
    ) {
        usdc = IERC20(_usdc);

        // Deploy MockPT (same decimals as USDC = 6)
        pt = new MockPT("Mock PT-USDC", "PT-USDC", 6, address(this));

        // Deploy MockPendleMarket
        market = new MockPendleMarket(address(pt), _maturityTimestamp);
    }

    // ============ IPendleRouter Implementation ============

    /**
     * @notice Buy PT with USDC
     * @dev ptOut = usdcIn * PRICE_PRECISION / ptPrice
     *      e.g., 1000e6 USDC * 1e6 / 950000 = 1052631578 PT (~1052.63 PT)
     */
    function swapExactTokenForPt(
        address receiver,
        address /* _market */,
        uint256 minPtOut,
        ApproxParams calldata /* guessPtOut */,
        TokenInput calldata input,
        LimitOrderData calldata /* limit */
    ) external payable override returns (uint256 netPtOut, uint256 netSyFee, uint256 netSyInterm) {
        // Pull USDC from caller
        usdc.transferFrom(msg.sender, address(this), input.netTokenIn);

        // Calculate PT amount: more PT per USDC since PT is discounted
        netPtOut = (input.netTokenIn * PRICE_PRECISION) / ptPrice;
        require(netPtOut >= minPtOut, "Insufficient PT out");

        // Mint PT to receiver
        pt.mint(receiver, netPtOut);

        netSyFee = 0;
        netSyInterm = 0;
    }

    /**
     * @notice Sell PT for USDC before maturity
     * @dev usdcOut = ptIn * ptPrice / PRICE_PRECISION
     */
    function swapExactPtForToken(
        address receiver,
        address /* _market */,
        uint256 exactPtIn,
        TokenOutput calldata output,
        LimitOrderData calldata /* limit */
    ) external override returns (uint256 netTokenOut, uint256 netSyFee, uint256 netSyInterm) {
        // Pull and burn PT from caller
        pt.burn(msg.sender, exactPtIn);

        // Calculate USDC at current market price
        netTokenOut = (exactPtIn * ptPrice) / PRICE_PRECISION;
        require(netTokenOut >= output.minTokenOut, "Insufficient token out");

        // Send USDC to receiver
        usdc.transfer(receiver, netTokenOut);

        netSyFee = 0;
        netSyInterm = 0;
    }

    /**
     * @notice Redeem PT for USDC at maturity (1 PT = 1 USDC)
     */
    function redeemPyToToken(
        address receiver,
        address /* YT */,
        uint256 netPyIn,
        TokenOutput calldata output
    ) external override returns (uint256 netTokenOut, uint256 netSyInterm) {
        require(block.timestamp >= market.expiry(), "Not matured yet");

        // Burn PT
        pt.burn(msg.sender, netPyIn);

        // 1 PT = 1 USDC at maturity (same decimals)
        netTokenOut = netPyIn;
        require(netTokenOut >= output.minTokenOut, "Insufficient token out");

        // Send USDC
        usdc.transfer(receiver, netTokenOut);

        netSyInterm = 0;
    }

    // ============ Test Helpers ============

    /**
     * @notice Set PT price for testing different yield scenarios
     * @param _ptPrice Price in USDC terms (6 decimals). 950000 = 0.95 USDC per PT
     */
    function setPtPrice(uint256 _ptPrice) external {
        require(_ptPrice > 0 && _ptPrice <= PRICE_PRECISION, "Invalid price");
        uint256 oldPrice = ptPrice;
        ptPrice = _ptPrice;
        emit PtPriceUpdated(oldPrice, _ptPrice);
    }

    /**
     * @notice Set maturity timestamp for testing
     */
    function setMaturity(uint256 _maturity) external {
        market.setMaturity(_maturity);
    }

    /**
     * @notice Get market address for use in adapter params
     */
    function getMarket() external view returns (address) {
        return address(market);
    }

    /**
     * @notice Get PT address
     */
    function getPT() external view returns (address) {
        return address(pt);
    }

    /**
     * @notice Add USDC liquidity for redemptions
     * @dev Call this after transferring USDC to the router
     */
    function addLiquidity(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
    }
}
