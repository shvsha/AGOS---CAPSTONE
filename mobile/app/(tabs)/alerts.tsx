// react native
import { View, Text, StyleSheet } from 'react-native'

export default function alerts() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ALERT</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  text: { fontSize: 16}
})
