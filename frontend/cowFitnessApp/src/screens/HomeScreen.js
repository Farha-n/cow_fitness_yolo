import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen({ onGoCapture, onGoHistory, backendHealth, historyCount }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cow Fitness App</Text>
      <Text style={styles.subtitle}>Detect cattle and buffalo from camera or gallery image</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Status</Text>
        <Text style={styles.cardText}>{backendHealth?.message || 'Not checked yet'}</Text>
        <Text style={styles.cardMeta}>
          State: {String(backendHealth?.status || 'unknown').toUpperCase()}
          {backendHealth?.latencyMs ? ` • ${backendHealth.latencyMs} ms` : ''}
        </Text>
        <Text style={styles.cardMeta}>Saved runs: {historyCount || 0}</Text>
      </View>

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
    marginBottom: 18,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d9e1ec',
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#213547',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#5a6b7d',
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