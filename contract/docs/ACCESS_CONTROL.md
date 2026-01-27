# Access Control Documentation

This document describes the role-based access control (RBAC) implementation in DeFi City contracts.

## Overview

Both `DefiCityCore` and `WalletFactory` use OpenZeppelin's `AccessControl` for granular permission management. This provides:
- Role-based access control for sensitive operations
- Ability to delegate specific permissions without full ownership
- Secure multi-administrator setup
- Fine-grained permission management

## DefiCityCore Roles

### DEFAULT_ADMIN_ROLE
- **Hash**: `0x00` (predefined by OpenZeppelin)
- **Holder**: Contract deployer (initially)
- **Permissions**:
  - Can grant and revoke all roles
  - Can manage role assignments
  - Critical for security - protect this role carefully

### PAUSER_ROLE
- **Hash**: `keccak256("PAUSER_ROLE")`
- **Holder**: Contract deployer (initially)
- **Permissions**:
  - `pause()` - Pause the contract in emergencies
  - `unpause()` - Resume normal operations

### ASSET_MANAGER_ROLE
- **Hash**: `keccak256("ASSET_MANAGER_ROLE")`
- **Holder**: Contract deployer (initially)
- **Permissions**:
  - `addSupportedAsset(address)` - Add new supported tokens
  - `removeSupportedAsset(address)` - Remove supported tokens

### MODULE_MANAGER_ROLE
- **Hash**: `keccak256("MODULE_MANAGER_ROLE")`
- **Holder**: Contract deployer (initially)
- **Permissions**:
  - `setModules(address, address, address)` - Update module addresses

### EMERGENCY_ROLE
- **Hash**: `keccak256("EMERGENCY_ROLE")`
- **Holder**: Contract deployer (initially)
- **Reserved**: For future emergency operations

## WalletFactory Roles

### DEFAULT_ADMIN_ROLE
- **Hash**: `0x00` (predefined by OpenZeppelin)
- **Holder**: Contract deployer (initially)
- **Permissions**: Can grant and revoke all roles

### ADMIN_ROLE
- **Hash**: `keccak256("ADMIN_ROLE")`
- **Holder**: Contract deployer (initially)
- **Reserved**: For future administrative operations

### DEPLOYER_ROLE
- **Hash**: `keccak256("DEPLOYER_ROLE")`
- **Holder**: DefiCityCore contract (automatically granted in constructor)
- **Permissions**:
  - `createWallet(address, uint256)` - Create SmartWallets
  - `createOrGetWallet(address)` - Get or create default wallet
  - `createWalletsBatch(address[], uint256[])` - Batch create wallets

## Owner-Only Functions

Some critical functions remain `onlyOwner` for maximum security:

### DefiCityCore
- `setWalletFactory(WalletFactory)` - Update the wallet factory address
- `setTreasury(address)` - Update the treasury address

## Role Management

### Granting Roles

```solidity
// Grant PAUSER_ROLE to an address
core.grantRole(core.PAUSER_ROLE(), pauserAddress);

// Grant ASSET_MANAGER_ROLE to an address
core.grantRole(core.ASSET_MANAGER_ROLE(), assetManagerAddress);
```

### Revoking Roles

```solidity
// Revoke PAUSER_ROLE from an address
core.revokeRole(core.PAUSER_ROLE(), pauserAddress);
```

### Checking Roles

```solidity
// Check if an address has a role
bool hasRole = core.hasRole(core.PAUSER_ROLE(), address);
```

### Renouncing Roles

```solidity
// Address can renounce their own role
core.renounceRole(core.PAUSER_ROLE(), msg.sender);
```

## Security Considerations

1. **DEFAULT_ADMIN_ROLE Protection**
   - This role can grant/revoke all other roles
   - Should be held by a secure multisig wallet
   - Consider using a timelock for added security

2. **Role Separation**
   - Distribute roles to different addresses for defense in depth
   - Don't give all roles to a single address (except initially)
   - Use different addresses for different operational roles

3. **Deployer Role in WalletFactory**
   - Only the DefiCityCore contract should have DEPLOYER_ROLE
   - This prevents unauthorized wallet creation
   - Ensures all wallets go through proper game mechanics

4. **Emergency Procedures**
   - PAUSER_ROLE can pause the contract immediately
   - Multiple addresses can hold PAUSER_ROLE for redundancy
   - EMERGENCY_ROLE reserved for future critical operations

## Deployment Checklist

After deploying contracts:

1. ✅ Verify owner has all roles initially
2. ✅ Verify DefiCityCore has DEPLOYER_ROLE in WalletFactory
3. 🔄 Transfer DEFAULT_ADMIN_ROLE to multisig (production)
4. 🔄 Grant PAUSER_ROLE to emergency responders
5. 🔄 Grant ASSET_MANAGER_ROLE to asset management team
6. 🔄 Grant MODULE_MANAGER_ROLE to development team
7. 🔄 Renounce deployment account roles (after setup)

## Testing

All existing tests pass without modification because:
- The test deployer receives all roles in the constructor
- Tests run with owner permissions
- Role checks only restrict non-owners

To test role restrictions:
```javascript
// Create a non-owner account
const [owner, nonOwner] = await ethers.getSigners();

// Try to pause without role (should fail)
await expect(
  core.connect(nonOwner).pause()
).to.be.revertedWith("AccessControl: account ... is missing role ...");

// Grant role and try again (should succeed)
await core.grantRole(await core.PAUSER_ROLE(), nonOwner.address);
await core.connect(nonOwner).pause();
```

## Comparison with Ownable

| Feature | Ownable | AccessControl |
|---------|---------|---------------|
| Single owner | ✅ | ❌ |
| Multiple administrators | ❌ | ✅ |
| Granular permissions | ❌ | ✅ |
| Role delegation | ❌ | ✅ |
| Two-step transfer | With Ownable2Step | Via role grant/revoke |
| Gas cost | Lower | Slightly higher |

We use **both** Ownable and AccessControl:
- **Ownable**: For critical operations (setWalletFactory, setTreasury)
- **AccessControl**: For operational permissions (pause, asset management, modules)

## Events

AccessControl emits events for all role changes:

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
```

Monitor these events for security and audit purposes.

## References

- [OpenZeppelin AccessControl Documentation](https://docs.openzeppelin.com/contracts/4.x/access-control)
- [OpenZeppelin AccessControl API](https://docs.openzeppelin.com/contracts/4.x/api/access#AccessControl)
