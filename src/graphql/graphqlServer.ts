import { schemaComposer } from './schema';
import { GraphqlResolver } from './graphqlResolver';

const resolverService = new GraphqlResolver();

// Add fields to the Query type
schemaComposer.Query.addFields({
  blockEnergyConsumption: {
    type: '[TransactionEnergy!]!',
    args: {
      blockHash: 'String!',
    },
    resolve: async (_, { blockHash }) => {
      return await resolverService.getBlockEnergyConsumption(blockHash);
    },
  },
  dailyEnergyConsumption: {
    type: '[DailyEnergy!]!',
    args: {
      days: 'Int!',
    },
    resolve: async (_, { days }) => {
      return await resolverService.getDailyEnergyConsumption(days);
    },
  },
  walletEnergyConsumption: {
    type: 'WalletEnergy',
    args: {
      address: 'String!',
    },
    resolve: async (_, { address }) => {
      return await resolverService.getWalletEnergyConsumption(address);
    },
  },
});

export const schema = schemaComposer.buildSchema();