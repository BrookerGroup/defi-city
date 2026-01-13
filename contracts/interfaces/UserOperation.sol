// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserOperation
 * @notice Structure representing an ERC-4337 UserOperation
 * @dev A UserOperation is the ERC-4337 equivalent of an Ethereum transaction.
 *      It's created off-chain, signed by the user, and submitted to the bundler.
 *
 * Lifecycle:
 * 1. User creates UserOp off-chain (frontend/wallet)
 * 2. User signs the UserOp hash
 * 3. UserOp is sent to bundler (off-chain mempool)
 * 4. Bundler includes UserOp in a call to EntryPoint.handleOps()
 * 5. EntryPoint validates and executes the UserOp
 */
struct UserOperation {
    /**
     * @notice The wallet address that will execute this operation
     * @dev Can be a counterfactual address (wallet not deployed yet)
     *      If wallet doesn't exist, initCode must be provided
     */
    address sender;

    /**
     * @notice Anti-replay parameter, managed by EntryPoint
     * @dev Format: (key << 192) | sequence
     *      - Sequential mode (key=0): 0,1,2,3... must be used in order
     *      - Parallel mode (key>0): allows concurrent operations
     *      Get next nonce via: entryPoint.getNonce(sender, key)
     */
    uint256 nonce;

    /**
     * @notice Code to deploy the wallet if it doesn't exist
     * @dev Format: factoryAddress (20 bytes) + factoryCalldata
     *      Example: factory.createWallet(owner, salt)
     *      If wallet exists, this MUST be empty (0x or "")
     *      If wallet doesn't exist, EntryPoint will call this before validation
     */
    bytes initCode;

    /**
     * @notice The actual operation to execute on the wallet
     * @dev This is the function call data sent to the wallet after validation
     *      Example: wallet.execute(target, value, data)
     *      For batch operations: wallet.executeBatch([targets], [values], [datas])
     */
    bytes callData;

    /**
     * @notice Gas limit for the execution phase (actual operation)
     * @dev This is the gas available for executing callData
     *      Should be estimated via eth_estimateUserOperationGas
     *      Too low = execution fails; too high = overpayment
     */
    uint256 callGasLimit;

    /**
     * @notice Gas limit for the verification phase (validateUserOp)
     * @dev Gas available for:
     *      - Deploying wallet (if initCode present)
     *      - Calling wallet.validateUserOp()
     *      - Calling paymaster.validatePaymasterUserOp() (if paymaster present)
     */
    uint256 verificationGasLimit;

    /**
     * @notice Gas paid upfront to the bundler for overhead
     * @dev Covers:
     *      - Base transaction cost (21000)
     *      - Calldata costs
     *      - EntryPoint overhead
     *      Usually ~21000 + calldata_cost
     */
    uint256 preVerificationGas;

    /**
     * @notice Maximum fee per gas (EIP-1559)
     * @dev Same as EIP-1559 transactions
     *      Total gas cost = actualGasUsed * min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
     */
    uint256 maxFeePerGas;

    /**
     * @notice Maximum priority fee per gas (EIP-1559)
     * @dev Tip to bundler/miner
     *      Bundlers typically require minimum priority fee to include UserOp
     */
    uint256 maxPriorityFeePerGas;

    /**
     * @notice Paymaster and data (if using sponsored gas)
     * @dev Format if using paymaster:
     *      - paymasterAddress (20 bytes)
     *      - verificationGasLimit for paymaster (16 bytes)
     *      - postOpGasLimit for paymaster (16 bytes)
     *      - paymasterData (variable length)
     *      If NOT using paymaster, this MUST be empty (0x or "")
     */
    bytes paymasterAndData;

    /**
     * @notice User's signature over the UserOp
     * @dev Signature is over: keccak256(abi.encode(userOpHash, entryPoint, chainId))
     *      - userOpHash = hash of all above fields (excluding signature)
     *      - For EOA owners: ECDSA signature (65 bytes)
     *      - For contract owners: ERC-1271 signature (variable length)
     *      - For multisig: concatenated signatures
     *
     *      The wallet's validateUserOp() function verifies this signature
     */
    bytes signature;
}

/**
 * @title UserOperation Helper Library
 * @notice Utilities for working with UserOperations
 */
library UserOperationLib {
    /**
     * @notice Extract the sender from a UserOperation
     * @dev Helper function for clarity
     */
    function getSender(UserOperation calldata userOp) internal pure returns (address) {
        return userOp.sender;
    }

    /**
     * @notice Calculate the required gas pre-funding
     * @dev This is the amount the wallet must have in EntryPoint deposit
     */
    function requiredPreFund(UserOperation calldata userOp) internal pure returns (uint256) {
        uint256 requiredGas = userOp.callGasLimit +
            userOp.verificationGasLimit +
            userOp.preVerificationGas;

        return requiredGas * userOp.maxFeePerGas;
    }

    /**
     * @notice Calculate the hash of a UserOperation
     * @dev This is what gets signed by the user
     *      NOTE: This is NOT the same as EntryPoint.getUserOpHash()
     *      which also includes entryPoint address and chainId
     */
    function hash(UserOperation calldata userOp) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            userOp.sender,
            userOp.nonce,
            keccak256(userOp.initCode),
            keccak256(userOp.callData),
            userOp.callGasLimit,
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
            userOp.maxFeePerGas,
            userOp.maxPriorityFeePerGas,
            keccak256(userOp.paymasterAndData)
        ));
    }
}

/**
 * @notice Validation return codes for validateUserOp
 * @dev These constants are used by wallet's validateUserOp() return value
 */
library ValidationData {
    /**
     * @notice Signature validation failed
     * @dev Return this if signature is invalid, signer is not authorized, etc.
     */
    uint256 constant SIG_VALIDATION_FAILED = 1;

    /**
     * @notice Signature validation succeeded
     * @dev Return 0 if signature is valid and there are no time restrictions
     */
    uint256 constant SIG_VALIDATION_SUCCESS = 0;

    /**
     * @notice Pack validation data with time range
     * @dev Format: | validAfter (6 bytes) | validUntil (6 bytes) | authorizer (20 bytes) |
     *      - validAfter: timestamp after which the UserOp is valid
     *      - validUntil: timestamp until which the UserOp is valid (0 = forever)
     *      - authorizer: address that authorized this (0 = no specific authorizer)
     */
    function packValidationData(
        bool sigFailed,
        uint48 validUntil,
        uint48 validAfter
    ) internal pure returns (uint256) {
        return (sigFailed ? 1 : 0) | (uint256(validUntil) << 160) | (uint256(validAfter) << 208);
    }

    /**
     * @notice Extract signature failure status
     */
    function parseValidationData(uint256 validationData)
        internal pure returns (bool sigFailed, uint48 validUntil, uint48 validAfter)
    {
        sigFailed = (validationData & 1) == 1;
        validUntil = uint48(validationData >> 160);
        validAfter = uint48(validationData >> 208);
    }
}
