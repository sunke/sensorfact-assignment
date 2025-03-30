### Solution Description

The main part of the solution is implemented in the `service.ts` file, which defines the `BlockchainEnergyConsumptionService` class. This class provides methods to calculate the energy consumption of Bitcoin transactions, blocks, and wallets by interacting with the Blockchain API. Below is an explanation of the key components:

---

#### **Key Features**

1. **Energy Calculation Logic**:
   - The energy consumption is calculated based on the size of transactions in bytes, using a constant energy cost of `4.56 kWh` per byte.

2. **API Integration**:
   - The service interacts with the Blockchain API to fetch data about blocks, transactions, and wallets using endpoints like:
     - `https://blockchain.info/rawblock/{blockHash}` for block details.
     - `https://blockchain.info/rawtx/{txHash}` for transaction details.
     - `https://blockchain.info/rawaddr/{address}` for wallet details.

3. **Concurrency Management**:
   - The `Sema` library is used to limit the number of concurrent API calls to avoid overwhelming the API and improve performance.

4. **Caching**:
   - A simple in-memory cache is implemented using a `Map` to store fetched data and reduce redundant API calls.

5. **Reusable Methods**:
   - The `getTransactionDetails` method was extracted to centralize the logic for fetching transaction details. This method is reused in both `getEnergyPerBlock` and `getWalletEnergyConsumption`.

---

#### **Methods Overview**

1. **`getEnergyPerBlock(blockHash: string)`**:
   - Fetches all transactions in a block and calculates the energy consumption for each transaction.
   - Uses concurrency control to limit the number of simultaneous API calls.

2. **`getDailyEnergyConsumption(days: number)`**:
   - Calculates the total energy consumption and transaction count for blocks over a specified number of days.
   - Aggregates data from multiple blocks fetched for each day.

3. **`getWalletEnergyConsumption(address: string)`**:
   - Calculates the total energy consumption and transaction count for all transactions associated with a specific wallet address.

4. **`getTransactionDetails(txHash: string)`**:
   - A reusable method to fetch transaction details from the Blockchain API.

5. **`fetchWithCache(url: string)`**:
   - A utility method to fetch data from the API with caching to improve performance.

6. **`fetch(url: string)`**:
   - A low-level method to make HTTP GET requests using `axios`.

---

### Solution Performance Analysis

The performance of the solution was evaluated by comparing sequential and parallel reads when fetching data from the Blockchain API. Below are the results:

#### **Sequential Read**
- **Request ID**: `2899f5a8-e73b-4dea-8b0e-b0c3d3b77bcb`
- **Duration**: `67276.15 ms`
- **Billed Duration**: `67277 ms`

#### **Parallel Read (3 Concurrent Requests)**
- **Request ID**: `660a1026-fe18-4795-926f-10cd1e21c74c`
- **Duration**: `39561.17 ms`
- **Billed Duration**: `39562 ms`

#### **Performance Improvement**
By introducing parallel reads with a concurrency limit of 3, the solution achieved a significant reduction in execution time:
- **Improvement**: ~41% faster compared to sequential reads.

#### **Key Optimizations**
1. **Concurrency Control**:
   - The `Sema` library was used to limit the number of concurrent API calls, ensuring efficient resource utilization without overwhelming the API.

2. **Caching**:
   - An in-memory cache was implemented to reduce redundant API calls, further improving performance.

3. **Reusable Methods**:
   - The `getTransactionDetails` method was extracted to centralize transaction fetch logic, reducing code duplication and improving maintainability.

---

#### **Conclusion**
The `BlockchainEnergyConsumptionService` is designed to efficiently calculate energy consumption for Bitcoin transactions, blocks, and wallets. By leveraging caching, concurrency control, and reusable methods, the solution ensures optimal performance and maintainability.