import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ViewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>View / Chart Screen</Text>
      <Text style={styles.subtitle}>SMBG Chart Review Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
