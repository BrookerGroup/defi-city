// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DefiCityCore
 * @notice Core bookkeeping contract - NEVER holds user tokens
 * @dev All token custody is in user's SmartWallet
 *
 * Architecture:
 * - This contract ONLY tracks game state (buildings, stats, etc.)
 * - It NEVER calls transferFrom() or holds tokens
 * - All DeFi interactions happen via user's SmartWallet
 * - This is purely an accounting/bookkeeping layer
 *
 * Epic Support:
 * - Epic 1: User registration
 * - Epic 2: Portfolio tracking (accounting only)
 * - Epic 3: Town Hall registration
 * - Epic 4: Bank building tracking
 */
contract DefiCityCore is ReentrancyGuard, Pausable, Ownable {

    // ============ State Variables ============

    /// @notice Treasury for protocol fees
    address public treasury;

    /// @notice Supported assets (USDC, USDT, ETH, WBTC)
    mapping(address => bool) public supportedAssets;

    /// @notice User EOA → SmartWallet mapping
    mapping(address => address) public userSmartWallets;

    /// @notice Module addresses (swappable for upgrades)
    address public buildingManager;
    address public feeManager;
    address public emergencyManager;
    address public walletFactory;

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

    /// @notice Grid position → buildingId
    mapping(uint256 => mapping(uint256 => uint256)) public gridBuildings;

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
     * @notice Ensure caller is a registered SmartWallet
     * @dev Only SmartWallets can call building functions
     */
    modifier onlyUserWallet() {
        // msg.sender must be a registered SmartWallet
        bool isRegistered = false;

        // Find the owner of this SmartWallet
        address walletOwner = address(0);
        for (uint256 i = 0; i < 1000; i++) {
            // Simple iteration (gas inefficient but works for MVP)
            // TODO: Optimize with reverse mapping
            if (userSmartWallets[msg.sender] == msg.sender) {
                isRegistered = true;
                walletOwner = msg.sender;
                break;
            }
        }

        if (!isRegistered) revert OnlyUserWallet();
        _;
    }

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
    }

    // ============ Wallet Registration (Epic 3: Town Hall) ============

    /**
     * @notice Register user's SmartWallet
     * @dev Called once when user places Town Hall
     * @param user User's EOA address
     * @param smartWallet Address of user's SmartWallet
     *
     * Epic 3 Support: US-009 (Place Town Hall)
     * This function is called by SmartWallet after deployment
     */
    function registerWallet(
        address user,
        address smartWallet
    ) external nonReentrant whenNotPaused {
        if (user == address(0) || smartWallet == address(0)) revert InvalidOwner();
        if (userSmartWallets[user] != address(0)) revert WalletAlreadyRegistered();

        userSmartWallets[user] = smartWallet;
        userStats[user].cityCreatedAt = block.timestamp;

        emit WalletRegistered(user, smartWallet);
    }

    // ============ Building Management (Epic 3 & 4) ============

    /**
     * @notice Record Town Hall placement (called by Factory)
     * @dev Special function for initial Town Hall creation
     *      This is called by WalletFactory.createTownHall()
     *      and does NOT require call from SmartWallet
     *
     * Epic 3 Support: US-009 (Place Town Hall - First Building)
     *
     * Flow:
     * 1. User connects EOA to game
     * 2. User clicks "Create Town Hall"
     * 3. EOA calls Factory.createTownHall()
     * 4. Factory creates SmartWallet
     * 5. Factory calls this function to record Town Hall
     *
     * @param user User's EOA address
     * @param smartWallet User's SmartWallet address
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @param metadata Extra data
     * @return buildingId ID of the Town Hall building
     */
    function recordTownHallPlacement(
        address user,
        address smartWallet,
        uint256 x,
        uint256 y,
        bytes calldata metadata
    ) external nonReentrant whenNotPaused returns (uint256 buildingId) {
        // Only factory can call this function
        if (msg.sender != walletFactory) revert OnlyModules();

        // Verify wallet is registered
        address userWallet = userSmartWallets[user];
        if (userWallet == address(0)) revert WalletNotRegistered();
        if (userWallet != smartWallet) revert OnlyUserWallet();

        // Check grid position
        if (gridBuildings[x][y] != 0) revert GridOccupied();

        // Create building
        buildingId = ++buildingIdCounter;

        buildings[buildingId] = Building({
            id: buildingId,
            owner: user,
            smartWallet: smartWallet,
            buildingType: "townhall",
            asset: address(0),
            amount: 0,
            placedAt: block.timestamp,
            coordinateX: x,
            coordinateY: y,
            active: true,
            metadata: metadata
        });

        userBuildings[user].push(buildingId);
        gridBuildings[x][y] = buildingId;
        userStats[user].buildingCount++;

        emit BuildingPlaced(
            buildingId,
            user,
            smartWallet,
            "townhall",
            address(0),
            0,
            x,
            y
        );

        return buildingId;
    }

    /**
     * @notice Record building placement
     * @dev Called BY user's SmartWallet after DeFi interaction
     *
     * Epic 3 Support: US-009 (Town Hall)
     * Epic 4 Support: US-011, US-012 (Bank buildings)
     *
     * Flow:
     * 1. User initiates building placement via frontend
     * 2. BuildingManager prepares DeFi calldata
     * 3. SmartWallet executes DeFi interaction (e.g., Aave supply)
     * 4. SmartWallet calls this function to record in Core
     *
     * @param user User's EOA address
     * @param buildingType Type of building (flexible string, e.g., "bank", "shop", "lottery")
     * @param asset Asset address
     * @param amount Amount invested
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @param metadata Extra data (e.g., Aave mode, LP pair)
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

        // Check grid position
        if (gridBuildings[x][y] != 0) revert GridOccupied();

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
        gridBuildings[x][y] = buildingId;
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
     * @notice Record harvest
     * @dev Called BY user's SmartWallet after claiming rewards
     *
     * Epic 4 Support: US-015 (Harvest Bank Rewards)
     *
     * @param user User's EOA address
     * @param buildingId Building ID
     * @param yieldAmount Amount harvested
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
     * @notice Record building demolition
     * @dev Called BY user's SmartWallet after withdrawing from DeFi
     *
     * @param user User's EOA address
     * @param buildingId Building ID
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

        // Clear grid
        gridBuildings[building.coordinateX][building.coordinateY] = 0;

        emit BuildingDemolished(buildingId, user, returnedAmount);
    }

    // ============ Portfolio Tracking (Epic 2) ============

    /**
     * @notice Record deposit for analytics
     * @dev Called when user transfers to their SmartWallet
     *
     * Epic 2 Support: US-005 (Deposit)
     * This is for accounting/analytics only - tokens go to SmartWallet
     *
     * @param user User's EOA address
     * @param asset Asset address
     * @param amount Amount deposited
     */
    function recordDeposit(
        address user,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        address smartWallet = userSmartWallets[user];
        if (smartWallet == address(0)) revert WalletNotRegistered();

        // Can be called by anyone for now (permissionless accounting)
        // TODO: Add access control if needed

        userStats[user].totalDeposited += amount;

        emit DepositRecorded(user, asset, amount);
    }

    /**
     * @notice Record withdrawal for analytics
     * @dev Called when user withdraws from SmartWallet to EOA
     *
     * Epic 2 Support: US-007 (Withdraw)
     *
     * @param user User's EOA address
     * @param asset Asset address
     * @param amount Amount withdrawn
     */
    function recordWithdrawal(
        address user,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        address smartWallet = userSmartWallets[user];
        if (smartWallet == address(0)) revert WalletNotRegistered();

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
     * @notice Get building at grid position
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     * @return Building struct
     */
    function getBuildingAt(
        uint256 x,
        uint256 y
    ) external view returns (Building memory) {
        uint256 buildingId = gridBuildings[x][y];
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
     * @notice Set module addresses
     * @dev Allows upgrading game logic without redeploying Core
     * @param _buildingManager BuildingManager address
     * @param _feeManager FeeManager address
     * @param _emergencyManager EmergencyManager address
     */
    function setModules(
        address _buildingManager,
        address _feeManager,
        address _emergencyManager
    ) external onlyOwner {
        buildingManager = _buildingManager;
        feeManager = _feeManager;
        emergencyManager = _emergencyManager;

        emit ModulesUpdated(_buildingManager, _feeManager, _emergencyManager);
    }

    /**
     * @notice Set WalletFactory address
     * @param _walletFactory WalletFactory address
     * @dev Required for Town Hall creation flow
     */
    function setWalletFactory(address _walletFactory) external onlyOwner {
        walletFactory = _walletFactory;
        emit FactoryUpdated(_walletFactory);
    }

    /**
     * @notice Add supported asset
     * @param asset Asset address to add
     */
    function addSupportedAsset(address asset) external onlyOwner {
        supportedAssets[asset] = true;
        emit AssetAdded(asset);
    }

    /**
     * @notice Remove supported asset
     * @param asset Asset address to remove
     */
    function removeSupportedAsset(address asset) external onlyOwner {
        supportedAssets[asset] = false;
        emit AssetRemoved(asset);
    }

    /**
     * @notice Update treasury address
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
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
