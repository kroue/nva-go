import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

export default function Messaging() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Message 1 (left) */}
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={styles.bubbleSmall} />
      </View>
      {/* Message 2 (right) */}
      <View style={styles.row}>
        <View style={{ flex: 1 }} />
        <View style={styles.bubbleLarge} />
      </View>
      {/* Message 3 (left) */}
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={styles.bubbleSmall} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  bubbleSmall: {
    width: 140,
    height: 44,
    backgroundColor: '#ededed',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bubbleLarge: {
    width: 220,
    height: 100,
    backgroundColor: '#ededed',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});