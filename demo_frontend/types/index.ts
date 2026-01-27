export interface Building {
  id: bigint;
  owner: string;
  smartWallet: string;
  buildingType: string;
  asset: string;
  amount: bigint;
  placedAt: bigint;
  coordinateX: bigint;
  coordinateY: bigint;
  active: boolean;
  metadata: string;
}

export interface UserStats {
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  totalHarvested: bigint;
  buildingCount: bigint;
  cityCreatedAt: bigint;
}

export interface GridCell {
  x: number;
  y: number;
  building?: Building;
  isEmpty: boolean;
}
