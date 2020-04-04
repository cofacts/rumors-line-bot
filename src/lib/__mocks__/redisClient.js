// Automatically mocks all existence of redisClient in unit tests
export default jest.genMockFromModule('../redisClient').default;
