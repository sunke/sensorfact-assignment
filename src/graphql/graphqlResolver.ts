import axios from 'axios';
import { Sema } from 'async-sema';
import { DailyEnergy, TransactionEnergy, WalletEnergy } from './models';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library for unique ID generation

const BASE_URL = 'https://blockchain.info';
const RAW_BLOCK_URL = `${BASE_URL}/rawblock`;
const RAW_TX_URL = `${BASE_URL}/rawtx`;
const BLOCKS_URL = `${BASE_URL}/blocks`;
const RAW_ADDR_URL = `${BASE_URL}/rawaddr`;

export class GraphqlResolver {
    private readonly serviceId: string; // Unique ID for the service instance
    private readonly ENERGY_PER_BYTE = 4.56; // KwH

    /**
     * Cache with <block_hashcode, transactions>, for storing data to avoid redundant API calls.
     * TODO: persist cache to disk
     */
    private blockCache: Map<string, any> = new Map(); 

    
    constructor() {
      this.serviceId = uuidv4(); // Generate a unique ID for this instance
      console.log(`Service instance created with ID: ${this.serviceId}`);
    }
  
    async getBlockEnergyConsumption(blockHash: string): Promise<TransactionEnergy[]> {
      console.debug(`Service ID: ${this.serviceId}`);
      console.debug('Current blockCache content:', Array.from(this.blockCache.entries()));

      // Check if the block data is already cached
      if (this.blockCache.has(blockHash)) {
        console.log(`Cache hit for block hash: ${blockHash}`);
        return this.blockCache.get(blockHash);
      }

      // Fetch block data from the API
      const block = await this.fetch(
        `${RAW_BLOCK_URL}/${blockHash}`
      );
      
      const transactions: TransactionEnergy[] = [];

      for (const tx of block.tx) {
        transactions.push({
          transactionHash: tx.hash,
          energyKwh: tx.size * this.ENERGY_PER_BYTE,
          sizeBytes: tx.size,
        });
      }

      // Cache the result using the block hash as the key
      this.blockCache.set(blockHash, transactions);
      return transactions;
    }

    async getDailyEnergyConsumption(days: number): Promise<DailyEnergy[]> {
      const now = Date.now();
      const results: DailyEnergy[] = [];
      const sema = new Sema(5); // Limit concurrency to 5 requests at a time

      for (let i = 0; i < days; i++) {
        const timestamp = now - i * 24 * 60 * 60 * 1000;
        console.log(`Fetching data for date: ${new Date(timestamp).toISOString()}`);

        await sema.acquire(); // Acquire a slot for the request
        try {
          const blocks = await this.fetch(
            `${BLOCKS_URL}/${timestamp}?format=json`
          );

          let totalEnergy = 0;
          let txCount = 0;

          for (const block of blocks) {
            // Reuse getBlockEnergyConsumption to fetch transactions for the block
            const transactions = await this.getBlockEnergyConsumption(block.hash);

            // Aggregate energy and transaction count
            totalEnergy += transactions.reduce(
              (sum, tx) => sum + tx.energyKwh,
              0
            );
            txCount += transactions.length;
          }

          results.push({
            date: new Date(timestamp).toISOString().split('T')[0],
            totalEnergyKwh: totalEnergy,
            transactionCount: txCount,
          });
        } finally {
          sema.release(); // Release the slot after the request is complete
        }
      }

      return results;
    }

    async getWalletEnergyConsumption(address: string): Promise<WalletEnergy> {
      const wallet = await this.fetch(
        `${RAW_ADDR_URL}/${address}`
      );
      
      let totalEnergy = 0;
      let txCount = 0;
      
      for (const tx of wallet.txs) {
        totalEnergy += tx.size * this.ENERGY_PER_BYTE;
        txCount++;
      }
      
      return {
        address,
        totalEnergyKwh: totalEnergy,
        transactionCount: txCount
      };
    }

    private async fetch(url: string): Promise<any> {
      try {
          const startTime = Date.now(); 
          const response = await axios.get(url, { timeout: 10000 });
          const endTime = Date.now();
          console.log(`Fetched data in ${endTime - startTime} ms: ${url}`);
          return response.data;
      } catch (error) {
          console.error(`Error fetching data from ${url}:`, error);
          throw new Error(`Failed to fetch data from ${url}`);
      }
  }
}