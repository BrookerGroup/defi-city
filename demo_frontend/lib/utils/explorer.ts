// Base Sepolia Block Explorer URL
const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";

/**
 * Get transaction URL for Base Sepolia explorer
 */
export function getTxUrl(txHash: string): string {
  return `${BASE_SEPOLIA_EXPLORER}/tx/${txHash}`;
}

/**
 * Get address URL for Base Sepolia explorer
 */
export function getAddressUrl(address: string): string {
  return `${BASE_SEPOLIA_EXPLORER}/address/${address}`;
}

/**
 * Open transaction in new tab
 */
export function openTxInExplorer(txHash: string): void {
  window.open(getTxUrl(txHash), "_blank", "noopener,noreferrer");
}

/**
 * Open address in new tab
 */
export function openAddressInExplorer(address: string): void {
  window.open(getAddressUrl(address), "_blank", "noopener,noreferrer");
}
