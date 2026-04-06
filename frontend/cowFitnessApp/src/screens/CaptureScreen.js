import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

export default function CaptureScreen({
  backendUrl,
  autoDetect,
  loading,
  onChangeBackendUrl,
  onChangeAutoDetect,
  onPickImage,
  onPickMultipleImages,
  onCaptureImage,
  onRunDetection,
  onGoHome,
  onGoResults,
  onGoHistory,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture</Text>

      <TextInput
        value={backendUrl}
        onChangeText={onChangeBackendUrl}
        placeholder="http://192.168.x.x:8000"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>Auto-detect after pick/capture</Text>
        <Switch value={autoDetect} onValueChange={onChangeAutoDetect} />
      </View>

      <Pressable style={styles.button} onPress={onPickImage}>
        <Text style={styles.buttonText}>Pick from Gallery</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={onPickMultipleImages}>
        <Text style={styles.buttonText}>Pick Multiple Photos</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={onCaptureImage}>
        <Text style={styles.buttonText}>Capture from Camera</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={onRunDetection}>
        <Text style={styles.buttonText}>Run Detection</Text>
      </Pressable>

      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      <View style={styles.bottomRow}>
        <Pressable style={styles.navButton} onPress={onGoHome}>
          <Text style={styles.navButtonText}>Home</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onGoResults}>
          <Text style={styles.navButtonText}>Results</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onGoHistory}>
          <Text style={styles.navButtonText}>History</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  toggleText: {
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1f6feb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
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