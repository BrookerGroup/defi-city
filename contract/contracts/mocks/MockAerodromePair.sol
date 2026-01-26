// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAerodromeRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAerodromePair
 * @notice Full simulation mock of Aerodrome LP token/pair for testing
 * @dev Implements LP token with reserves, fees, and trading simulation
 */
contract MockAerodromePair is IAerodromePair {

    // ============ State Variables ============

    // Token addresses
    address public immutable token0;
    address public immutable token1;
    bool public immutable stable;

    // Reserves
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public blockTimestampLast;

    // LP Token (ERC20-like)
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Fee tracking (accumulated fees claimable by LPs)
    mapping(address => uint256) public claimableFees0;
    mapping(address => uint256) public claimableFees1;

    // Total fees collected
    uint256 public totalFees0;
    uint256 public totalFees1;

    // Minimum liquidity locked forever
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    // ============ Events ============

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed sender, address indexed to, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, address indexed to, uint256 amount0, uint256 amount1);
    event Sync(uint256 reserve0, uint256 reserve1);
    event FeesClaimed(address indexed user, uint256 amount0, uint256 amount1);
    event FeesAdded(address indexed user, uint256 amount0, uint256 amount1);

    // ============ Constructor ============

    constructor(address _token0, address _token1, bool _stable) {
        token0 = _token0;
        token1 = _token1;
        stable = _stable;

        name = _stable ? "Aerodrome Stable LP" : "Aerodrome Volatile LP";
        symbol = _stable ? "sAMM-LP" : "vAMM-LP";
    }

    // ============ IAerodromePair Implementation ============

    function getReserves() external view override returns (
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _blockTimestampLast
    ) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function tokens() external view override returns (address _token0, address _token1) {
        _token0 = token0;
        _token1 = token1;
    }

    function claimFees() external override returns (uint256 claimed0, uint256 claimed1) {
        claimed0 = claimableFees0[msg.sender];
        claimed1 = claimableFees1[msg.sender];

        if (claimed0 > 0) {
            claimableFees0[msg.sender] = 0;
            IERC20(token0).transfer(msg.sender, claimed0);
        }

        if (claimed1 > 0) {
            claimableFees1[msg.sender] = 0;
            IERC20(token1).transfer(msg.sender, claimed1);
        }

        emit FeesClaimed(msg.sender, claimed0, claimed1);
        return (claimed0, claimed1);
    }

    function claimable0(address account) external view override returns (uint256) {
        return claimableFees0[account];
    }

    function claimable1(address account) external view override returns (uint256) {
        return claimableFees1[account];
    }

    // ============ LP Token Functions ============

    function mint(address to, uint256 amount0, uint256 amount1) external returns (uint256 liquidity) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        uint256 _totalSupply = totalSupply;

        if (_totalSupply == 0) {
            // First liquidity provider
            liquidity = _sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Lock minimum liquidity
        } else {
            // Subsequent liquidity
            liquidity = _min(
                (amount0 * _totalSupply) / reserve0,
                (amount1 * _totalSupply) / reserve1
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(to, liquidity);

        _update(balance0, balance1);

        emit Mint(msg.sender, to, amount0, amount1);
        return liquidity;
    }

    function burn(address to) external returns (uint256 amount0, uint256 amount1) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 liquidity = balanceOf[address(this)];

        uint256 _totalSupply = totalSupply;
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");

        _burn(address(this), liquidity);

        IERC20(token0).transfer(to, amount0);
        IERC20(token1).transfer(to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));

        _update(balance0, balance1);

        emit Burn(msg.sender, to, amount0, amount1);
        return (amount0, amount1);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= value;
        }
        _transfer(from, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    // ============ Internal Functions ============

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        balanceOf[from] -= value;
        totalSupply -= value;
        emit Transfer(from, address(0), value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _update(uint256 balance0, uint256 balance1) internal {
        reserve0 = balance0;
        reserve1 = balance1;
        blockTimestampLast = block.timestamp;
        emit Sync(reserve0, reserve1);
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // ============ Test Helper Functions ============

    /**
     * @notice Simulate trading fees for testing
     * @dev Adds fees to a specific LP provider's claimable balance
     */
    function addTradingFees(address user, uint256 amount0, uint256 amount1) external {
        if (amount0 > 0) {
            claimableFees0[user] += amount0;
            totalFees0 += amount0;
        }
        if (amount1 > 0) {
            claimableFees1[user] += amount1;
            totalFees1 += amount1;
        }

        emit FeesAdded(user, amount0, amount1);
    }

    /**
     * @notice Manually set reserves (for testing edge cases)
     */
    function setReserves(uint256 _reserve0, uint256 _reserve1) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        blockTimestampLast = block.timestamp;
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Get LP token balance
     */
    function getLPBalance(address account) external view returns (uint256) {
        return balanceOf[account];
    }
}
