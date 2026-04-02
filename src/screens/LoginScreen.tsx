import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const { login, register, authMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const isSupabase = authMode === 'supabase';
  const idLabel = isSupabase ? 'Email' : 'Username';
  const idHint = isSupabase
    ? 'Use the email you will sign in with. It will show in Supabase → Authentication → Users.'
    : 'Choose a username for this device. Data stays in local storage.';

  const onSubmit = async () => {
    if (!identifier.trim()) {
      Alert.alert(`Missing ${idLabel.toLowerCase()}`, `Enter your ${idLabel.toLowerCase()}.`);
      return;
    }
    if (!password) {
      Alert.alert('Missing password', 'Enter your password.');
      return;
    }
    if (mode === 'register' && password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (isSupabase && mode === 'register' && password.length < 6) {
      Alert.alert('Password too short', 'Supabase requires at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(identifier.trim(), password);
      } else {
        await register(identifier.trim(), password);
      }
    } catch (e) {
      Alert.alert('Could not continue', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>LifeOS</Title>
          <Paragraph style={styles.tagline}>
            Your habits, journal, and money — one calm place per person.
          </Paragraph>
        </View>

        <View style={styles.card}>
          {isSupabase && (
            <Text style={styles.modePill}>Signed in with Supabase</Text>
          )}
          <View style={styles.tabs}>
            <Button
              mode={mode === 'login' ? 'contained' : 'text'}
              onPress={() => setMode('login')}
              style={styles.tabBtn}
              disabled={busy}
            >
              Log in
            </Button>
            <Button
              mode={mode === 'register' ? 'contained' : 'text'}
              onPress={() => setMode('register')}
              style={styles.tabBtn}
              disabled={busy}
            >
              New account
            </Button>
          </View>

          <TextInput
            label={idLabel}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={isSupabase ? 'email-address' : 'default'}
            mode="outlined"
            style={styles.input}
            disabled={busy}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            disabled={busy}
          />
          {mode === 'register' && (
            <TextInput
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              disabled={busy}
            />
          )}

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={busy}
            disabled={busy}
            style={styles.submit}
            contentStyle={styles.submitContent}
          >
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>

          <Text style={styles.hint}>{idHint}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 48 : 56,
    paddingBottom: 40,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 20,
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modePill: {
    alignSelf: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#a5b4fc',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  submit: {
    marginTop: 8,
    borderRadius: 10,
  },
  submitContent: {
    paddingVertical: 6,
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
