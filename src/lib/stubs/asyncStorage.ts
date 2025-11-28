/**
 * Minimal AsyncStorage stub to satisfy optional React Native dependencies
 * during Next.js builds and automated testing. The implementation deliberately
 * no-ops while keeping the asynchronous API surface that callers expect.
 */
const createNoop = () => Promise.resolve(null);

const AsyncStorage = {
  getItem: createNoop,
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  getAllKeys: () => Promise.resolve([] as string[])
};

export default AsyncStorage;
export { AsyncStorage };
