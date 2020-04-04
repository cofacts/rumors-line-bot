export const mockedGetNumberOfMessageDeliveries = jest.fn();
export const mockedGetNumberOfFollowers = jest.fn();
export const mockedGetFriendDemographics = jest.fn();

export const Client = jest.fn().mockImplementation(() => ({
  getNumberOfMessageDeliveries: mockedGetNumberOfMessageDeliveries,
  getNumberOfFollowers: mockedGetNumberOfFollowers,
  getFriendDemographics: mockedGetFriendDemographics,
}));
