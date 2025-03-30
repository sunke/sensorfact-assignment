import axios from 'axios';
import { Sema } from 'async-sema';
import { DailyEnergy, TransactionEnergy, WalletEnergy } from './models';

const BASE_URL = 'https://blockchain.info';
const RAW_BLOCK_URL = `${BASE_URL}/rawblock`;
const RAW_TX_URL = `${BASE_URL}/rawtx`;
const BLOCKS_URL = `${BASE_URL}/blocks`;
const RAW_ADDR_URL = `${BASE_URL}/rawaddr`;

export class BlockchainEnergyConsumptionService {
    private readonly ENERGY_PER_BYTE = 4.56; // KwH

    /**
     * TODO: persist cache to disk and use a more sophisticated caching mechanism.
     * Currently it uses the url as the key and the fetched data as the value.
     * This might cause dirty cache for example new transactions might be added to 
     * the block but the cache is not updated.
     */
    private cache: Map<string, any> = new Map(); 
  
    async getBlockEnergyConsumption(blockHash: string): Promise<TransactionEnergy[]> {
      const block = await this.fetchWithCache(
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
          const blocks = await this.fetchWithCache(
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
      const wallet = await this.fetchWithCache(
        `${RAW_ADDR_URL}/${address}`
      );
      
      let totalEnergy = 0;
      let txCount = 0;
      
      for (const tx of wallet.txs) {
        const txDetails = await this.getTransactionByHashCode(tx.hash);
        totalEnergy += txDetails.size * this.ENERGY_PER_BYTE;
        txCount++;
      }
      
      return {
        address,
        totalEnergyKwh: totalEnergy,
        transactionCount: txCount
      };
    }

    private async getTransactionByHashCode(hash: string): Promise<any> {
      return this.fetchWithCache(`${RAW_TX_URL}/${hash}`);
    }

    private async fetchWithCache(url: string): Promise<any> {
      // Check if the URL is already cached
      if (this.cache.has(url)) {
        console.log(`Cache hit for URL: ${url}`);
        return this.cache.get(url);
      }
  
      // Fetch data using the existing fetch method
      const data = await this.fetch(url);
  
      // Cache the fetched data
      this.cache.set(url, data);
      return data;
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