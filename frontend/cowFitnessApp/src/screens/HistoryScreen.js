import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen({ history, onOpenItem, onGoHome, onGoCapture, onClearHistory }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No detection history yet.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => onOpenItem(item)}>
              <Text style={styles.cardTitle}>Detections: {item.count}</Text>
              <Text style={styles.cardSubtitle}>{item.timestamp}</Text>
              <Text style={styles.cardMeta}>
                Animal Type: {String(item.animalType?.label || 'unknown').toUpperCase()}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {history.length > 0 ? (
        <Pressable style={styles.clearButton} onPress={onClearHistory}>
          <Text style={styles.clearButtonText}>Clear History</Text>
        </Pressable>
      ) : null}

      <View style={styles.bottomRow}>
        <Pressable style={styles.navButton} onPress={onGoHome}>
          <Text style={styles.navButtonText}>Home</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onGoCapture}>
          <Text style={styles.navButtonText}>Capture</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#555',
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#607080',
  },
  clearButton: {
    backgroundColor: '#fff3f2',
    borderWidth: 1,
    borderColor: '#f2c7c2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButtonText: {
    color: '#b42318',
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  navButtonText: {
    fontWeight: '600',
  },
});