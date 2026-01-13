# ERC-4337 Account Abstraction Architecture

## 1. High-Level Architecture

### 1.1 Complete AA Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ERC-4337 Transaction Flow                            │
└──────────────────────────────────────────────────────────────────────────┘

   ┌─────────┐
   │  User   │
   │  (EOA)  │  Signs UserOperation off-chain
   └────┬────┘
        │
        │ 1. Create & Sign UserOperation
        │    {sender, nonce, callData, signature, ...}
        │
        ▼
   ┌─────────────┐
   │   Bundler   │  Collects UserOps from mempool
   │  (Off-chain)│  Bundles multiple UserOps into single tx
   └──────┬──────┘
          │
          │ 2. Submit bundled tx via handleOps()
          │
          ▼
   ┌──────────────────┐
   │   EntryPoint     │  ◄── Official ERC-4337 contract (0x5FF1...4A73)
   │  (On-chain)      │      Deployed on all major networks
   └────────┬─────────┘
            │
            │ 3. Validate & Execute
            │
            ├─► validateUserOp()  ──► Smart Wallet validates signature
            │                          & checks state
            │
            ├─► Pay gas fees      ──► Deduct from wallet's deposit
            │                          or use Paymaster
            │
            └─► executeUserOp()   ──► Smart Wallet executes the actual call
                                       (deposit to Aave, swap, etc.)

   ┌──────────────────┐
   │  Smart Wallet    │  User's contract-based account
   │  (Your Contract) │  Holds funds, executes logic
   └────────┬─────────┘
            │
            │ 4. Interact with DeFi
            │
            ▼
   ┌─────────────────────────┐
   │  DeFi Protocols         │
   │  • Aave (lending)       │
   │  • Uniswap (LP)         │
   │  • Lido (staking)       │
   └─────────────────────────┘
```

### 1.2 Component Roles

#### **EntryPoint** (Singleton Contract)
- **Address**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (on most EVM chains)
- **Role**: Core coordinator of AA system
- **Responsibilities**:
  - Validates UserOperations before execution
  - Manages gas payments and refunds
  - Prevents replay attacks via nonce management
  - Aggregates validation logic
  - Handles Paymaster integration
- **Key Functions**:
  ```solidity
  function handleOps(UserOperation[] calldata ops, address payable beneficiary)
  function handleAggregatedOps(...)
  function getUserOpHash(UserOperation calldata userOp) returns (bytes32)
  ```
- **Security**: Battle-tested, audited, immutable singleton

#### **Smart Wallet** (User's Account Contract)
- **Role**: User's primary account (replaces EOA)
- **Responsibilities**:
  - Store user funds (ETH, ERC20, NFTs)
  - Validate transaction signatures
  - Execute arbitrary calls to DeFi protocols
  - Maintain nonce for replay protection
  - Manage ownership/permissions
- **Key Functions**:
  ```solidity
  function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
      returns (uint256 validationData)

  function execute(address dest, uint256 value, bytes calldata func)

  function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func)
  ```
- **Ownership Models**:
  - Simple: Single EOA owner
  - Advanced: Multi-sig, social recovery, spending limits

#### **Factory** (Wallet Deployment Contract)
- **Role**: Deploys new Smart Wallets deterministically
- **Responsibilities**:
  - Deploy wallets using CREATE2 (deterministic addresses)
  - Initialize wallet with owner
  - Track deployed wallets (optional registry)
  - Prevent duplicate deployments
- **Key Functions**:
  ```solidity
  function createWallet(address owner, uint256 salt) returns (address)
  function getAddress(address owner, uint256 salt) view returns (address)
  ```
- **Why CREATE2?**:
  - Users can know their wallet address before deployment
  - Can receive funds before wallet exists
  - First transaction deploys + executes in one UserOp

#### **Bundler** (Off-chain Service)
- **Role**: Off-chain relayer service
- **Responsibilities**:
  - Listen to UserOperation mempool
  - Simulate UserOps to prevent griefing
  - Bundle multiple UserOps into single transaction
  - Submit to EntryPoint.handleOps()
  - Get refunded gas + profit
- **Implementation**:
  - Run your own (Infinitism reference implementation)
  - Use third-party (Alchemy, Biconomy, Stackup)
- **Mempool**: Separate from Ethereum tx mempool (prevents front-running)

#### **Paymaster** (Optional - Gasless Transactions)
- **Role**: Sponsors gas for users
- **Responsibilities**:
  - Pay gas fees on behalf of users
  - Implement custom gas sponsorship logic
  - Verify conditions before sponsoring
- **Use Cases**:
  - Free transactions for new users
  - App pays gas for their users
  - Gas paid in ERC20 tokens (USDC instead of ETH)
- **Key Functions**:
  ```solidity
  function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
      returns (bytes memory context, uint256 validationData)

  function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost)
  ```

### 1.3 UserOperation Structure

```solidity
struct UserOperation {
    address sender;              // Smart Wallet address
    uint256 nonce;               // Anti-replay, from EntryPoint
    bytes initCode;              // Factory call to deploy wallet (empty if exists)
    bytes callData;              // Actual function call to Smart Wallet
    uint256 callGasLimit;        // Gas for execution phase
    uint256 verificationGasLimit;// Gas for validation phase
    uint256 preVerificationGas;  // Gas paid to bundler for overhead
    uint256 maxFeePerGas;        // EIP-1559 max fee
    uint256 maxPriorityFeePerGas;// EIP-1559 priority fee
    bytes paymasterAndData;      // Paymaster address + data (or empty)
    bytes signature;             // User's signature over userOpHash
}
```

### 1.4 Transaction Lifecycle

```
Phase 0: User Intent
  ├─ User wants to deposit 100 USDC to Aave
  └─ Frontend constructs UserOperation

Phase 1: Wallet Deployment (if needed)
  ├─ Check if wallet exists at computed CREATE2 address
  ├─ If not: include factory call in initCode
  └─ If yes: initCode = "0x"

Phase 2: UserOperation Construction
  ├─ sender = wallet address (deployed or counterfactual)
  ├─ nonce = get from EntryPoint.getNonce(wallet)
  ├─ callData = abi.encodeWithSelector(wallet.execute.selector, aavePool, 0, depositCalldata)
  ├─ gas limits = estimate via eth_estimateUserOperationGas
  ├─ paymasterAndData = paymaster address + validation data (or "0x")
  └─ signature = user signs userOpHash with their EOA private key

Phase 3: Submission to Bundler
  ├─ Send UserOp to bundler's RPC endpoint
  ├─ Bundler validates UserOp (simulation)
  └─ Bundler adds to mempool

Phase 4: On-chain Execution
  ├─ Bundler calls EntryPoint.handleOps([userOp])
  ├─ EntryPoint validates userOp:
  │   ├─ Deploy wallet if initCode present
  │   ├─ Call wallet.validateUserOp() - checks signature
  │   ├─ Validate paymaster if present
  │   └─ Ensure sufficient gas deposit
  ├─ EntryPoint executes callData on wallet
  ├─ Wallet.execute() is called
  └─ Transaction succeeds/reverts

Phase 5: Gas Settlement
  ├─ Calculate actual gas used
  ├─ Deduct from wallet's deposit in EntryPoint
  ├─ Or charge Paymaster
  └─ Refund bundler + profit
```

---

## 2. Smart Wallet Design

### 2.1 Core Requirements

```solidity
interface ISmartWallet {
    // ERC-4337 Mandatory
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    // Execution
    function execute(address dest, uint256 value, bytes calldata func) external;
    function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external;

    // Deposits for gas
    function addDeposit() external payable;
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) external;
    function getDeposit() external view returns (uint256);
}
```

### 2.2 Validation Logic

The `validateUserOp` function is called by EntryPoint during validation phase:

```solidity
function validateUserOp(
    UserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 missingAccountFunds
) external override returns (uint256 validationData) {
    // CRITICAL: Only EntryPoint can call this
    require(msg.sender == address(entryPoint), "only EntryPoint");

    // 1. Validate signature
    bytes32 hash = userOpHash.toEthSignedMessageHash();
    address signer = hash.recover(userOp.signature);

    if (signer != owner) {
        return SIG_VALIDATION_FAILED; // uint256(1)
    }

    // 2. Pay for gas if needed
    if (missingAccountFunds > 0) {
        // Transfer from wallet's deposit to EntryPoint
        (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
        require(success, "payment failed");
    }

    // 3. Return validation data
    // validationData format: | validAfter | validUntil | authorizer |
    //                         |  6 bytes   |  6 bytes   |  20 bytes  |
    return 0; // Success, valid indefinitely
}
```

**Validation Data Encoding**:
- `0`: Signature valid, no time restrictions
- `1`: Signature validation failed (SIG_VALIDATION_FAILED)
- `validAfter | validUntil | authorizer`: Time-bound validation

### 2.3 Execution Patterns

#### Simple Execute
```solidity
function execute(address dest, uint256 value, bytes calldata func) external onlyEntryPointOrOwner {
    (bool success, bytes memory result) = dest.call{value: value}(func);
    if (!success) {
        assembly {
            revert(add(result, 32), mload(result))
        }
    }
}
```

#### Batch Execute
```solidity
function executeBatch(
    address[] calldata dest,
    uint256[] calldata value,
    bytes[] calldata func
) external onlyEntryPointOrOwner {
    require(dest.length == value.length && dest.length == func.length, "length mismatch");

    for (uint256 i = 0; i < dest.length; i++) {
        (bool success, bytes memory result) = dest[i].call{value: value[i]}(func[i]);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}
```

### 2.4 Gas Deposit Management

Smart Wallets must deposit ETH to EntryPoint to pay for gas:

```solidity
// Deposit ETH for gas
function addDeposit() public payable {
    entryPoint.depositTo{value: msg.value}(address(this));
}

// Check deposit balance
function getDeposit() public view returns (uint256) {
    return entryPoint.balanceOf(address(this));
}

// Withdraw deposit
function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public onlyOwner {
    entryPoint.withdrawTo(withdrawAddress, amount);
}
```

### 2.5 Receiving Assets

```solidity
// Receive ETH
receive() external payable {}

// Receive ERC721 NFTs
function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
    return this.onERC721Received.selector;
}

// Receive ERC1155 tokens
function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
    return this.onERC1155Received.selector;
}

function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata)
    external pure returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
}
```

---

## 3. Factory Contract Design

### 3.1 CREATE2 Deterministic Deployment

```solidity
function createWallet(address owner, uint256 salt) public returns (SmartWallet) {
    address addr = getAddress(owner, salt);

    // Check if already deployed
    uint256 codeSize = addr.code.length;
    if (codeSize > 0) {
        return SmartWallet(payable(addr));
    }

    // Deploy using CREATE2
    SmartWallet wallet = new SmartWallet{salt: bytes32(salt)}(entryPoint, owner);

    emit WalletCreated(address(wallet), owner, salt);
    return wallet;
}

function getAddress(address owner, uint256 salt) public view returns (address) {
    bytes32 hash = keccak256(
        abi.encodePacked(
            bytes1(0xff),
            address(this),
            bytes32(salt),
            keccak256(abi.encodePacked(
                type(SmartWallet).creationCode,
                abi.encode(entryPoint, owner)
            ))
        )
    );
    return address(uint160(uint256(hash)));
}
```

### 3.2 Registry Pattern (Optional)

```solidity
mapping(address => address) public walletsByOwner; // owner => wallet
mapping(address => bool) public isWallet;           // wallet => true

function createWallet(address owner, uint256 salt) public returns (SmartWallet) {
    // ... CREATE2 deployment ...

    walletsByOwner[owner] = address(wallet);
    isWallet[address(wallet)] = true;

    return wallet;
}

function getWalletByOwner(address owner) external view returns (address) {
    return walletsByOwner[owner];
}
```

### 3.3 Counterfactual Wallets

Users can receive funds BEFORE wallet deployment:

```
1. User signs up → Frontend computes wallet address via getAddress()
2. User receives funds at that address (wallet doesn't exist yet)
3. User's first transaction includes initCode to deploy wallet
4. EntryPoint deploys wallet and executes action in same tx
```

**initCode Format**:
```
initCode = factoryAddress + abi.encodeWithSelector(factory.createWallet.selector, owner, salt)
```

---

## 4. Deposit & Gas Management

### 4.1 Two-Layer Deposit System

```
Layer 1: Smart Wallet Balance (Assets)
  ├─ ETH, USDC, USDT, etc.
  ├─ User's actual funds
  └─ Used for: DeFi deposits, swaps, transfers

Layer 2: EntryPoint Deposit (Gas Funds)
  ├─ ETH only
  ├─ Locked in EntryPoint contract
  ├─ Used for: Paying gas fees
  └─ Separate from Layer 1
```

### 4.2 Funding Smart Wallet (Assets)

**Method 1: Direct Transfer**
```solidity
// User sends ETH/tokens directly to wallet address
// Works even if wallet not deployed yet (counterfactual)

// From MetaMask or CEX
recipient: 0x1234... (Smart Wallet address)
amount: 100 USDC
```

**Method 2: Via Execute**
```solidity
// User initiates transfer via UserOperation
userOp.callData = abi.encodeWithSelector(
    wallet.execute.selector,
    USDC_ADDRESS,
    0,
    abi.encodeWithSelector(IERC20.transfer.selector, recipient, amount)
);
```

### 4.3 Funding EntryPoint Deposit (Gas)

**Method 1: Direct Deposit**
```javascript
// Frontend sends ETH to EntryPoint
const entryPoint = new Contract(ENTRYPOINT_ADDRESS, abi);
await entryPoint.depositTo(smartWalletAddress, {value: ethers.utils.parseEther("0.1")});
```

**Method 2: Via Smart Wallet**
```solidity
// Smart Wallet deposits ETH for gas
smartWallet.addDeposit{value: 0.1 ether}();
```

**Method 3: Auto-deposit on First UserOp**
```solidity
// In validateUserOp, pay missing funds automatically
if (missingAccountFunds > 0) {
    (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
    require(success);
}
```

### 4.4 Gas Payment Flow

```
User submits UserOp
  │
  ├─ EntryPoint calculates required gas
  ├─ preVerificationGas = 21000 + calldata costs
  ├─ verificationGasLimit = gas for validateUserOp
  ├─ callGasLimit = gas for execute
  │
  ├─ requiredPrefund = (maxFeePerGas * (callGasLimit + verificationGasLimit + preVerificationGas))
  │
  └─ EntryPoint calls wallet.validateUserOp(..., requiredPrefund)
      │
      └─ Wallet transfers requiredPrefund to EntryPoint
          │
          └─ EntryPoint executes UserOp
              │
              └─ EntryPoint refunds unused gas to wallet's deposit
```

### 4.5 Monitoring & Refilling Gas

**Check Deposit**:
```javascript
const deposit = await entryPoint.balanceOf(smartWalletAddress);
if (deposit < ethers.utils.parseEther("0.01")) {
    // Top up deposit
    await entryPoint.depositTo(smartWalletAddress, {value: ethers.utils.parseEther("0.05")});
}
```

**Auto Top-up Strategy**:
```javascript
// Monitor deposit level
const MIN_DEPOSIT = parseEther("0.01"); // ~20 transactions
const TARGET_DEPOSIT = parseEther("0.05");

setInterval(async () => {
    const current = await entryPoint.balanceOf(wallet);
    if (current < MIN_DEPOSIT) {
        const topUp = TARGET_DEPOSIT - current;
        await entryPoint.depositTo(wallet, {value: topUp});
    }
}, 60000); // Check every minute
```

---

## 5. Withdraw Logic

### 5.1 Withdraw from DeFi → Smart Wallet

```solidity
// Example: Withdraw from Aave
function withdrawFromAave(address token, uint256 amount) external onlyOwner {
    // This function can ONLY be called via UserOperation (validated by EntryPoint)
    // OR directly by owner (for emergency)

    AAVE_POOL.withdraw(token, amount, address(this)); // Funds go to Smart Wallet
}
```

### 5.2 Withdraw from Smart Wallet → EOA

```solidity
// Transfer assets out of Smart Wallet
function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
    require(to != address(0), "invalid recipient");
    IERC20(token).transfer(to, amount);
}

function withdrawETH(address payable to, uint256 amount) external onlyOwner {
    require(to != address(0), "invalid recipient");
    (bool success,) = to.call{value: amount}("");
    require(success, "transfer failed");
}
```

### 5.3 Withdraw Gas Deposit

```solidity
function withdrawDepositTo(address payable withdrawAddress, uint256 amount) external onlyOwner {
    entryPoint.withdrawTo(withdrawAddress, amount);
}
```

### 5.4 Complete Withdraw Flow (Frontend)

```javascript
// Step 1: Withdraw from Aave to Smart Wallet
const withdrawAaveCalldata = aavePool.interface.encodeFunctionData("withdraw", [
    USDC_ADDRESS,
    parseUnits("100", 6),
    smartWallet.address
]);

const userOp1 = {
    sender: smartWallet.address,
    callData: smartWallet.interface.encodeFunctionData("execute", [
        AAVE_POOL_ADDRESS,
        0,
        withdrawAaveCalldata
    ]),
    // ... other fields
};

await bundler.sendUserOperation(userOp1);

// Step 2: Transfer from Smart Wallet to user's EOA
const transferCalldata = usdc.interface.encodeFunctionData("transfer", [
    userEOA,
    parseUnits("100", 6)
]);

const userOp2 = {
    sender: smartWallet.address,
    callData: smartWallet.interface.encodeFunctionData("execute", [
        USDC_ADDRESS,
        0,
        transferCalldata
    ]),
    // ... other fields
};

await bundler.sendUserOperation(userOp2);

// OR: Batch both operations in single UserOp
const userOpBatch = {
    sender: smartWallet.address,
    callData: smartWallet.interface.encodeFunctionData("executeBatch", [
        [AAVE_POOL_ADDRESS, USDC_ADDRESS],
        [0, 0],
        [withdrawAaveCalldata, transferCalldata]
    ]),
    // ... other fields
};

await bundler.sendUserOperation(userOpBatch);
```

---

## 6. Security Model

### 6.1 Signature Validation Security

**ECDSA Recovery**:
```solidity
function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash) internal view returns (uint256) {
    bytes32 hash = userOpHash.toEthSignedMessageHash();
    address recovered = ECDSA.recover(hash, userOp.signature);

    if (recovered == address(0) || recovered != owner) {
        return SIG_VALIDATION_FAILED;
    }

    return 0;
}
```

**Protection Against**:
- Signature malleability: Use OpenZeppelin ECDSA library
- Replay attacks: Nonce managed by EntryPoint
- Cross-chain replays: userOpHash includes chainId

### 6.2 Nonce Management

EntryPoint tracks nonces per wallet:

```solidity
// EntryPoint internal state
mapping(address => uint256) public nonces;

// Get next nonce
uint256 nonce = entryPoint.getNonce(walletAddress, 0);

// Nonce is incremented after successful validation
// Prevents same UserOp from being executed twice
```

**Sequential Mode** (default):
```
nonce = 0, 1, 2, 3, ... (must be used in order)
```

**Parallel Mode** (advanced):
```
nonce = (key << 64) | sequence
// Different keys allow parallel nonces
```

### 6.3 EntryPoint Authorization

```solidity
modifier onlyEntryPoint() {
    require(msg.sender == address(entryPoint), "only EntryPoint");
    _;
}

modifier onlyEntryPointOrOwner() {
    require(
        msg.sender == address(entryPoint) || msg.sender == owner,
        "unauthorized"
    );
    _;
}
```

**Critical**: `validateUserOp` MUST ONLY be callable by EntryPoint, otherwise anyone can bypass validation.

### 6.4 Reentrancy Protection

```solidity
// Use OpenZeppelin ReentrancyGuard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SmartWallet is ReentrancyGuard {
    function execute(...) external onlyEntryPointOrOwner nonReentrant {
        // Safe from reentrancy
    }
}
```

**Why?** External calls in `execute()` could re-enter wallet.

### 6.5 Gas Griefing Protection

**Problem**: Malicious UserOps could waste bundler gas.

**Mitigation**:
- Bundlers simulate UserOps before including
- EntryPoint enforces gas limits
- Reputation system for wallets/factories
- Staking requirements for factories

---

## 7. Future Improvements

### 7.1 Paymaster Integration

```solidity
// Gasless transactions - app pays gas
contract AppPaymaster is BasePaymaster {
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view returns (bytes memory context, uint256 validationData) {
        // Check if user is allowed (whitelist, rate limit, etc.)
        require(isUserAllowed(userOp.sender), "not allowed");

        // Return validation success
        return ("", 0);
    }

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external override {
        // Called after UserOp execution
        // Can charge user in ERC20, update quotas, etc.
    }
}
```

**Use Cases**:
- Sponsor gas for new users
- Accept gas payment in USDC
- Subsidize specific actions (e.g., first 5 deposits free)

### 7.2 Batch Transactions

Already supported via `executeBatch`:

```javascript
// Build multiple Yield Farms in one UserOp
const userOp = {
    callData: wallet.interface.encodeFunctionData("executeBatch", [
        [aavePool, aavePool, aavePool],
        [0, 0, 0],
        [depositCall1, depositCall2, depositCall3]
    ])
};
```

### 7.3 Session Keys

Allow temporary keys with limited permissions:

```solidity
struct SessionKey {
    address key;
    uint48 validUntil;
    uint48 validAfter;
    address[] whitelist; // Allowed contracts
    uint256 spendLimit;  // Daily limit
}

mapping(address => SessionKey) public sessionKeys;

function validateUserOp(...) external override returns (uint256) {
    address signer = recoverSigner(userOp);

    // Check if owner
    if (signer == owner) return 0;

    // Check if valid session key
    SessionKey memory session = sessionKeys[signer];
    if (session.validUntil > block.timestamp && session.validAfter < block.timestamp) {
        // Validate session constraints
        require(isWithinLimits(userOp, session), "session limit exceeded");
        return 0;
    }

    return SIG_VALIDATION_FAILED;
}
```

**Benefits**:
- Mobile app can store session key (not main key)
- Limited damage if compromised
- No need to sign every action

### 7.4 Multi-Signature Wallets

```solidity
address[] public owners;
uint256 public threshold; // Required signatures

function validateUserOp(...) external override returns (uint256) {
    bytes[] memory signatures = splitSignatures(userOp.signature);
    require(signatures.length >= threshold, "insufficient sigs");

    uint256 validSigs = 0;
    for (uint256 i = 0; i < signatures.length; i++) {
        address signer = recoverSigner(userOpHash, signatures[i]);
        if (isOwner(signer)) {
            validSigs++;
        }
    }

    require(validSigs >= threshold, "not enough valid sigs");
    return 0;
}
```

### 7.5 Social Recovery

```solidity
address[] public guardians;
uint256 public recoveryThreshold;

function initiateRecovery(address newOwner, bytes[] calldata guardianSignatures) external {
    require(guardianSignatures.length >= recoveryThreshold, "insufficient guardians");

    // Verify guardian signatures
    for (uint256 i = 0; i < guardianSignatures.length; i++) {
        address guardian = recoverSigner(keccak256(abi.encode(newOwner)), guardianSignatures[i]);
        require(isGuardian(guardian), "invalid guardian");
    }

    // Set new owner after timelock
    pendingOwner = newOwner;
    recoveryInitiatedAt = block.timestamp;
}

function finalizeRecovery() external {
    require(block.timestamp >= recoveryInitiatedAt + TIMELOCK, "timelock");
    owner = pendingOwner;
}
```

### 7.6 Spending Limits

```solidity
struct SpendingLimit {
    uint256 dailyLimit;
    uint256 spentToday;
    uint256 lastReset;
}

mapping(address => SpendingLimit) public limits; // token => limit

function execute(address dest, uint256 value, bytes calldata func) external override {
    // Check spending limit before execution
    if (dest == USDC_ADDRESS) {
        SpendingLimit storage limit = limits[USDC_ADDRESS];

        // Reset if new day
        if (block.timestamp > limit.lastReset + 1 days) {
            limit.spentToday = 0;
            limit.lastReset = block.timestamp;
        }

        // Extract amount from calldata
        uint256 amount = extractAmount(func);
        require(limit.spentToday + amount <= limit.dailyLimit, "daily limit exceeded");

        limit.spentToday += amount;
    }

    _execute(dest, value, func);
}
```

### 7.7 ERC-1271 Signature Validation

Allow Smart Wallet to sign messages:

```solidity
// ERC-1271: Standard Signature Validation Method for Contracts
function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4) {
    address signer = ECDSA.recover(hash, signature);

    if (signer == owner) {
        return 0x1626ba7e; // ERC-1271 magic value
    }

    return 0xffffffff; // Invalid
}
```

**Use Case**: DApps can verify that a message was signed by Smart Wallet owner.

### 7.8 Upgradeability

**Pattern 1: Modular Plugins** (Recommended)
```solidity
// Base wallet is immutable
// Functionality added via modules
contract SmartWallet {
    mapping(address => bool) public modules;

    function addModule(address module) external onlyOwner {
        modules[module] = true;
    }

    function executeFromModule(address dest, uint256 value, bytes calldata func) external {
        require(modules[msg.sender], "invalid module");
        _execute(dest, value, func);
    }
}
```

**Pattern 2: Proxy** (More Complex)
```solidity
// Use EIP-1967 proxy pattern
// Implementation can be upgraded
// BUT: Requires careful state management
```

---

## 8. Deployment Checklist

- [ ] Deploy EntryPoint (or use existing canonical address)
- [ ] Deploy SmartWallet implementation (for CREATE2 bytecode hash)
- [ ] Deploy WalletFactory with EntryPoint address
- [ ] Verify all contracts on block explorer
- [ ] Set up bundler infrastructure
- [ ] Fund bundler wallet for gas
- [ ] Implement frontend UserOp construction
- [ ] Test on testnet thoroughly
- [ ] Security audit
- [ ] Mainnet deployment

---

## 9. Testing Strategy

### Unit Tests
```javascript
describe("SmartWallet", () => {
    it("should validate correct signature", async () => {
        const userOp = await createUserOp();
        const userOpHash = await entryPoint.getUserOpHash(userOp);
        const signature = await owner.signMessage(arrayify(userOpHash));

        userOp.signature = signature;

        const validationData = await wallet.validateUserOp(userOp, userOpHash, 0);
        expect(validationData).to.equal(0);
    });

    it("should reject invalid signature", async () => {
        // Test with wrong signer
    });

    it("should execute call successfully", async () => {
        // Test execute function
    });
});
```

### Integration Tests
```javascript
it("should deposit to Aave via UserOperation", async () => {
    // 1. Construct UserOp
    // 2. Sign UserOp
    // 3. Submit to bundler
    // 4. Wait for tx confirmation
    // 5. Verify aUSDC balance increased
});
```

### E2E Tests
- Full user journey: wallet creation → deposit → DeFi interaction → withdraw
- Multi-chain testing
- Gas estimation accuracy
- Failure scenarios

---

## 10. Gas Optimization Tips

1. **Use `calldata` instead of `memory` for external function parameters**
2. **Pack structs efficiently** (use uint48 for timestamps instead of uint256)
3. **Batch operations** whenever possible
4. **Avoid unnecessary storage reads/writes**
5. **Use immutable variables** for addresses set in constructor
6. **Optimize signature validation** (use assembly if needed)
7. **Minimal initCode** for counterfactual wallets

---

## 11. Resources

- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [EntryPoint Canonical Address](https://github.com/eth-infinitism/account-abstraction/blob/develop/deployed-addresses.txt)
- [Infinitism SDK](https://github.com/eth-infinitism/account-abstraction)
- [Alchemy Account Kit](https://www.alchemy.com/account-kit)
- [Biconomy SDK](https://www.biconomy.io/)
- [Stackup Bundler](https://www.stackup.sh/)

---

*This architecture document is designed for production-grade ERC-4337 implementation. All code examples are illustrative - actual implementation should include comprehensive error handling, events, and testing.*
