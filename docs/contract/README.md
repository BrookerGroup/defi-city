# Contract Documentation

Smart contract documentation for DefiCity v2.0 (Self-Custodial Architecture).

## Documents

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | v2.0 Self-Custodial Architecture - asset flow, SmartWallet design, session keys, component overview |
| [CONTRACT_DESIGN.md](./CONTRACT_DESIGN.md) | Detailed smart contract design specs - interfaces, data structures, access control, upgrade patterns |
| [CONTRACT_SEQUENCE_DIAGRAMS.md](./CONTRACT_SEQUENCE_DIAGRAMS.md) | Sequence diagrams for all contract interactions - deposits, withdrawals, harvests, building operations |

## Key Concepts

- **ERC-4337 Account Abstraction**: SmartWallet, WalletFactory, Session Keys, Paymaster
- **Self-Custodial**: Users retain full custody; DefiCityCore handles bookkeeping only
- **DeFi Integrations**: Aave V3 (Bank), Aerodrome (Shop/LP), Megapot (Lottery)
- **Networks**: Base Sepolia (84532), Base Mainnet (8453)

## Contract Source

See [`/contract/`](../../contract/) for Solidity source code (Hardhat/Foundry).
