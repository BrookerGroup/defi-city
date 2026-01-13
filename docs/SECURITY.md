# Security Considerations for ERC-4337 Smart Wallet

## Critical Security Requirements

### 1. EntryPoint Authorization

**CRITICAL**: The `validateUserOp` function MUST ONLY be callable by the EntryPoint.

```solidity
function validateUserOp(...) external override returns (uint256) {
    require(msg.sender == address(entryPoint), "only EntryPoint");
    // ...
}
```

**Why?** If anyone can call `validateUserOp`, they can bypass signature validation and execute arbitrary operations.

**Attack Scenario Without Protection**:
```
Attacker calls validateUserOp() directly
  → Wallet doesn't check msg.sender
  → Validation passes (attacker controls the parameters)
  → Attacker gains full control of wallet
```

**Mitigation**: Use `onlyEntryPoint` modifier on `validateUserOp`.

---

### 2. Signature Validation

#### 2.1 ECDSA Security

**Use OpenZeppelin's ECDSA library** - it handles edge cases:
- Signature malleability (s-value normalization)
- Invalid signature formats
- Zero address recovery

```solidity
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

bytes32 hash = userOpHash.toEthSignedMessageHash();
address signer = hash.recover(userOp.signature);
```

**Common Vulnerabilities**:

❌ **Wrong**: Manual signature recovery
```solidity
// DON'T DO THIS - vulnerable to malleability
(uint8 v, bytes32 r, bytes32 s) = splitSignature(signature);
address signer = ecrecover(hash, v, r, s);
```

✅ **Correct**: Use ECDSA library
```solidity
address signer = ECDSA.recover(hash, signature);
```

#### 2.2 Signature Replay Protection

**Nonce Management**: EntryPoint handles nonces automatically.

```
EntryPoint tracks: mapping(address => uint256) nonces;

On validation:
  1. Check nonce matches expected value
  2. Execute operation
  3. Increment nonce

Result: Same UserOp cannot be executed twice
```

**Multi-chain Protection**: `userOpHash` includes `chainId` to prevent cross-chain replays.

```solidity
// EntryPoint computes:
bytes32 userOpHash = keccak256(abi.encode(
    hash(userOp),
    address(this), // EntryPoint address
    block.chainid
));
```

**Best Practice**: Always use `EntryPoint.getUserOpHash()` to get the correct hash to sign.

#### 2.3 EIP-191 / EIP-712 Formatting

**Always use Ethereum Signed Message format**:
```solidity
bytes32 hash = userOpHash.toEthSignedMessageHash();
// Adds prefix: "\x19Ethereum Signed Message:\n32"
```

**Why?** Prevents signature reuse across different contexts (prevents signing a raw tx by accident).

---

### 3. Reentrancy Protection

**All state-changing functions must be protected against reentrancy**.

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SmartWallet is ReentrancyGuard {
    function execute(address dest, uint256 value, bytes calldata func)
        external
        onlyEntryPointOrOwner
        nonReentrant  // ← CRITICAL
    {
        _call(dest, value, func);
    }
}
```

**Attack Scenario**:
```
1. User calls execute(maliciousContract, 0, data)
2. maliciousContract receives call
3. maliciousContract calls back into wallet.execute()
4. Without reentrancy guard: second call executes before first completes
5. Can drain funds, manipulate state, etc.
```

**Protection**: OpenZeppelin's `nonReentrant` modifier sets a lock before execution and clears it after.

---

### 4. Gas Griefing Protection

**Problem**: Malicious UserOps could waste bundler's gas without paying.

#### 4.1 Validation Gas Limits

```solidity
// UserOp specifies gas limits
userOp.verificationGasLimit = 100000;  // Gas for validation
userOp.callGasLimit = 200000;          // Gas for execution
```

**EntryPoint enforces these limits**:
- Validation phase has limited gas
- If validation uses more gas than limit, it reverts
- Bundler is protected from gas griefing

#### 4.2 Required Pre-funding

```solidity
function validateUserOp(..., uint256 missingAccountFunds) external {
    // Wallet MUST pay upfront for gas
    if (missingAccountFunds > 0) {
        (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
        require(success, "payment failed");
    }
}
```

**Protection**: Wallet pays for gas BEFORE execution. If validation fails, wallet still pays.

#### 4.3 Simulation Before Submission

**Bundlers MUST simulate UserOps before including**:
```javascript
// Bundler simulates UserOp
const simulationResult = await entryPoint.simulateValidation(userOp);

if (simulationResult.success) {
    // Include in bundle
} else {
    // Reject UserOp
}
```

---

### 5. Payment Security

#### 5.1 Deposit vs Wallet Balance

**Two separate balances**:

```
┌─────────────────────────────────┐
│  Smart Wallet                   │
│                                 │
│  Balance: 10 ETH, 1000 USDC    │ ← User's actual funds
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  EntryPoint                     │
│                                 │
│  Deposits[wallet]: 0.5 ETH     │ ← Gas-only funds
│                                 │
└─────────────────────────────────┘
```

**Security Principle**: Keep gas funds separate from user funds.

**Why?**
- Gas funds are locked in EntryPoint (safer)
- User funds remain in wallet (available for DeFi)
- Clear separation of concerns

#### 5.2 Withdrawal Security

```solidity
function withdrawDepositTo(address payable withdrawAddress, uint256 amount)
    public
    onlyOwner  // ← CRITICAL
{
    entryPoint.withdrawTo(withdrawAddress, amount);
}
```

**Attack Vector**: Without `onlyOwner`, anyone could withdraw the gas deposit.

#### 5.3 Payment Failure Handling

```solidity
if (missingAccountFunds > 0) {
    (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
    require(success, "payment failed");  // ← CRITICAL
}
```

**Must revert if payment fails** - otherwise validation succeeds without payment.

---

### 6. Access Control

#### 6.1 Owner-based Security

```solidity
address public owner;

modifier onlyOwner() {
    require(msg.sender == owner, "only owner");
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

**Function Authorization Matrix**:

| Function | EntryPoint | Owner | Anyone |
|----------|------------|-------|--------|
| validateUserOp | ✅ | ❌ | ❌ |
| execute | ✅ | ✅ | ❌ |
| executeBatch | ✅ | ✅ | ❌ |
| addDeposit | ✅ | ✅ | ✅ |
| withdrawDepositTo | ❌ | ✅ | ❌ |
| transferOwnership | ❌ | ✅ | ❌ |

#### 6.2 Ownership Transfer Security

**Current Implementation**:
```solidity
function transferOwnership(address newOwner) external onlyOwner {
    owner = newOwner;
}
```

**Production Recommendation**: Use two-step transfer
```solidity
address public pendingOwner;

function transferOwnership(address newOwner) external onlyOwner {
    pendingOwner = newOwner;
}

function acceptOwnership() external {
    require(msg.sender == pendingOwner, "not pending owner");
    owner = pendingOwner;
    pendingOwner = address(0);
}
```

**Prevents**: Accidental transfer to wrong address (no way to recover).

---

### 7. Factory Security

#### 7.1 CREATE2 Address Prediction

**Security Consideration**: Anyone can compute wallet addresses.

```solidity
address walletAddr = factory.getAddress(owner, salt);
// Anyone can call this function
```

**Implications**:
- ✅ Good: Users can receive funds before deployment
- ⚠️ Risk: Attackers can frontrun deployment with different parameters

**Mitigation**: Factory checks if wallet exists before deploying
```solidity
uint256 codeSize = walletAddress.code.length;
if (codeSize > 0) {
    return SmartWallet(payable(walletAddress));
}
```

#### 7.2 Initialization Security

**Problem**: Constructor parameters are public (in creation bytecode).

```solidity
constructor(IEntryPoint _entryPoint, address _owner) {
    entryPoint = _entryPoint;
    owner = _owner;
}
```

**Safe**: Owner is set in constructor, not in separate `initialize()` call.

**Unsafe Pattern** (don't use):
```solidity
// DON'T DO THIS
function initialize(address _owner) external {
    require(owner == address(0), "already initialized");
    owner = _owner;
}
```

**Why unsafe?** Can be front-run - attacker can call `initialize()` before legitimate owner.

---

### 8. External Call Security

#### 8.1 Call Execution

```solidity
function _call(address dest, uint256 value, bytes memory func) internal {
    (bool success, bytes memory result) = dest.call{value: value}(func);

    if (!success) {
        // IMPORTANT: Bubble up revert reason
        if (result.length > 0) {
            assembly {
                revert(add(32, result), mload(result))
            }
        }
        revert("Call failed");
    }
}
```

**Security Points**:
1. Always check `success` status
2. Bubble up revert reasons for debugging
3. Use `nonReentrant` to prevent reentrancy
4. Validate dest address if needed

#### 8.2 Delegate Call Risks

**DON'T use delegatecall unless absolutely necessary**:
```solidity
// DANGEROUS - delegatecall executes in wallet's context
(bool success,) = dest.delegatecall(func);
```

**Why dangerous?**
- Can modify wallet's storage
- Can change owner
- Can drain all funds

**If needed**: Strict whitelist of allowed targets + careful storage layout.

---

### 9. Token Security

#### 9.1 ERC20 Transfer Security

**Problem**: Some tokens don't return boolean (USDT, BNB).

```solidity
// Unsafe
token.transfer(to, amount);

// Safe
(bool success, bytes memory result) = token.call(
    abi.encodeWithSignature("transfer(address,uint256)", to, amount)
);
require(success && (result.length == 0 || abi.decode(result, (bool))));
```

**Better**: Use OpenZeppelin's SafeERC20.

#### 9.2 NFT Reception

**Must implement IERC721Receiver and IERC1155Receiver**:
```solidity
function onERC721Received(...) external pure returns (bytes4) {
    return this.onERC721Received.selector;
}
```

**Without this**: safeTransferFrom will revert when sending NFTs to wallet.

---

### 10. Common Attack Vectors

#### 10.1 Signature Malleability

**Problem**: ECDSA signatures have two valid forms (s and -s mod n).

**Mitigation**: OpenZeppelin ECDSA library normalizes signatures.

#### 10.2 Nonce Manipulation

**Problem**: User tries to submit same UserOp twice.

**Mitigation**: EntryPoint manages nonces, prevents replay.

#### 10.3 Cross-chain Replay

**Problem**: UserOp valid on chain A might be replayed on chain B.

**Mitigation**: `userOpHash` includes `chainId` and EntryPoint address.

#### 10.4 Gas Griefing

**Problem**: Malicious UserOps waste bundler's gas.

**Mitigation**:
- Bundler simulates before submission
- UserOp pays upfront
- Gas limits enforced

#### 10.5 Phishing (Blind Signing)

**Problem**: User signs malicious UserOp without understanding it.

**Mitigation** (Frontend):
- Show human-readable transaction details
- Decode calldata to show actual operation
- Warn about risky operations
- Use EIP-712 structured data signing

#### 10.6 Front-running

**Problem**: Attacker sees UserOp in mempool and front-runs it.

**Mitigation**:
- Use private mempool (Flashbots)
- Add slippage protection in calldata
- Use deadline parameters

---

### 11. Testing Security

#### 11.1 Test Cases Required

```javascript
describe("Security Tests", () => {
    it("should reject validateUserOp from non-EntryPoint", async () => {
        await expect(
            wallet.validateUserOp(userOp, hash, 0)
        ).to.be.revertedWith("only EntryPoint");
    });

    it("should reject invalid signature", async () => {
        const wrongSigner = ethers.Wallet.createRandom();
        userOp.signature = await wrongSigner.signMessage(hash);

        const result = await wallet.validateUserOp(userOp, hash, 0);
        expect(result).to.equal(1); // SIG_VALIDATION_FAILED
    });

    it("should prevent reentrancy attack", async () => {
        // Deploy malicious contract that re-enters
        const malicious = await MaliciousReentrant.deploy(wallet.address);

        await expect(
            wallet.execute(malicious.address, 0, attackCalldata)
        ).to.be.revertedWith("ReentrancyGuard");
    });

    it("should prevent unauthorized withdrawal", async () => {
        await expect(
            wallet.connect(attacker).withdrawDepositTo(attacker.address, 1000)
        ).to.be.revertedWith("only owner");
    });
});
```

#### 11.2 Fuzzing

**Use Echidna or Foundry for fuzzing**:
```solidity
contract SmartWalletInvariantTest is Test {
    function invariant_onlyOwnerCanTransferOwnership() public {
        // Owner should never change unless transferOwnership called by owner
    }

    function invariant_entryPointNeverChanges() public {
        // EntryPoint address should be immutable
    }

    function invariant_depositNeverNegative() public {
        // Deposit balance should never be negative
    }
}
```

---

### 12. Audit Checklist

Before deploying to mainnet:

- [ ] EntryPoint address is correct for target chain
- [ ] validateUserOp only callable by EntryPoint
- [ ] Signature validation uses ECDSA library
- [ ] All external calls have reentrancy protection
- [ ] Gas payment failure causes revert
- [ ] Owner checks on sensitive functions
- [ ] Factory uses correct CREATE2 formula
- [ ] No delegatecall (or strict whitelist)
- [ ] Token transfer safety (SafeERC20)
- [ ] NFT reception interfaces implemented
- [ ] Ownership transfer is two-step (recommended)
- [ ] Emergency functions have timelock (recommended)
- [ ] All events emitted correctly
- [ ] No floating pragma (use fixed version)
- [ ] External audit completed
- [ ] Testnet testing completed
- [ ] Gas optimization reviewed

---

### 13. Production Recommendations

#### 13.1 Multi-sig for Admin Functions

```solidity
// Use Gnosis Safe or similar for:
- Factory ownership
- Paymaster configuration
- Emergency pause functions
```

#### 13.2 Timelock for Critical Changes

```solidity
// Add 48h timelock for:
- EntryPoint upgrade (if using proxy)
- Factory parameter changes
- Paymaster policy updates
```

#### 13.3 Emergency Pause

```solidity
bool public paused;

modifier whenNotPaused() {
    require(!paused, "paused");
    _;
}

function pause() external onlyOwner {
    paused = true;
}
```

#### 13.4 Rate Limiting

```solidity
mapping(address => uint256) public lastWithdraw;
uint256 public constant WITHDRAW_COOLDOWN = 1 hours;

function withdraw(...) external onlyOwner {
    require(block.timestamp >= lastWithdraw[msg.sender] + WITHDRAW_COOLDOWN);
    lastWithdraw[msg.sender] = block.timestamp;
    // ... withdraw logic
}
```

---

### 14. Incident Response Plan

#### If vulnerability discovered:

1. **Immediately pause deployments** (if possible)
2. **Notify users** to stop using affected wallets
3. **Contact bundlers** to stop processing UserOps
4. **Deploy fix** to testnet and verify
5. **Audit fix** before mainnet deployment
6. **Coordinate upgrade** (if using upgradeable pattern)
7. **Post-mortem** and update documentation

#### Communication channels:

- Twitter/X for public announcement
- Discord/Telegram for community
- Email for affected users
- Bug bounty platform (Immunefi, HackerOne)

---

### 15. Bug Bounty Program

**Recommended for production deployments**:

- Critical: $50k - $100k (full wallet compromise)
- High: $10k - $50k (limited fund loss)
- Medium: $1k - $10k (DoS, griefing)
- Low: $100 - $1k (information disclosure)

**Platforms**:
- Immunefi
- HackerOne
- Code4rena (audit contest)

---

## Summary: Top 5 Security Rules

1. ✅ **ALWAYS** require `msg.sender == entryPoint` in `validateUserOp`
2. ✅ **ALWAYS** use OpenZeppelin ECDSA for signature verification
3. ✅ **ALWAYS** use `nonReentrant` on execute functions
4. ✅ **ALWAYS** check success on external calls
5. ✅ **ALWAYS** audit before mainnet deployment

---

*Security is a continuous process. Stay updated with ERC-4337 developments and security best practices.*
