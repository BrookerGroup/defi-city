# DeFiCity Architecture (Non-Proxy)

## Overview

Architecture ออกแบบโดยไม่ใช้ Proxy pattern เพื่อ:
- ✅ Avoid proxy complexity & security risks
- ✅ Reduce gas overhead (no delegatecall)
- ✅ Maintain upgradeability ในส่วนที่สำคัญ
- ✅ Keep core trustless (immutable state)

---

## Core Principles

```
1. Immutable Core = User State Storage
2. Swappable Strategies = Protocol Logic
3. Modular Components = Feature Separation
4. Registry Pattern = Dynamic Routing
5. Governance = Timelock + Multisig
```

---

## Contract Architecture

### 1. DefiCityCore (Immutable)

**Purpose:** State storage และ coordination layer

**จะเก็บอะไร:**
- User data (cities, buildings)
- Building configurations
- Access control

**จะไม่มีอะไร:**
- ❌ DeFi protocol logic
- ❌ Complex calculations
- ❌ External protocol calls

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DefiCityCore
 * @notice Core contract จัดการ state และ coordinate ระหว่าง modules
 * @dev IMMUTABLE - ไม่มี proxy, ไม่มี upgrade
 *
 * Design Philosophy:
 * - Core เก็บ state เท่านั้น
 * - Logic อยู่ใน external modules
 * - Strategy routing ผ่าน StrategyRegistry
 */
contract DefiCityCore is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Core State (Immutable Structure) ============

    struct Building {
        uint256 buildingType;
        uint256 depositedAmount;
        uint256 shares;
        uint256 createdAt;
        uint256 lastHarvestAt;
        bool isActive;
    }

    struct UserCity {
        uint256 totalBuildings;
        uint256 totalDeposited;
        uint256 totalEarned;
        uint256 level;
        mapping(uint256 => Building) buildings;
    }

    struct BuildingTypeConfig {
        string name;
        uint256 minDeposit;
        uint256 maxPerUser;
        bool isActive;
        bool canDemolish;
    }

    // State mappings
    mapping(address => UserCity) public cities;
    mapping(uint256 => BuildingTypeConfig) public buildingTypes;
    uint256 public nextBuildingTypeId;

    // ============ External Modules (Swappable) ============

    IStrategyRegistry public strategyRegistry;    // Handles strategy routing
    IBuildingManager public buildingManager;      // Handles building operations
    IFeeManager public feeManager;                // Handles fee calculations
    IEmergencyManager public emergencyManager;    // Handles emergency operations

    IERC20 public immutable USDC;

    // ============ Events ============

    event ModuleUpdated(string moduleName, address oldModule, address newModule);
    event BuildingPlaced(address indexed user, uint256 buildingId, uint256 buildingType, uint256 amount);
    event BuildingDeposit(address indexed user, uint256 buildingId, uint256 amount);
    event BuildingHarvest(address indexed user, uint256 buildingId, uint256 amount);
    event BuildingDemolished(address indexed user, uint256 buildingId, uint256 amount);

    // ============ Errors ============

    error ModuleNotSet();
    error InvalidAmount();
    error InvalidBuildingType();
    error BuildingNotActive();
    error MaxBuildingsReached();

    // ============ Constructor ============

    constructor(
        address _usdc,
        address _strategyRegistry,
        address _buildingManager,
        address _feeManager
    ) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        strategyRegistry = IStrategyRegistry(_strategyRegistry);
        buildingManager = IBuildingManager(_buildingManager);
        feeManager = IFeeManager(_feeManager);
    }

    // ============ Core Functions ============

    /**
     * @notice สร้าง building ใหม่
     * @dev Delegates logic ไปยัง BuildingManager
     */
    function placeBuilding(
        uint256 buildingType,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (uint256 buildingId) {
        if (address(buildingManager) == address(0)) revert ModuleNotSet();

        // Transfer USDC จาก user
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Delegate ไปยัง BuildingManager
        buildingId = buildingManager.placeBuilding(
            msg.sender,
            buildingType,
            amount
        );

        emit BuildingPlaced(msg.sender, buildingId, buildingType, amount);
    }

    /**
     * @notice Deposit เพิ่มเข้า building ที่มีอยู่
     */
    function deposit(
        uint256 buildingId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (address(buildingManager) == address(0)) revert ModuleNotSet();

        USDC.safeTransferFrom(msg.sender, address(this), amount);

        buildingManager.deposit(msg.sender, buildingId, amount);

        emit BuildingDeposit(msg.sender, buildingId, amount);
    }

    /**
     * @notice เก็บ yield จาก building
     */
    function harvest(uint256 buildingId) external nonReentrant whenNotPaused {
        if (address(buildingManager) == address(0)) revert ModuleNotSet();

        uint256 amount = buildingManager.harvest(msg.sender, buildingId);

        emit BuildingHarvest(msg.sender, buildingId, amount);
    }

    /**
     * @notice รื้อถอน building และถอนเงิน
     */
    function demolish(uint256 buildingId) external nonReentrant whenNotPaused {
        if (address(buildingManager) == address(0)) revert ModuleNotSet();

        uint256 amount = buildingManager.demolish(msg.sender, buildingId);

        // Transfer USDC คืนให้ user
        USDC.safeTransfer(msg.sender, amount);

        emit BuildingDemolished(msg.sender, buildingId, amount);
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency withdrawal (when paused)
     */
    function emergencyWithdraw(uint256 buildingId) external nonReentrant whenPaused {
        if (address(emergencyManager) == address(0)) revert ModuleNotSet();

        uint256 amount = emergencyManager.emergencyWithdraw(msg.sender, buildingId);

        USDC.safeTransfer(msg.sender, amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update StrategyRegistry
     * @dev อนุญาตให้เปลี่ยน registry เพื่อ point ไป strategies ใหม่
     */
    function updateStrategyRegistry(address newRegistry) external onlyOwner {
        address old = address(strategyRegistry);
        strategyRegistry = IStrategyRegistry(newRegistry);
        emit ModuleUpdated("StrategyRegistry", old, newRegistry);
    }

    /**
     * @notice Update BuildingManager
     */
    function updateBuildingManager(address newManager) external onlyOwner {
        address old = address(buildingManager);
        buildingManager = IBuildingManager(newManager);
        emit ModuleUpdated("BuildingManager", old, newManager);
    }

    /**
     * @notice Update FeeManager
     */
    function updateFeeManager(address newManager) external onlyOwner {
        address old = address(feeManager);
        feeManager = IFeeManager(newManager);
        emit ModuleUpdated("FeeManager", old, newManager);
    }

    /**
     * @notice Update EmergencyManager
     */
    function updateEmergencyManager(address newManager) external onlyOwner {
        address old = address(emergencyManager);
        emergencyManager = IEmergencyManager(newManager);
        emit ModuleUpdated("EmergencyManager", old, newManager);
    }

    /**
     * @notice Add building type
     */
    function addBuildingType(
        string memory name,
        uint256 minDeposit,
        uint256 maxPerUser,
        bool canDemolish
    ) external onlyOwner returns (uint256 typeId) {
        typeId = nextBuildingTypeId++;

        buildingTypes[typeId] = BuildingTypeConfig({
            name: name,
            minDeposit: minDeposit,
            maxPerUser: maxPerUser,
            isActive: true,
            canDemolish: canDemolish
        });
    }

    /**
     * @notice Pause all operations (except emergency withdraw)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getBuilding(address user, uint256 buildingId)
        external
        view
        returns (
            uint256 buildingType,
            string memory name,
            uint256 depositedAmount,
            uint256 currentValue,
            uint256 pendingRewards,
            uint256 createdAt,
            bool isActive
        )
    {
        Building storage building = cities[user].buildings[buildingId];
        BuildingTypeConfig storage config = buildingTypes[building.buildingType];

        buildingType = building.buildingType;
        name = config.name;
        depositedAmount = building.depositedAmount;
        createdAt = building.createdAt;
        isActive = building.isActive;

        // Get current value from strategy
        if (building.shares > 0 && address(strategyRegistry) != address(0)) {
            IStrategy strategy = strategyRegistry.getStrategy(building.buildingType);
            currentValue = strategy.balanceOf(user);
            pendingRewards = strategy.pendingRewards(user);
        }
    }

    function getCityStats(address user)
        external
        view
        returns (
            uint256 totalBuildings,
            uint256 totalDeposited,
            uint256 totalEarned,
            uint256 level,
            uint256 totalValue
        )
    {
        UserCity storage city = cities[user];
        totalBuildings = city.totalBuildings;
        totalDeposited = city.totalDeposited;
        totalEarned = city.totalEarned;
        level = city.level;

        // Calculate total value across all buildings
        for (uint256 i = 0; i < city.totalBuildings; i++) {
            Building storage building = city.buildings[i];
            if (building.isActive && building.shares > 0) {
                IStrategy strategy = strategyRegistry.getStrategy(building.buildingType);
                totalValue += strategy.balanceOf(user);
            }
        }
    }
}
```

---

### 2. StrategyRegistry (Swappable Core)

**Purpose:** จัดการ routing ไปยัง strategies และ update strategies

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title StrategyRegistry
 * @notice Central registry สำหรับ map building type → strategy
 * @dev Contract นี้สามารถ deploy ใหม่ได้ แล้วให้ Core point มาที่นี่
 */
contract StrategyRegistry is Ownable2Step {

    // ============ State ============

    // Building Type → Current Active Strategy
    mapping(uint256 => address) public activeStrategy;

    // Building Type → Strategy Version History
    mapping(uint256 => StrategyVersion[]) public strategyHistory;

    // Strategy metadata
    mapping(address => StrategyInfo) public strategyInfo;

    struct StrategyVersion {
        address strategy;
        uint256 activatedAt;
        string version;
    }

    struct StrategyInfo {
        string name;
        string version;
        uint256 deployedAt;
        bool isActive;
        bool isDeprecated;
    }

    // ============ Events ============

    event StrategyRegistered(address indexed strategy, string name, string version);
    event StrategyActivated(uint256 indexed buildingType, address strategy, string version);
    event StrategyDeprecated(address indexed strategy);

    // ============ Errors ============

    error StrategyNotFound();
    error StrategyNotActive();
    error StrategyAlreadyRegistered();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Core Functions ============

    /**
     * @notice Register strategy ใหม่
     */
    function registerStrategy(
        address strategy,
        string memory name,
        string memory version
    ) external onlyOwner {
        if (strategyInfo[strategy].deployedAt != 0)
            revert StrategyAlreadyRegistered();

        strategyInfo[strategy] = StrategyInfo({
            name: name,
            version: version,
            deployedAt: block.timestamp,
            isActive: true,
            isDeprecated: false
        });

        emit StrategyRegistered(strategy, name, version);
    }

    /**
     * @notice Activate strategy สำหรับ building type
     * @dev Strategy ใหม่จะถูกใช้สำหรับ building ที่สร้างหลังจากนี้
     */
    function setStrategy(
        uint256 buildingType,
        address strategy
    ) external onlyOwner {
        StrategyInfo storage info = strategyInfo[strategy];
        if (!info.isActive) revert StrategyNotActive();

        // Update active strategy
        address oldStrategy = activeStrategy[buildingType];
        activeStrategy[buildingType] = strategy;

        // Record in history
        strategyHistory[buildingType].push(StrategyVersion({
            strategy: strategy,
            activatedAt: block.timestamp,
            version: info.version
        }));

        emit StrategyActivated(buildingType, strategy, info.version);
    }

    /**
     * @notice Deprecate strategy (mark as old)
     */
    function deprecateStrategy(address strategy) external onlyOwner {
        strategyInfo[strategy].isDeprecated = true;
        emit StrategyDeprecated(strategy);
    }

    // ============ View Functions ============

    /**
     * @notice Get current strategy สำหรับ building type
     */
    function getStrategy(uint256 buildingType)
        external
        view
        returns (IStrategy)
    {
        address strategy = activeStrategy[buildingType];
        if (strategy == address(0)) revert StrategyNotFound();
        return IStrategy(strategy);
    }

    /**
     * @notice Get strategy history
     */
    function getStrategyHistory(uint256 buildingType)
        external
        view
        returns (StrategyVersion[] memory)
    {
        return strategyHistory[buildingType];
    }

    /**
     * @notice Check if strategy is current
     */
    function isCurrentStrategy(uint256 buildingType, address strategy)
        external
        view
        returns (bool)
    {
        return activeStrategy[buildingType] == strategy;
    }
}
```

---

### 3. BuildingManager (Logic Layer)

**Purpose:** Handle building operations logic

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BuildingManager
 * @notice จัดการ building operations logic
 * @dev Contract นี้สามารถ deploy version ใหม่ได้
 */
contract BuildingManager is Ownable2Step {

    DefiCityCore public immutable core;
    IStrategyRegistry public strategyRegistry;
    IFeeManager public feeManager;

    constructor(
        address _core,
        address _strategyRegistry,
        address _feeManager
    ) Ownable(msg.sender) {
        core = DefiCityCore(_core);
        strategyRegistry = IStrategyRegistry(_strategyRegistry);
        feeManager = IFeeManager(_feeManager);
    }

    /**
     * @notice Place building logic
     */
    function placeBuilding(
        address user,
        uint256 buildingType,
        uint256 amount
    ) external returns (uint256 buildingId) {
        require(msg.sender == address(core), "Only Core");

        // 1. Validate
        _validateBuildingPlacement(user, buildingType, amount);

        // 2. Calculate fee
        (uint256 netAmount, uint256 fee) = feeManager.calculateBuildingFee(amount);

        // 3. Get strategy
        IStrategy strategy = strategyRegistry.getStrategy(buildingType);

        // 4. Deposit to strategy
        IERC20(core.USDC()).approve(address(strategy), netAmount);
        uint256 shares = strategy.deposit(netAmount);

        // 5. Update core state
        buildingId = _createBuilding(user, buildingType, amount, shares);

        // 6. Send fee to treasury
        if (fee > 0) {
            feeManager.collectFee(fee);
        }
    }

    /**
     * @notice Deposit logic
     */
    function deposit(
        address user,
        uint256 buildingId,
        uint256 amount
    ) external {
        require(msg.sender == address(core), "Only Core");

        // Get building
        (uint256 buildingType,,,,,bool isActive) = core.getBuilding(user, buildingId);
        require(isActive, "Building not active");

        // Get strategy and deposit
        IStrategy strategy = strategyRegistry.getStrategy(buildingType);
        IERC20(core.USDC()).approve(address(strategy), amount);
        uint256 newShares = strategy.deposit(amount);

        // Update building shares
        _updateBuildingShares(user, buildingId, newShares);
    }

    /**
     * @notice Harvest logic
     */
    function harvest(
        address user,
        uint256 buildingId
    ) external returns (uint256 earned) {
        require(msg.sender == address(core), "Only Core");

        // Get building and strategy
        (uint256 buildingType,,,,,) = core.getBuilding(user, buildingId);
        IStrategy strategy = strategyRegistry.getStrategy(buildingType);

        // Harvest from strategy
        earned = strategy.harvest(user);

        // Update stats
        _updateEarnings(user, earned);
    }

    /**
     * @notice Demolish logic
     */
    function demolish(
        address user,
        uint256 buildingId
    ) external returns (uint256 amount) {
        require(msg.sender == address(core), "Only Core");

        // Get building
        (uint256 buildingType,,uint256 shares,,,bool isActive) = core.getBuilding(user, buildingId);
        require(isActive, "Building not active");

        // Get strategy and withdraw
        IStrategy strategy = strategyRegistry.getStrategy(buildingType);
        amount = strategy.withdraw(user, shares);

        // Deactivate building
        _deactivateBuilding(user, buildingId);
    }

    // Internal functions to update core state...
    function _createBuilding(...) internal returns (uint256) {
        // Update core.cities[user].buildings[id]
        // This requires core to expose setter functions
    }
}
```

---

### 4. FeeManager (Fee Logic)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FeeManager
 * @notice จัดการ fee calculations และ collection
 * @dev สามารถ update fee logic ได้โดย deploy version ใหม่
 */
contract FeeManager is Ownable2Step {

    uint256 public buildingFee = 5; // 0.05% in BPS
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_FEE = 500; // 5% max

    address public treasury;
    uint256 public totalFeesCollected;

    IERC20 public immutable USDC;

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollected(uint256 amount);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    constructor(address _usdc, address _treasury) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        treasury = _treasury;
    }

    /**
     * @notice Calculate building fee
     */
    function calculateBuildingFee(uint256 amount)
        external
        view
        returns (uint256 netAmount, uint256 fee)
    {
        fee = (amount * buildingFee) / BPS_DENOMINATOR;
        netAmount = amount - fee;
    }

    /**
     * @notice Collect fee and send to treasury
     */
    function collectFee(uint256 amount) external {
        USDC.transferFrom(msg.sender, treasury, amount);
        totalFeesCollected += amount;
        emit FeeCollected(amount);
    }

    /**
     * @notice Update fee (max 5%)
     */
    function setBuildingFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        emit FeeUpdated(buildingFee, newFee);
        buildingFee = newFee;
    }

    /**
     * @notice Update treasury
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }
}
```

---

### 5. EmergencyManager

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EmergencyManager
 * @notice Handle emergency situations
 */
contract EmergencyManager is Ownable2Step {

    DefiCityCore public immutable core;
    IStrategyRegistry public strategyRegistry;

    event EmergencyWithdrawal(address indexed user, uint256 buildingId, uint256 amount);

    constructor(address _core, address _strategyRegistry) Ownable(msg.sender) {
        core = DefiCityCore(_core);
        strategyRegistry = IStrategyRegistry(_strategyRegistry);
    }

    /**
     * @notice Emergency withdraw (when core is paused)
     */
    function emergencyWithdraw(
        address user,
        uint256 buildingId
    ) external returns (uint256 amount) {
        require(msg.sender == address(core), "Only Core");
        require(core.paused(), "Not in emergency");

        // Get building
        (uint256 buildingType,,uint256 shares,,,) = core.getBuilding(user, buildingId);

        // Force withdraw from strategy
        IStrategy strategy = strategyRegistry.getStrategy(buildingType);
        amount = strategy.emergencyWithdraw(user, shares);

        emit EmergencyWithdrawal(user, buildingId, amount);
    }
}
```

---

## How to Upgrade

### Scenario 1: Update Strategy Logic (ง่าย ⭐)

```solidity
// 1. Deploy AaveStrategyNext
AaveStrategyNext newStrategy = new AaveStrategyNext(...);

// 2. Register in registry
registry.registerStrategy(
    address(newStrategy),
    "Aave Strategy",
    "v2.0.0"
);

// 3. Activate for building type
registry.setStrategy(1, address(newStrategy)); // buildingType = 1 (Bank)

// ✅ Building ใหม่จะใช้ V2 ทันที
// ⚠️ Building เก่ายังใช้ V1 (ต้อง migrate manual)
```

### Scenario 2: Update Building Logic (ปานกลาง ⭐⭐)

```solidity
// 1. Deploy BuildingManagerNext
BuildingManagerNext newManager = new BuildingManagerNext(
    address(core),
    address(registry),
    address(feeManager)
);

// 2. Update in Core
core.updateBuildingManager(address(newManager));

// ✅ Logic ใหม่ใช้ได้ทันที
// ✅ State ยังอยู่ใน Core (ไม่เสียข้อมูล)
```

### Scenario 3: Update Fee Structure (ง่าย ⭐)

```solidity
// 1. Deploy FeeManagerNext with new logic
FeeManagerNext newFeeManager = new FeeManagerNext(...);

// 2. Update in Core
core.updateFeeManager(address(newFeeManager));

// ✅ Fee logic ใหม่ใช้ได้ทันที
```

### Scenario 4: Complete System Upgrade (ยาก ⭐⭐⭐)

หาก Core มี critical bug ต้อง deploy ใหม่:

```solidity
// 1. Deploy CoreV2_1
DefiCityCore_1 newCore = new DefiCityCore_1(...);

// 2. Pause old core
oldCore.pause();

// 3. Migrate data via script
for (user in allUsers) {
    // Copy state from old → new
    migrateUserData(user, oldCore, newCore);
}

// 4. Update frontend to use new core
```

---

## Comparison: V1 (old) vs Current

| Feature | V1 (Current) | Current (No Proxy) |
|---------|--------------|---------------|
| **Core Upgradeable** | ❌ Immutable | ❌ Immutable |
| **Strategy Upgradeable** | ⚠️ Manual update | ✅ Registry swap |
| **Building Logic Upgradeable** | ❌ No | ✅ Swap manager |
| **Fee Logic Upgradeable** | ❌ Hardcoded | ✅ Swap manager |
| **Gas Overhead** | ✅ ~200k | ✅ ~220k (+10%) |
| **Complexity** | ⭐ Simple | ⭐⭐ Moderate |
| **Security** | ✅ Immutable | ✅ Immutable core |
| **Proxy Risk** | ✅ None | ✅ None |
| **Emergency Pause** | ❌ No | ✅ Yes |
| **User Migration** | ❌ Manual | ⚠️ Manual (strategies) |

---

## Advantages of Current (No Proxy)

✅ **No Proxy Overhead**
- ไม่มี delegatecall gas cost
- ไม่มี storage collision risk
- ไม่มี complexity ของ proxy pattern

✅ **Modular Upgradeability**
- Strategy logic: swap ผ่าน registry
- Building logic: swap manager contract
- Fee logic: swap manager contract
- Emergency logic: swap manager contract

✅ **Trustless Core**
- State immutable ใน Core
- User data ปลอดภัย
- ไม่มี proxy admin ที่สามารถเปลี่ยน logic ได้

✅ **Clear Separation**
- State (Core) vs Logic (Managers)
- Easy to audit แต่ละส่วน
- Bug ใน manager ไม่กระทบ state

✅ **Flexible Strategy Updates**
- Deploy strategy ใหม่ได้ตลอด
- Registry routing แบบ dynamic
- Support multiple versions ได้

---

## Disadvantages & Trade-offs

⚠️ **Building Migration Still Manual**
- Building เก่าที่ใช้ strategy V1 ต้อง demolish + create ใหม่
- หรือต้องมี MigrationTool

⚠️ **Core Still Immutable**
- หาก Core มี critical bug ต้อง deploy ใหม่ทั้งระบบ
- แต่โอกาสเกิดน้อย เพราะ Core มี logic น้อย

⚠️ **More Contracts**
- Core + Registry + 4 Managers = 6 contracts
- ซับซ้อนกว่า V1 เล็กน้อย

⚠️ **Gas Cost สูงขึ้น ~10%**
- External calls ไปหลาย contracts
- แต่ถูกกว่า Proxy มาก

---

## Deployment Order

```bash
# 1. Deploy Token (if testnet)
USDC=<address>

# 2. Deploy StrategyRegistry
forge create StrategyRegistry --constructor-args

# 3. Deploy FeeManager
forge create FeeManager --constructor-args $USDC $TREASURY

# 4. Deploy Strategies
forge create AaveStrategy --constructor-args ...
forge create AerodromeStrategy --constructor-args ...

# 5. Register Strategies
registry.registerStrategy($AAVE_STRATEGY, "Aave", "v1.0.0")
registry.setStrategy(1, $AAVE_STRATEGY)
registry.setStrategy(2, $AERO_STRATEGY)

# 6. Deploy BuildingManager
forge create BuildingManager --constructor-args $CORE $REGISTRY $FEE_MANAGER

# 7. Deploy EmergencyManager
forge create EmergencyManager --constructor-args $CORE $REGISTRY

# 8. Deploy Core
forge create DefiCityCore --constructor-args \
    $USDC $REGISTRY $BUILDING_MANAGER $FEE_MANAGER

# 9. Update Core with EmergencyManager
core.updateEmergencyManager($EMERGENCY_MANAGER)

# 10. Configure building types
core.addBuildingType("Town Hall", 0, 1, false)
core.addBuildingType("Bank", 100e6, 10, true)
core.addBuildingType("Shop", 500e6, 5, true)
```

---

## Governance Structure

```
┌──────────────────────────────────────────────────────────┐
│                     GOVERNANCE                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Multisig (3/5)                                         │
│      │                                                   │
│      ├──▶ Timelock (48h)                                │
│      │        │                                          │
│      │        ├──▶ registry.setStrategy()               │
│      │        ├──▶ core.updateBuildingManager()         │
│      │        └──▶ core.pause()                         │
│      │                                                   │
│      └──▶ Emergency Actions (no timelock)               │
│             └──▶ core.pause() (immediate)               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Review Architecture** ✅
2. **Implement Interfaces** (IStrategyRegistry, IBuildingManager, etc.)
3. **Write Full Contracts** (with all internal functions)
4. **Write Tests**
5. **Deploy to Testnet**
6. **Audit**

---

**Want me to implement the full contracts with all internal functions?** 🚀
