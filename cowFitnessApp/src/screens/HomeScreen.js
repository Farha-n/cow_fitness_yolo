import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen({ onGoCapture, onGoHistory }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cow Fitness App</Text>
      <Text style={styles.subtitle}>Detect cows from camera or gallery image</Text>

      <Pressable style={styles.primaryButton} onPress={onGoCapture}>
        <Text style={styles.primaryButtonText}>Open Capture</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onGoHistory}>
        <Text style={styles.secondaryButtonText}>View History</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 26,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1f6feb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});