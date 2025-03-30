// Type definitions for the Bitcoin energy monitoring project

// Represents the energy consumption data for a single transaction
export interface TransactionEnergy {
    transactionHash: string;
    energyKwh: number;
    sizeBytes: number;
  }
  
  // Represents daily energy consumption data
  export interface DailyEnergy {
    date: string; // ISO date string (e.g., "2025-03-23")
    totalEnergyKwh: number;
    transactionCount: number;
  }
  
  // Represents wallet-specific energy consumption data (optional feature)
  export interface WalletEnergy {
    address: string;
    totalEnergyKwh: number;
    transactionCount: number;
  }
  
  // Type for the GraphQL context (can be extended if needed)
  export interface Context {
    // Add properties like dataSources or auth if required later
  }
  
  // Types for Blockchain API responses (simplified)
  export interface Block {
    hash: string;
    tx: Transaction[];
    time: number; // Unix timestamp
  }
  
  export interface Transaction {
    hash: string;
    size: number; // Size in bytes
    // Add more fields if needed based on blockchain.com API
  }
  
  export interface BlockListResponse {
    blocks: {
      hash: string;
      time: number;
    }[];
  }
  
  // Wallet address response (for optional feature)
  export interface WalletResponse {
    address: string;
    txs: Transaction[];
    total_received: number;
    total_sent: number;
  }