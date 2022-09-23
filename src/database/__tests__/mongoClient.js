import Client from '../mongoClient';

describe('MongoClient', () => {
  it('should connect', async () => {
    const client = await Client.getInstance();
    expect(client.mongoClient.isConnected()).toBe(true);
    expect(client.db.databaseName).toBe('cofacts');
  });
});
