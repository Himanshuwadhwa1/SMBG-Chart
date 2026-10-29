const React = require('react');

function createComponent(name) {
  const Component = (props) => {
    return React.createElement(name, props, props.children);
  };
  Component.displayName = name;
  return Component;
}

module.exports = {
  View: createComponent('View'),
  Text: createComponent('Text'),
  TextInput: createComponent('TextInput'),
  TouchableOpacity: createComponent('TouchableOpacity'),
  Modal: createComponent('Modal'),
  ScrollView: createComponent('ScrollView'),
  ActivityIndicator: createComponent('ActivityIndicator'),
  Image: createComponent('Image'),
  RefreshControl: createComponent('RefreshControl'),
  Platform: {
    OS: 'android',
    select: (objs) => (objs && objs.android !== undefined ? objs.android : objs.default),
  },
  StyleSheet: {
    create: (styles) => styles,
  },
  Alert: {
    alert: jest.fn((title, message, buttons) => {
      if (buttons && buttons.length > 1 && buttons[1].onPress) {
        buttons[1].onPress();
      }
    }),
  },
  Share: {
    share: jest.fn(async () => ({ action: 'sharedAction' })),
  },
  useColorScheme: () => 'light',
  useWindowDimensions: () => ({
    width: 800,
    height: 600,
    scale: 1,
    fontScale: 1,
  }),
  Dimensions: {
    get: () => ({
      width: 800,
      height: 600,
      scale: 1,
      fontScale: 1,
    }),
  },
};
