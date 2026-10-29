const React = require('react');

module.exports = {
  useFocusEffect: (callback) => {
    React.useEffect(() => {
      return callback();
    }, [callback]);
  },
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
};
