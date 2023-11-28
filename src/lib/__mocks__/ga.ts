const eventMock = jest.fn();
const sendMock = jest.fn();
const setMock = jest.fn();

const ga = Object.assign(
  jest.fn().mockImplementation(() => {
    const visitor = {
      event: eventMock,
      send: sendMock,
      set: setMock,
      screenview: () => undefined,
    };

    // Support the usecase of ga.event().send()
    visitor.event.mockImplementation(() => visitor);

    return visitor;
  }),
  {
    clearAllMocks: () => {
      eventMock.mockClear();
      sendMock.mockClear();
      setMock.mockClear();
      ga.mockClear();
    },
    eventMock,
    sendMock,
    setMock,
  }
);

export type MockedGa = typeof ga;
export default ga;
