# 🔍 DeFi City - Security Audit Report

**Date**: 2026-01-14
**Auditor**: Claude Code
**Scope**: Smart Contracts + Frontend

---

## 📋 Executive Summary

This audit covers 4 smart contracts and the Next.js frontend application. Overall code quality is **good** with proper use of modern patterns, but several **medium-severity security issues** and best practice violations were identified.

### Risk Summary
- 🔴 **Critical**: 0 issues
- 🟠 **High**: 2 issues
- 🟡 **Medium**: 6 issues
- 🔵 **Low**: 8 issues
- ℹ️ **Informational**: 5 issues

---

## 🔐 Smart Contract Findings

### 1. SimpleSmartWallet.sol

#### 🟠 HIGH-01: Missing Reentrancy Protection
**Location**: `withdrawETH` (line 95-103), `withdrawToken` (line 120-133)
**Severity**: High
**Description**: No reentrancy guard on withdrawal functions. While the code follows checks-effects-interactions pattern, malicious tokens or contracts could potentially exploit this.

**Recommendation**:
```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleSmartWallet is ReentrancyGuard {
    function withdrawETH(address payable to, uint256 amount)
        public onlyOwner nonReentrant { // Add nonReentrant
        // ...
    }
}
```

#### 🟡 MEDIUM-01: Unsafe ERC20 Token Handling
**Location**: `depositToken` (line 68-86), `withdrawToken` (line 120-133)
**Severity**: Medium
**Description**: Uses low-level `call` for ERC20 transfers without SafeERC20. Some tokens (USDT, BNB) don't return bool, causing transfers to fail.

**Recommendation**:
```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;

function depositToken(address token, uint256 amount) external {
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    emit Deposited(token, amount, msg.sender);
}
```

#### 🔵 LOW-01: Silent Failure in Balance Check
**Location**: `getTokenBalance` (line 160-170)
**Severity**: Low
**Description**: Returns 0 on failure instead of reverting, masking potential errors.

**Recommendation**: Consider reverting on failure or documenting this behavior clearly.

---

### 2. SimpleWalletFactory.sol

#### 🔵 LOW-02: Code Duplication
**Location**: `getOrCreateWallet` (line 91-106)
**Severity**: Low
**Description**: Duplicates wallet creation logic from `createWallet`.

**Recommendation**:
```solidity
function getOrCreateWallet(address owner) external returns (address wallet) {
    wallet = wallets[owner];
    if (wallet == address(0)) {
        return this.createWallet(owner); // Reuse existing function
    }
    return wallet;
}
```

#### ℹ️ INFO-01: No Access Control
**Location**: Contract level
**Severity**: Informational
**Description**: Anyone can create wallets for any owner. This is by design but should be documented.

---

### 3. SmartWallet.sol (ERC-4337)

#### 🟡 MEDIUM-02: Single-Step Ownership Transfer
**Location**: `transferOwnership` (line 307-314)
**Severity**: Medium
**Description**: Ownership can be transferred in one transaction. If wrong address is used, wallet is permanently locked.

**Recommendation**:
```solidity
// Implement Ownable2Step pattern
address public pendingOwner;

function transferOwnership(address newOwner) external onlyOwner {
    pendingOwner = newOwner;
    emit OwnershipTransferStarted(owner, newOwner);
}

function acceptOwnership() external {
    require(msg.sender == pendingOwner, "Not pending owner");
    address oldOwner = owner;
    owner = pendingOwner;
    pendingOwner = address(0);
    emit OwnershipTransferred(oldOwner, owner);
}
```

#### 🔵 LOW-03: Unchecked External Call in validateUserOp
**Location**: `validateUserOp` (line 147-164), specifically line 158
**Severity**: Low
**Description**: The gas payment to EntryPoint uses unchecked call. While this is standard in ERC-4337, consider adding more detailed error handling.

**Current**:
```solidity
(bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
if (!success) revert PaymentFailed();
```

**Recommendation**: Add more context to error:
```solidity
if (!success) revert PaymentFailed("Failed to pay EntryPoint");
```

#### 🔵 LOW-04: Gas Optimization
**Location**: Multiple locations reading `owner`
**Severity**: Low (Gas)
**Description**: Multiple SLOAD operations for `owner` state variable.

**Recommendation**: Cache `owner` in memory for functions that read it multiple times.

#### ✅ **POSITIVE**: Excellent use of ReentrancyGuard, OpenZeppelin ECDSA, and proper ERC-4337 implementation.

---

### 4. WalletFactory.sol

#### 🟡 MEDIUM-03: Inconsistent Error Handling
**Location**: `createWalletsBatch` (line 238-251), line 242
**Severity**: Medium
**Description**: Uses `require` instead of custom errors, inconsistent with rest of codebase.

**Recommendation**:
```solidity
error ArrayLengthMismatch();

function createWalletsBatch(...) external returns (...) {
    if (owners.length != salts.length) revert ArrayLengthMismatch();
    // ...
}
```

#### 🔵 LOW-05: No Access Control on Factory
**Location**: Contract level
**Severity**: Low
**Description**: Anyone can deploy wallets. Consider if you want to restrict this.

**Recommendation**: If wallets should only be created by authorized parties:
```solidity
address public deployer;

modifier onlyDeployer() {
    if (msg.sender != deployer) revert Unauthorized();
    _;
}

function createWallet(...) external onlyDeployer returns (...) { ... }
```

#### ℹ️ INFO-02: Batch Functions Fail Atomically
**Location**: `createWalletsBatch`, `getAddressesBatch`
**Severity**: Informational
**Description**: If one operation fails, entire batch reverts. Document this behavior.

---

## 🌐 Frontend Findings

### 5. Frontend Security & Best Practices

#### 🟠 HIGH-02: Hardcoded Contract Address
**Location**: `frontend/src/lib/constants.ts:3`
**Severity**: High
**Description**: Factory address has hardcoded fallback. If `.env.local` is missing, uses Sepolia testnet address by default.

```typescript
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`
  || '0x0899fDF0Dfe72751925901e72DB41A0aDB18be47' // ⚠️ Dangerous fallback
```

**Risk**: Could accidentally use testnet contract on mainnet or wrong network.

**Recommendation**:
```typescript
export const FACTORY_ADDRESS = (() => {
  const addr = process.env.NEXT_PUBLIC_FACTORY_ADDRESS
  if (!addr) {
    throw new Error('NEXT_PUBLIC_FACTORY_ADDRESS not configured')
  }
  return addr as `0x${string}`
})()
```

#### 🟡 MEDIUM-04: No Address Validation in Withdraw
**Location**: `frontend/src/hooks/useWithdraw.ts:42-74`
**Severity**: Medium
**Description**: No validation on recipient address. Users could send funds to invalid addresses.

**Recommendation**:
```typescript
import { isAddress } from 'viem'

const withdraw = (amount: string, recipient: `0x${string}`) => {
  if (!smartWalletAddress) {
    toast.error('No Smart Wallet found')
    return
  }

  // Add address validation
  if (!isAddress(recipient)) {
    toast.error('Invalid recipient address')
    return
  }

  if (recipient === '0x0000000000000000000000000000000000000000') {
    toast.error('Cannot send to zero address')
    return
  }

  const value = parseEther(amount)
  if (value <= 0n) {
    toast.error('Invalid amount')
    return
  }

  writeContract({ /* ... */ })
}
```

#### 🟡 MEDIUM-05: Missing Input Validation
**Location**: `frontend/src/hooks/useDeposit.ts:41-57`
**Severity**: Medium
**Description**: No maximum amount check. Users could accidentally input huge amounts.

**Recommendation**:
```typescript
const deposit = (amount: string) => {
  // ... existing checks ...

  // Add reasonable maximum (e.g., 1000 ETH)
  const MAX_DEPOSIT = parseEther('1000')
  if (value > MAX_DEPOSIT) {
    toast.error('Amount too large', {
      description: 'Please deposit less than 1000 ETH at a time'
    })
    return
  }

  sendTransaction({ to: smartWalletAddress, value })
}
```

#### 🔵 LOW-06: Missing Error Boundaries
**Location**: Frontend app
**Severity**: Low
**Description**: No React error boundaries to catch rendering errors gracefully.

**Recommendation**: Add error boundary component:
```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

#### 🔵 LOW-07: Frontend Not Using ERC-4337 Wallet
**Location**: All frontend hooks
**Severity**: Low
**Description**: Frontend only integrates with `SimpleSmartWallet`, not the production-ready `SmartWallet` (ERC-4337).

**Recommendation**:
- Decide which wallet version to use (SimpleSmartWallet for MVP, SmartWallet for production)
- Update ABIs and hooks to use SmartWallet if ERC-4337 features are needed
- Document which version is being used

#### 🔵 LOW-08: No Transaction Confirmation Dialog
**Location**: Withdraw and deposit flows
**Severity**: Low
**Description**: No confirmation dialog before executing transactions.

**Recommendation**:
```typescript
// Add confirmation dialog before withdraw
const confirmWithdraw = async (amount: string, recipient: string) => {
  const confirmed = window.confirm(
    `Withdraw ${amount} ETH to ${recipient}?\n\nThis action cannot be undone.`
  )
  if (confirmed) {
    withdraw(amount, recipient)
  }
}
```

#### ℹ️ INFO-03: Missing Loading States
**Location**: Various components
**Severity**: Informational
**Description**: Some components could benefit from better loading indicators.

#### ℹ️ INFO-04: No Transaction History
**Location**: Frontend
**Severity**: Informational
**Description**: No UI to view past transactions or wallet history.

**Recommendation**: Add transaction history using wagmi's transaction receipt hooks or external indexer.

#### ℹ️ INFO-05: Environment Variables Not Validated
**Location**: `frontend/src/lib/constants.ts`
**Severity**: Informational
**Description**: Only PRIVY_APP_ID is validated in UI, other env vars fail silently.

---

## 🎯 Summary of Recommendations

### Immediate Actions (High Priority)
1. ✅ Add ReentrancyGuard to SimpleSmartWallet withdrawal functions
2. ✅ Remove hardcoded contract address fallback in frontend
3. ✅ Add address validation in withdrawal flow
4. ✅ Implement two-step ownership transfer in SmartWallet

### Short Term (Medium Priority)
5. ✅ Use SafeERC20 for token operations
6. ✅ Add input validation (max amounts, address checks)
7. ✅ Standardize error handling (custom errors everywhere)
8. ✅ Add error boundaries to frontend

### Long Term (Low Priority)
9. ✅ Add transaction confirmation dialogs
10. ✅ Implement transaction history UI
11. ✅ Decide on SimpleSmartWallet vs SmartWallet for production
12. ✅ Gas optimizations (cache storage reads)
13. ✅ Add access control to factory if needed

---

## 📊 Code Quality Assessment

| Category | Rating | Notes |
|----------|--------|-------|
| **Architecture** | ⭐⭐⭐⭐ | Well-structured, follows ERC-4337 standard |
| **Security** | ⭐⭐⭐ | Good but needs reentrancy guards |
| **Gas Efficiency** | ⭐⭐⭐⭐ | Uses custom errors, efficient patterns |
| **Code Clarity** | ⭐⭐⭐⭐⭐ | Excellent documentation and comments |
| **Testing** | ⚠️ Not audited | Test files not reviewed in this audit |
| **Frontend Quality** | ⭐⭐⭐⭐ | Modern stack, proper hooks usage |

---

## ✅ Positive Findings

### Smart Contracts
- ✅ Excellent NatSpec documentation
- ✅ Proper use of custom errors (gas efficient)
- ✅ ERC-4337 compliance in SmartWallet
- ✅ CREATE2 implementation for deterministic addresses
- ✅ Event emission for all important actions
- ✅ Good access control patterns

### Frontend
- ✅ Uses recommended stack (Next.js 14, wagmi v2, viem v2, Privy)
- ✅ Proper React hooks patterns
- ✅ TypeScript throughout
- ✅ Good user feedback with toast notifications
- ✅ Proper provider structure

---

## 📝 Testing Recommendations

Not covered in this audit, but recommended:
1. Unit tests for all smart contract functions
2. Integration tests for factory + wallet interaction
3. Fuzz testing for ERC-4337 signature validation
4. Frontend E2E tests (Playwright/Cypress)
5. Gas profiling and optimization
6. Testnet deployment and user testing

---

## 🔗 References

- [ERC-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Consensys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [SWC Registry](https://swcregistry.io/)

---

## 📞 Next Steps

1. Review and prioritize findings
2. Implement high-priority fixes
3. Add comprehensive test suite
4. Consider professional security audit before mainnet
5. Set up monitoring and alerts for deployed contracts
6. Document deployment procedures and emergency response

---

**Disclaimer**: This audit does not guarantee the absence of vulnerabilities. A professional security audit is recommended before mainnet deployment.
