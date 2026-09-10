import React from 'react';
import { Text, View } from 'react-native';

export default function ScreenHeader({ title, styles }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}
