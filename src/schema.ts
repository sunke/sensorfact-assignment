import { SchemaComposer } from 'graphql-compose';
import { BlockchainEnergyConsumptionService } from './service';

const schemaComposer = new SchemaComposer();
const energyService = new BlockchainEnergyConsumptionService();

// Define the TransactionEnergy type
schemaComposer.createObjectTC({
  name: 'TransactionEnergy',
  fields: {
    transactionHash: 'String!',
    energyKwh: 'Float!',
    sizeBytes: 'Int!',
  },
});

// Define the DailyEnergy type
schemaComposer.createObjectTC({
  name: 'DailyEnergy',
  fields: {
    date: 'String!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
  },
});

// Define the WalletEnergy type
schemaComposer.createObjectTC({
  name: 'WalletEnergy',
  fields: {
    address: 'String!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
  },
});

// Add fields to the Query type
schemaComposer.Query.addFields({
  blockEnergyConsumption: {
    type: '[TransactionEnergy!]!',
    args: {
      blockHash: 'String!',
    },
    resolve: async (_, { blockHash }) => {
      return await energyService.getBlockEnergyConsumption(blockHash);
    },
  },
  dailyEnergyConsumption: {
    type: '[DailyEnergy!]!',
    args: {
      days: 'Int!',
    },
    resolve: async (_, { days }) => {
      return await energyService.getDailyEnergyConsumption(days);
    },
  },
  walletEnergyConsumption: {
    type: 'WalletEnergy',
    args: {
      address: 'String!',
    },
    resolve: async (_, { address }) => {
      return await energyService.getWalletEnergyConsumption(address);
    },
  },
});

export const schema = schemaComposer.buildSchema();