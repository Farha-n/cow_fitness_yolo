import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import CaptureScreen from './src/screens/CaptureScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const SCREEN_HOME = 'home';
const SCREEN_CAPTURE = 'capture';
const SCREEN_RESULTS = 'results';
const SCREEN_HISTORY = 'history';
const BACKEND_URL_STORAGE_KEY = 'cowFitnessApp.backendUrl';

const sanitizeUrl = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\/+$/, '');
};

const isEmulatorOnlyUrl = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized.startsWith('http://10.0.2.2') || normalized.startsWith('https://10.0.2.2');
};

const getConfiguredBackendUrl = () => {
  const extra = Constants.expoConfig?.extra || {};
  const productionUrl = sanitizeUrl(extra.backendUrlProduction || extra.EXPO_PUBLIC_BACKEND_URL_PROD);
  const developmentUrl = sanitizeUrl(
    extra.backendUrlDevelopment || extra.backendUrl || extra.EXPO_PUBLIC_BACKEND_URL,
  );

  if (__DEV__) {
    return developmentUrl || productionUrl;
  }

  return productionUrl || developmentUrl;
};

const resolveDefaultBackendUrl = () => {
  const configuredBackendUrl = getConfiguredBackendUrl();
  if (configuredBackendUrl) {
    return configuredBackendUrl;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : '';
  if (host) {
    return `http://${host}:8000`;
  }

  if (Constants.platform?.android) {
    return 'http://10.0.2.2:8000';
  }

  return 'http://127.0.0.1:8000';
};

export default function App() {
  const configuredBackendUrl = getConfiguredBackendUrl();

  const [backendUrl, setBackendUrl] = useState(resolveDefaultBackendUrl());
  const [backendUrlReady, setBackendUrlReady] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [animalType, setAnimalType] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const [detectionThreshold, setDetectionThreshold] = useState(0.55);
  const [backendHealth, setBackendHealth] = useState({
    status: 'unknown',
    message: 'Not checked yet',
    latencyMs: null,
  });
  const [autoDetect, setAutoDetect] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeScreen, setActiveScreen] = useState(SCREEN_HOME);

  useEffect(() => {
    const restoreBackendUrl = async () => {
      try {
        const storedBackendUrl = await AsyncStorage.getItem(BACKEND_URL_STORAGE_KEY);
        if (storedBackendUrl && storedBackendUrl.trim()) {
          let normalizedStoredBackendUrl = sanitizeUrl(storedBackendUrl);
          if (configuredBackendUrl && isEmulatorOnlyUrl(normalizedStoredBackendUrl)) {
            normalizedStoredBackendUrl = sanitizeUrl(configuredBackendUrl);
          }
          setBackendUrl(normalizedStoredBackendUrl);
          await checkBackendHealth(normalizedStoredBackendUrl);
        } else {
          const defaultUrl = configuredBackendUrl || resolveDefaultBackendUrl();
          await checkBackendHealth(defaultUrl);
        }
      } finally {
        setBackendUrlReady(true);
      }
    };

    restoreBackendUrl();
  }, []);

  useEffect(() => {
    if (!backendUrlReady) {
      return;
    }

    AsyncStorage.setItem(BACKEND_URL_STORAGE_KEY, sanitizeUrl(backendUrl)).catch(() => {});
  }, [backendUrl, backendUrlReady]);

  const checkBackendHealth = async (nextBackendUrl = backendUrl) => {
    const normalizedUrl = sanitizeUrl(nextBackendUrl);
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      setBackendHealth({
        status: 'offline',
        message: 'Invalid backend URL',
        latencyMs: null,
      });
      return;
    }

    const startedAt = Date.now();
    setBackendHealth({ status: 'checking', message: 'Checking API...', latencyMs: null });
    try {
      const response = await fetch(`${normalizedUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }
      const latencyMs = Date.now() - startedAt;
      setBackendHealth({ status: 'online', message: 'API is reachable', latencyMs });
    } catch (error) {
      setBackendHealth({
        status: 'offline',
        message: error?.message || 'Could not reach API',
        latencyMs: null,
      });
    }
  };

  const setPickedAsset = async (asset) => {
    setImageUri(asset.uri);
    setImageSize({ width: asset.width || 1, height: asset.height || 1 });
    setDetections([]);
    setAssessment(null);
    setAnimalType(null);
    setBatchSummary(null);
    setActiveScreen(SCREEN_RESULTS);

    if (autoDetect) {
      await runDetection(asset.uri);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow gallery access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    await setPickedAsset(result.assets[0]);
  };

  const pickMultipleImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow gallery access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const first = result.assets[0];
    setImageUri(first.uri);
    setImageSize({ width: first.width || 1, height: first.height || 1 });
    setDetections([]);
    setAssessment(null);
    setAnimalType(null);
    setBatchSummary(null);
    setActiveScreen(SCREEN_RESULTS);

    const normalizedUrl = sanitizeUrl(backendUrl);
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Use full URL like http://192.168.1.8:8000');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < result.assets.length; i += 1) {
        const asset = result.assets[i];
        formData.append('files', {
          uri: asset.uri,
          name: `photo_${i}.jpg`,
          type: 'image/jpeg',
        });
      }

      const response = await fetch(`${normalizedUrl}/predict-batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Batch request failed (${response.status})`);
      }

      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];
      const firstResult = results[0] || null;

      if (firstResult) {
        setDetections(Array.isArray(firstResult.detections) ? firstResult.detections : []);
        setAssessment(firstResult.assessment || null);
        setAnimalType(firstResult.animal_type || firstResult.species || null);
      }

      const animalTypeCounts = {};
      for (const item of results) {
        const label = item?.animal_type?.label || item?.species?.label || 'unknown';
        animalTypeCounts[label] = (animalTypeCounts[label] || 0) + 1;
      }

      setBatchSummary({
        total: results.length,
        animalTypeCounts,
      });
    } catch (error) {
      Alert.alert('Batch detection failed', error?.message || 'Could not call backend API.');
    } finally {
      setLoading(false);
    }
  };

  const captureImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    await setPickedAsset(result.assets[0]);
  };

  const runDetection = async (sourceUri) => {
    const targetUri = sourceUri || imageUri;
    if (!targetUri) {
      Alert.alert('No image selected', 'Pick an image first.');
      return;
    }

    const normalizedUrl = sanitizeUrl(backendUrl);
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Use full URL like http://192.168.1.100:8000');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: targetUri,
        name: 'cow.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(`${normalizedUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const nextDetections = Array.isArray(data.detections) ? data.detections : [];
      const nextAssessment = data.assessment ?? null;
      const nextAnimalType = data.animal_type ?? data.species ?? null;
      setDetections(nextDetections);
      setAssessment(nextAssessment);
      setAnimalType(nextAnimalType);
      setBatchSummary(null);
      setHistory((previous) => [
        {
          id: Date.now(),
          imageUri: targetUri,
          count: nextDetections.length,
          assessment: nextAssessment,
          animalType: nextAnimalType,
          timestamp: new Date().toLocaleString(),
        },
        ...previous,
      ]);
      setActiveScreen(SCREEN_RESULTS);
    } catch (error) {
      Alert.alert('Detection failed', error?.message || 'Could not call backend API.');
    } finally {
      setLoading(false);
    }
  };

  const openHistoryItem = (item) => {
    setImageUri(item.imageUri);
    setDetections([]);
    setAssessment(item.assessment || null);
    setAnimalType(item.animalType || null);
    setBatchSummary(null);
    setImageSize({ width: 1, height: 1 });
    setActiveScreen(SCREEN_RESULTS);
  };

  const renderScreen = () => {
    if (activeScreen === SCREEN_HOME) {
      return (
        <HomeScreen
          onGoCapture={() => setActiveScreen(SCREEN_CAPTURE)}
          onGoHistory={() => setActiveScreen(SCREEN_HISTORY)}
          backendHealth={backendHealth}
          historyCount={history.length}
        />
      );
    }

    if (activeScreen === SCREEN_CAPTURE) {
      return (
        <CaptureScreen
          backendUrl={backendUrl}
          autoDetect={autoDetect}
          loading={loading}
          backendHealth={backendHealth}
          onChangeBackendUrl={setBackendUrl}
          onChangeAutoDetect={setAutoDetect}
          onCheckBackend={() => checkBackendHealth()}
          onPickImage={pickImage}
          onPickMultipleImages={pickMultipleImages}
          onCaptureImage={captureImage}
          onRunDetection={() => runDetection()}
          onGoHome={() => setActiveScreen(SCREEN_HOME)}
          onGoResults={() => setActiveScreen(SCREEN_RESULTS)}
          onGoHistory={() => setActiveScreen(SCREEN_HISTORY)}
        />
      );
    }

    if (activeScreen === SCREEN_RESULTS) {
      return (
        <ResultsScreen
          imageUri={imageUri}
          imageSize={imageSize}
          detections={detections}
          detectionThreshold={detectionThreshold}
          onChangeDetectionThreshold={setDetectionThreshold}
          assessment={assessment}
          animalType={animalType}
          batchSummary={batchSummary}
          loading={loading}
          onDetect={() => runDetection()}
          onGoCapture={() => setActiveScreen(SCREEN_CAPTURE)}
          onGoHome={() => setActiveScreen(SCREEN_HOME)}
          onGoHistory={() => setActiveScreen(SCREEN_HISTORY)}
        />
      );
    }

    return (
      <HistoryScreen
        history={history}
        onOpenItem={openHistoryItem}
        onGoHome={() => setActiveScreen(SCREEN_HOME)}
        onGoCapture={() => setActiveScreen(SCREEN_CAPTURE)}
        onClearHistory={() => setHistory([])}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});
