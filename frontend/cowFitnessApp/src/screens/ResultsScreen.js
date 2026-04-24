import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ResultsScreen({
  imageUri,
  imageSize,
  detections,
  detectionThreshold,
  onChangeDetectionThreshold,
  assessment,
  animalType,
  batchSummary,
  loading,
  onDetect,
  onGoCapture,
  onGoHome,
  onGoHistory,
}) {
  const previewWidth = 340;
  const previewHeight = imageSize.width > 0 ? (previewWidth * imageSize.height) / imageSize.width : 220;
  const scaleX = previewWidth / Math.max(1, imageSize.width);
  const scaleY = previewHeight / Math.max(1, imageSize.height);
  const thresholdPercent = Math.round((detectionThreshold || 0) * 100);
  const visibleDetections = (detections || []).filter((item) => (item?.confidence || 0) >= (detectionThreshold || 0));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Results</Text>

      <View style={styles.thresholdRow}>
        <Text style={styles.thresholdLabel}>Confidence Filter: {thresholdPercent}%</Text>
        <View style={styles.thresholdButtons}>
          <Pressable
            style={styles.thresholdButton}
            onPress={() => onChangeDetectionThreshold(Math.max(0.1, +(detectionThreshold - 0.05).toFixed(2)))}
          >
            <Text style={styles.thresholdButtonText}>-</Text>
          </Pressable>
          <Pressable
            style={styles.thresholdButton}
            onPress={() => onChangeDetectionThreshold(Math.min(0.95, +(detectionThreshold + 0.05).toFixed(2)))}
          >
            <Text style={styles.thresholdButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      {imageUri ? (
        <View style={[styles.previewWrap, { width: previewWidth, height: previewHeight }]}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          {visibleDetections.map((item, index) => {
            const box = item?.bbox;
            if (!box) return null;

            const left = box.x1 * scaleX;
            const top = box.y1 * scaleY;
            const width = Math.max(1, (box.x2 - box.x1) * scaleX);
            const height = Math.max(1, (box.y2 - box.y1) * scaleY);

            return (
              <View key={`${item.class_id}-${index}`} style={[styles.box, { left, top, width, height }]}>
                <Text style={styles.boxText}>
                  {item.class_name} {(item.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.previewWrap, styles.emptyPreview]}>
          <Text>No image selected yet.</Text>
        </View>
      )}

      <Text style={styles.countText}>
        Showing {visibleDetections.length}/{(detections || []).length} detections after threshold.
      </Text>

      {animalType ? (
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Animal Type</Text>
          <Text style={styles.assessmentText}>
            Type: {String(animalType?.label || 'unknown').toUpperCase()} ({((animalType?.confidence || 0) * 100).toFixed(1)}%)
          </Text>
        </View>
      ) : null}

      {batchSummary ? (
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Batch Summary</Text>
          <Text style={styles.assessmentText}>Processed photos: {batchSummary.total || 0}</Text>
          {Object.entries(batchSummary.animalTypeCounts || {}).map(([label, count]) => (
            <Text key={label} style={styles.assessmentText}>
              {String(label).toUpperCase()}: {count}
            </Text>
          ))}
        </View>
      ) : null}

      {assessment ? (
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Birth Fitness Estimate</Text>
          <View style={styles.assessmentRow}>
            <Text style={styles.assessmentLabel}>Condition:</Text>
            <Text style={[styles.assessmentValue, styles[`status_${assessment.status}`]]}>
              {String(assessment.status || 'unknown').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.assessmentText}>Score: {assessment.score ?? 0}/100</Text>
          <Text style={styles.assessmentText}>{assessment.summary}</Text>
          <Text style={styles.assessmentNote}>{assessment.note}</Text>
        </View>
      ) : null}

      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      <Pressable style={styles.detectButton} onPress={onDetect}>
        <Text style={styles.detectButtonText}>Detect Again</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable style={styles.navButton} onPress={onGoHome}>
          <Text style={styles.navButtonText}>Home</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={onGoCapture}>
          <Text style={styles.navButtonText}>Capture</Text>
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
    alignItems: 'center',
  },
  title: {
    alignSelf: 'flex-start',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  thresholdRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdLabel: {
    fontSize: 13,
    color: '#394b59',
    fontWeight: '600',
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#b6c3cc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  thresholdButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewWrap: {
    position: 'relative',
    width: 340,
    height: 220,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f4f4f4',
  },
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff2d55',
    backgroundColor: 'rgba(255, 45, 85, 0.15)',
  },
  boxText: {
    position: 'absolute',
    top: -22,
    left: 0,
    backgroundColor: '#ff2d55',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countText: {
    marginTop: 10,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
  assessmentCard: {
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  assessmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  assessmentLabel: {
    fontWeight: '600',
  },
  assessmentValue: {
    fontWeight: '700',
  },
  status_good: {
    color: '#0a7f36',
  },
  status_average: {
    color: '#8a6200',
  },
  status_bad: {
    color: '#b42318',
  },
  assessmentText: {
    fontSize: 13,
    marginBottom: 2,
  },
  scoreBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e3ebf0',
    marginVertical: 8,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#0f5a8c',
  },
  assessmentNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loader: {
    marginTop: 8,
  },
  detectButton: {
    marginTop: 12,
    width: '100%',
    backgroundColor: '#1f6feb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    width: '100%',
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