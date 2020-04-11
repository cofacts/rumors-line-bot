export const eventMock = jest.fn();

function ga() {
  return {
    event: eventMock,
    send: () => {},
    screenview: () => {},
  };
}

export default ga;
