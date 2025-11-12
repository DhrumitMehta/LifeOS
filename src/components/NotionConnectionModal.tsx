import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Alert } from 'react-native';
import {
  Card,
  Title,
  Text,
  TextInput,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveNotionToken,
  testNotionConnection,
  getBotUser,
} from '../services/notion';

interface NotionConnectionModalProps {
  visible: boolean;
  onConnected: () => void;
  onSkip: () => void;
}

export const NotionConnectionModal: React.FC<NotionConnectionModalProps> = ({
  visible,
  onConnected,
  onSkip,
}) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('notion_integration_token');
      if (storedToken) {
        const isConnected = await testNotionConnection(storedToken);
        if (isConnected) {
          // Already connected, close modal
          onConnected();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter your Notion integration token');
      return;
    }

    setLoading(true);
    try {
      const connected = await testNotionConnection(token);
      
      if (connected) {
        await saveNotionToken(token);
        const botInfo = await getBotUser(token);
        Alert.alert('Success', `Connected to Notion as ${botInfo.name || botInfo.id}!`);
        onConnected();
      } else {
        Alert.alert('Error', 'Failed to connect to Notion. Please check your token.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect to Notion');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return null; // Don't show modal while checking
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onSkip}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Card.Content>
            <View style={styles.header}>
              <Ionicons name="notifications" size={32} color="#6366f1" />
              <Title style={styles.title}>Connect to Notion</Title>
            </View>
            
            <Text style={styles.description}>
              Connect your Notion workspace to see daily highlights and ideas from your second brain on the home screen.
            </Text>

            <TextInput
              label="Notion Integration Token"
              value={token}
              onChangeText={setToken}
              mode="outlined"
              secureTextEntry
              placeholder="secret_..."
              style={styles.input}
              helperText="Get your token from notion.so/my-integrations"
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={onSkip}
                style={[styles.button, styles.skipButton]}
              >
                Skip
              </Button>
              <Button
                mode="contained"
                onPress={handleConnect}
                style={[styles.button, styles.connectButton]}
                loading={loading}
                disabled={loading || !token.trim()}
                icon="link"
              >
                Connect
              </Button>
            </View>

            <Text style={styles.helpText}>
              You can always connect later in Settings
            </Text>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
  },
  skipButton: {
    borderColor: '#9ca3af',
  },
  connectButton: {
    backgroundColor: '#6366f1',
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

