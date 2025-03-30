import axios from 'axios';
import { Sema } from 'async-sema';
import { DailyEnergy, TransactionEnergy, WalletEnergy } from './models';

export class BlockchainEnergyConsumptionService {
    private readonly ENERGY_PER_BYTE = 4.56; // KwH
    private cache: Map<string, any> = new Map(); // Cache to store fetched data
  
    async getEnergyPerBlock(blockHash: string): Promise<TransactionEnergy[]> {
      console.time('fetchBlock');
      const block = await this.fetchWithCache(
        `https://blockchain.info/rawblock/${blockHash}`
      );
      console.timeEnd('fetchBlock');
      
      const transactions: TransactionEnergy[] = [];
      const sema = new Sema(5); // Limit concurrency to 5

      for (const tx of block.tx) {
        await sema.acquire(); // Acquire a slot
        (async () => {
          try {
            const txDetails = await this.fetchWithCache(
              `https://blockchain.info/rawtx/${tx.hash}`
            );
    
            transactions.push({
              transactionHash: tx.hash,
              energyKwh: txDetails.size * this.ENERGY_PER_BYTE,
              sizeBytes: txDetails.size,
            });
          } finally {
            sema.release(); // Release the slot
          }
        })();
      }

      return transactions;
    }

    async getDailyEnergyConsumption(days: number): Promise<DailyEnergy[]> {
      const now = Date.now();
      const results: DailyEnergy[] = [];
      
      for (let i = 0; i < days; i++) {
        const timestamp = now - (i * 24 * 60 * 60 * 1000);
        console.log(`Fetching data for date: ${new Date(timestamp).toISOString()}`);
        const blocks = await this.fetchWithCache(
          `https://blockchain.info/blocks/${timestamp}?format=json`
        );
        
        let totalEnergy = 0;
        let txCount = 0;
        
        for (const block of blocks) {
          // Reuse getEnergyPerBlock to fetch transactions for the block
          const transactions = await this.getEnergyPerBlock(block.hash);

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
          transactionCount: txCount
        });
      }
      
      return results;
    }

    async getWalletEnergyConsumption(address: string): Promise<WalletEnergy> {
      const wallet = await this.fetchWithCache(
        `https://blockchain.info/rawaddr/${address}`
      );
      
      let totalEnergy = 0;
      let txCount = 0;
      
      for (const tx of wallet.txs) {
        const txDetails = await this.fetchWithCache(
          `https://blockchain.info/rawtx/${tx.hash}`
        );
        
        totalEnergy += txDetails.size * this.ENERGY_PER_BYTE;
        txCount++;
      }
      
      return {
        address,
        totalEnergyKwh: totalEnergy,
        transactionCount: txCount
      };
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
          const response = await axios.get(url, { timeout: 10000 });
          return response.data;
      } catch (error) {
          console.error(`Error fetching data from ${url}:`, error);
          throw new Error(`Failed to fetch data from ${url}`);
      }
  }
}


