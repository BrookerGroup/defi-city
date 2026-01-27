// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../factory/WalletFactory.sol";

/**
 * @title DefiCityCore
 * @notice Core bookkeeping contract for DefiCity game state management
 * @dev This contract tracks buildings, user statistics, and portfolio data
 *      All token custody is handled by user's SmartWallet
 *      This contract NEVER holds user tokens
 *      Uses AccessControl for granular permissions alongside Ownable
 */
contract DefiCityCore is ReentrancyGuard, Pausable, Ownable, AccessControl {

    // ============ Access Control Roles ============

    /// @notice Role for pausing/unpausing the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Role for managing supported assets
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    /// @notice Role for managing modules (building manager, fee manager, etc)
    bytes32 public constant MODULE_MANAGER_ROLE = keccak256("MODULE_MANAGER_ROLE");

    /// @notice Role for emergency operations
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // ============ Constants ============

    /// @notice Maximum fee in basis points (1% = 100 bps)
    uint256 public constant MAX_FEE_BPS = 100;

    // ============ State Variables ============

    /// @notice Treasury for protocol fees
    address public treasury;

    /// @notice Supported assets (USDC, USDT, ETH, WBTC)
    mapping(address => bool) public supportedAssets;

    /// @notice User EOA → SmartWallet mapping
    mapping(address => address) public userSmartWallets;

    /// @notice SmartWallet → User EOA reverse mapping
    mapping(address => address) public walletToOwner;

    /// @notice Module addresses (swappable for upgrades)
    address public buildingManager;
    address public feeManager;
    address public emergencyManager;

    /// @notice WalletFactory address
    WalletFactory public walletFactory;

    /// @notice Building counter
    uint256 public buildingIdCounter;

    /// @notice Building data structure
    struct Building {
        uint256 id;
        address owner;          // User's EOA
        address smartWallet;    // User's SmartWallet
        string buildingType;    // Flexible building type (e.g., "bank", "shop", "lottery")
        address asset;          // Asset type (USDC, ETH, etc.)
        uint256 amount;         // Initial amount invested
        uint256 placedAt;       // Timestamp
        uint256 coordinateX;    // Map position X
        uint256 coordinateY;    // Map position Y
        bool active;            // Is building active
        bytes metadata;         // Extra data (e.g., Aave mode, LP pair)
    }

    /// @notice buildingId → Building
    mapping(uint256 => Building) public buildings;

    /// @notice User EOA → buildingIds[]
    mapping(address => uint256[]) public userBuildings;

    /// @notice User → Grid position (x,y) → buildingId
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userGridBuildings;

    /// @notice User statistics (for leaderboard/analytics)
    struct UserStats {
        uint256 totalDeposited;   // Lifetime deposits (accounting only)
        uint256 totalWithdrawn;   // Lifetime withdrawals (accounting only)
        uint256 totalHarvested;   // Lifetime harvested
        uint256 buildingCount;    // Active buildings
        uint256 cityCreatedAt;    // First interaction (Town Hall placement)
    }

    mapping(address => UserStats) public userStats;

    // ============ Events ============

    event WalletRegistered(address indexed user, address indexed smartWallet);

    event BuildingPlaced(
        uint256 indexed buildingId,
        address indexed user,
        address indexed smartWallet,
        string buildingType,
        address asset,
        uint256 amount,
        uint256 x,
        uint256 y
    );

    event BuildingDemolished(
        uint256 indexed buildingId,
        address indexed user,
        uint256 returnedAmount
    );

    event Harvested(
        uint256 indexed buildingId,
        address indexed user,
        uint256 yieldAmount
    );

    event DepositRecorded(
        address indexed user,
        address indexed asset,
        uint256 amount
    );

    event WithdrawalRecorded(
        address indexed user,
        address indexed asset,
        uint256 amount
    );

    event ModulesUpdated(
        address buildingManager,
        address feeManager,
        address emergencyManager
    );
    event FactoryUpdated(address walletFactory);

    event AssetAdded(address indexed asset);
    event AssetRemoved(address indexed asset);

    // ============ Errors ============

    error OnlyUserWallet();
    error OnlyModules();
    error WalletAlreadyRegistered();
    error WalletNotRegistered();
    error InvalidOwner();
    error GridOccupied();
    error BuildingNotFound();
    error BuildingNotActive();
    error NotBuildingOwner();
    error InvalidBuildingType();
    error AssetNotSupported();
    error InvalidCoordinates();

    // ============ Modifiers ============

    /**
     * @notice Restricts function access to registered SmartWallets only
     * @dev Validates msg.sender using walletToOwner mapping
     */
    modifier onlyUserWallet() {
        address walletOwner = walletToOwner[msg.sender];
        if (walletOwner == address(0)) revert OnlyUserWallet();
        _;
    }

    /**
     * @notice Restricts function access to authorized modules
     * @dev Allows BuildingManager, FeeManager, or EmergencyManager
     */
    modifier onlyModules() {
        if (msg.sender != buildingManager &&
            msg.sender != feeManager &&
            msg.sender != emergencyManager) {
            revert OnlyModules();
        }
        _;
    }

    // ============ Constructor ============

    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert InvalidOwner();
        treasury = _treasury;

        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ASSET_MANAGER_ROLE, msg.sender);
        _grantRole(MODULE_MANAGER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ============ Wallet Registration ============

    /**
     * @notice Registers a SmartWallet for a user
     * @dev Only callable by WalletFactory. Updates both forward and reverse mappings.
     * @param user User's EOA address
     * @param smartWallet Address of user's SmartWallet
     */
    function registerWallet(
        address user,
        address smartWallet
    ) external whenNotPaused {
        if (user == address(0) || smartWallet == address(0)) revert InvalidOwner();
        if (userSmartWallets[user] != address(0)) revert WalletAlreadyRegistered();
        if (msg.sender != address(walletFactory)) revert OnlyModules();

        userSmartWallets[user] = smartWallet;
        walletToOwner[smartWallet] = user;
        userStats[user].cityCreatedAt = block.timestamp;

        emit WalletRegistered(user, smartWallet);
    }

    // ============ Building Management ============

    /**
     * @notice Creates SmartWallet and places Town Hall as the first building
     * @dev Entry point for new players. Wallet creation and Town Hall placement in single transaction.
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @return walletAddress Address of the created SmartWallet
     * @return buildingId ID of the Town Hall building
     */
    function createTownHall(
        uint256 x,
        uint256 y
    ) external nonReentrant whenNotPaused returns (address walletAddress, uint256 buildingId) {
        address user = msg.sender;

        // Check if user already has a wallet
        if (userSmartWallets[user] != address(0)) revert WalletAlreadyRegistered();

        // Check grid position (user's own grid)
        if (userGridBuildings[user][x][y] != 0) revert GridOccupied();

        // 1. Create SmartWallet via Factory
        SmartWallet wallet = walletFactory.createWallet(user, 0);
        walletAddress = address(wallet);

        // 2. Create Town Hall building
        buildingId = ++buildingIdCounter;

        buildings[buildingId] = Building({
            id: buildingId,
            owner: user,
            smartWallet: walletAddress,
            buildingType: "townhall",
            asset: address(0),
            amount: 0,
            placedAt: block.timestamp,
            coordinateX: x,
            coordinateY: y,
            active: true,
            metadata: abi.encode("First Town Hall")
        });

        userBuildings[user].push(buildingId);
        userGridBuildings[user][x][y] = buildingId;
        userStats[user].buildingCount++;

        emit BuildingPlaced(
            buildingId,
            user,
            walletAddress,
            "townhall",
            address(0),
            0,
            x,
            y
        );

        return (walletAddress, buildingId);
    }

    /**
     * @notice Records building placement on the grid after DeFi interaction
     * @dev Called by user's SmartWallet after executing DeFi operations (e.g., Aave supply)
     * @param user User's EOA address
     * @param buildingType Type of building (e.g., "bank", "shop", "lottery")
     * @param asset Asset address used for the building
     * @param amount Amount invested in the building
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @param metadata Extra data (e.g., Aave mode, LP pair information)
     * @return buildingId The ID of the newly created building
     */
    function recordBuildingPlacement(
        address user,
        string calldata buildingType,
        address asset,
        uint256 amount,
        uint256 x,
        uint256 y,
        bytes calldata metadata
    ) external nonReentrant whenNotPaused returns (uint256 buildingId) {
        // Verify caller is user's SmartWallet
        address userWallet = userSmartWallets[user];
        if (userWallet == address(0)) revert WalletNotRegistered();
        if (msg.sender != userWallet) revert OnlyUserWallet();

        // Validate inputs
        if (bytes(buildingType).length == 0) revert InvalidBuildingType();
        if (asset != address(0) && !supportedAssets[asset]) revert AssetNotSupported();

        // Check grid position (user's own grid)
        if (userGridBuildings[user][x][y] != 0) revert GridOccupied();

        // Create building
        buildingId = ++buildingIdCounter;

        buildings[buildingId] = Building({
            id: buildingId,
            owner: user,
            smartWallet: msg.sender,
            buildingType: buildingType,
            asset: asset,
            amount: amount,
            placedAt: block.timestamp,
            coordinateX: x,
            coordinateY: y,
            active: true,
            metadata: metadata
        });

        userBuildings[user].push(buildingId);
        userGridBuildings[user][x][y] = buildingId;
        userStats[user].buildingCount++;

        emit BuildingPlaced(
            buildingId,
            user,
            msg.sender,
            buildingType,
            asset,
            amount,
            x,
            y
        );

        return buildingId;
    }

    /**
     * @notice Records harvest of rewards from a building
     * @dev Called by user's SmartWallet after claiming rewards from DeFi protocols
     * @param user User's EOA address
     * @param buildingId Building ID to harvest from
     * @param yieldAmount Amount of rewards harvested
     */
    function recordHarvest(
        address user,
        uint256 buildingId,
        uint256 yieldAmount
    ) external nonReentrant whenNotPaused {
        Building storage building = buildings[buildingId];
        if (building.id == 0) revert BuildingNotFound();
        if (!building.active) revert BuildingNotActive();
        if (building.owner != user) revert NotBuildingOwner();

        // Verify caller is user's SmartWallet
        if (msg.sender != userSmartWallets[user]) revert OnlyUserWallet();

        userStats[user].totalHarvested += yieldAmount;

        emit Harvested(buildingId, user, yieldAmount);
    }

    /**
     * @notice Records building demolition and clears grid position
     * @dev Called by user's SmartWallet after withdrawing funds from DeFi protocols
     * @param user User's EOA address
     * @param buildingId Building ID to demolish
     * @param returnedAmount Amount returned from DeFi protocol
     */
    function recordDemolition(
        address user,
        uint256 buildingId,
        uint256 returnedAmount
    ) external nonReentrant whenNotPaused {
        Building storage building = buildings[buildingId];
        if (building.id == 0) revert BuildingNotFound();
        if (!building.active) revert BuildingNotActive();
        if (building.owner != user) revert NotBuildingOwner();

        // Verify caller is user's SmartWallet
        if (msg.sender != userSmartWallets[user]) revert OnlyUserWallet();

        // Mark building as inactive
        building.active = false;

        userStats[user].buildingCount--;

        // Clear grid (user's own grid)
        userGridBuildings[user][building.coordinateX][building.coordinateY] = 0;

        emit BuildingDemolished(buildingId, user, returnedAmount);
    }

    // ============ Portfolio Tracking ============

    /**
     * @notice Records deposit for analytics and leaderboard tracking
     * @dev Called by user's SmartWallet. Tracks lifetime deposit statistics only - tokens stay in SmartWallet.
     * @param user User's EOA address
     * @param asset Asset address
     * @param amount Amount deposited
     */
    function recordDeposit(
        address user,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused onlyUserWallet {
        // Verify caller is user's SmartWallet
        address smartWallet = userSmartWallets[user];
        if (smartWallet == address(0)) revert WalletNotRegistered();
        if (msg.sender != smartWallet) revert OnlyUserWallet();

        userStats[user].totalDeposited += amount;

        emit DepositRecorded(user, asset, amount);
    }

    /**
     * @notice Records withdrawal for analytics and leaderboard tracking
     * @dev Called by user's SmartWallet. Tracks lifetime withdrawal statistics.
     * @param user User's EOA address
     * @param asset Asset address
     * @param amount Amount withdrawn
     */
    function recordWithdrawal(
        address user,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused onlyUserWallet {
        // Verify caller is user's SmartWallet
        address smartWallet = userSmartWallets[user];
        if (smartWallet == address(0)) revert WalletNotRegistered();
        if (msg.sender != smartWallet) revert OnlyUserWallet();

        userStats[user].totalWithdrawn += amount;

        emit WithdrawalRecorded(user, asset, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get user's buildings
     * @param user User's EOA address
     * @return Array of Building structs
     */
    function getUserBuildings(
        address user
    ) external view returns (Building[] memory) {
        uint256[] memory buildingIds = userBuildings[user];
        Building[] memory result = new Building[](buildingIds.length);

        for (uint256 i = 0; i < buildingIds.length; i++) {
            result[i] = buildings[buildingIds[i]];
        }

        return result;
    }

    /**
     * @notice Get building at grid position for a specific user
     * @param user User's EOA address
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @return Building struct
     */
    function getBuildingAt(
        address user,
        uint256 x,
        uint256 y
    ) external view returns (Building memory) {
        uint256 buildingId = userGridBuildings[user][x][y];
        return buildings[buildingId];
    }

    /**
     * @notice Get user statistics
     * @param user User's EOA address
     * @return UserStats struct
     */
    function getUserStats(
        address user
    ) external view returns (UserStats memory) {
        return userStats[user];
    }

    /**
     * @notice Check if user has a SmartWallet
     * @param user User's EOA address
     * @return True if user has registered wallet
     */
    function hasWallet(address user) external view returns (bool) {
        return userSmartWallets[user] != address(0);
    }

    /**
     * @notice Get user's SmartWallet address
     * @param user User's EOA address
     * @return SmartWallet address (or address(0) if not registered)
     */
    function getWallet(address user) external view returns (address) {
        return userSmartWallets[user];
    }

    // ============ Admin Functions ============

    /**
     * @notice Sets module addresses for game logic components
     * @dev Enables upgrading modules without redeploying Core contract
     * @param _buildingManager BuildingManager address
     * @param _feeManager FeeManager address
     * @param _emergencyManager EmergencyManager address
     */
    function setModules(
        address _buildingManager,
        address _feeManager,
        address _emergencyManager
    ) external onlyRole(MODULE_MANAGER_ROLE) {
        if (_buildingManager == address(0)) revert InvalidOwner();
        if (_feeManager == address(0)) revert InvalidOwner();
        if (_emergencyManager == address(0)) revert InvalidOwner();

        buildingManager = _buildingManager;
        feeManager = _feeManager;
        emergencyManager = _emergencyManager;

        emit ModulesUpdated(_buildingManager, _feeManager, _emergencyManager);
    }

    /**
     * @notice Sets WalletFactory address for wallet creation
     * @dev Required for Town Hall creation flow
     * @param _walletFactory WalletFactory address
     */
    function setWalletFactory(WalletFactory _walletFactory) external onlyOwner {
        if (address(_walletFactory) == address(0)) revert InvalidOwner();
        walletFactory = _walletFactory;
        emit FactoryUpdated(address(_walletFactory));
    }

    /**
     * @notice Adds an asset to the supported assets list
     * @param asset Asset address to add
     */
    function addSupportedAsset(address asset) external onlyRole(ASSET_MANAGER_ROLE) {
        if (asset == address(0)) revert InvalidOwner();
        supportedAssets[asset] = true;
        emit AssetAdded(asset);
    }

    /**
     * @notice Removes an asset from the supported assets list
     * @param asset Asset address to remove
     */
    function removeSupportedAsset(address asset) external onlyRole(ASSET_MANAGER_ROLE) {
        if (asset == address(0)) revert InvalidOwner();
        supportedAssets[asset] = false;
        emit AssetRemoved(asset);
    }

    /**
     * @notice Updates the treasury address for protocol fees
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidOwner();
        treasury = _treasury;
    }

    /**
     * @notice Pause contract
     * @dev Emergency function
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
