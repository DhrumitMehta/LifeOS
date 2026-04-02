import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../types';
import { supabaseDatabase } from '../database/supabaseDatabase';
import { getActiveUserId } from '../services/userSession';

const ProfileScreen = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [principles, setPrinciples] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // Input states for adding new items
  const [newLike, setNewLike] = useState('');
  const [newPrinciple, setNewPrinciple] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const uid = getActiveUserId();
      const loaded = await supabaseDatabase.getProfile();
      if (loaded) {
        setProfile(loaded);
        populateForm(loaded);
      } else {
        const defaultProfile: Profile = {
          id: uid || 'profile_1',
          name: '',
          bio: '',
          likes: [],
          principles: [],
          strengths: [],
          weaknesses: [],
          goals: [],
          interests: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProfile(defaultProfile);
        populateForm(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (profileData: Profile) => {
    setName(profileData.name || '');
    setBio(profileData.bio || '');
    setLikes(profileData.likes || []);
    setPrinciples(profileData.principles || []);
    setStrengths(profileData.strengths || []);
    setWeaknesses(profileData.weaknesses || []);
    setGoals(profileData.goals || []);
    setInterests(profileData.interests || []);
  };

  const saveProfile = async () => {
    try {
      const uid = getActiveUserId();
      const updatedProfile: Profile = {
        id: uid || profile?.id || 'profile_1',
        name: name.trim(),
        bio: bio.trim(),
        likes: likes.filter(item => item.trim() !== ''),
        principles: principles.filter(item => item.trim() !== ''),
        strengths: strengths.filter(item => item.trim() !== ''),
        weaknesses: weaknesses.filter(item => item.trim() !== ''),
        goals: goals.filter(item => item.trim() !== ''),
        interests: interests.filter(item => item.trim() !== ''),
        createdAt: profile?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await supabaseDatabase.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      populateForm(profile);
    }
    setIsEditing(false);
  };

  const addItem = (
    item: string,
    setItem: (value: string) => void,
    list: string[],
    setList: (list: string[]) => void
  ) => {
    if (item.trim()) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const removeItem = (index: number, list: string[], setList: (list: string[]) => void) => {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
  };

  const renderSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    items: string[],
    setItems: (items: string[]) => void,
    newItem: string,
    setNewItem: (value: string) => void,
    placeholder: string
  ) => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={20} color="#6366f1" />
          <Title style={styles.sectionTitle}>{title}</Title>
        </View>
        {isEditing ? (
          <>
            <View style={styles.chipContainer}>
              {items.map((item, index) => (
                <Chip
                  key={index}
                  onClose={() => removeItem(index, items, setItems)}
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {item}
                </Chip>
              ))}
            </View>
            <View style={styles.addItemContainer}>
              <TextInput
                value={newItem}
                onChangeText={setNewItem}
                placeholder={placeholder}
                mode="outlined"
                style={styles.addItemInput}
                onSubmitEditing={() => addItem(newItem, setNewItem, items, setItems)}
              />
              <IconButton
                icon="add-circle"
                iconColor="#6366f1"
                size={24}
                onPress={() => addItem(newItem, setNewItem, items, setItems)}
              />
            </View>
          </>
        ) : (
          <View style={styles.chipContainer}>
            {items.length > 0 ? (
              items.map((item, index) => (
                <Chip key={index} style={styles.chip} textStyle={styles.chipText}>
                  {item}
                </Chip>
              ))
            ) : (
              <Text style={styles.emptyText}>No items added yet</Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={48} color="#6366f1" />
            </View>
            {!isEditing ? (
              <View style={styles.headerActions}>
                <IconButton
                  icon="pencil"
                  iconColor="#ffffff"
                  size={24}
                  onPress={() => setIsEditing(true)}
                />
              </View>
            ) : (
              <View style={styles.headerActions}>
                <IconButton
                  icon="check"
                  iconColor="#ffffff"
                  size={24}
                  onPress={saveProfile}
                />
                <IconButton
                  icon="close"
                  iconColor="#ffffff"
                  size={24}
                  onPress={handleCancel}
                />
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Name and Bio */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Basic Information</Title>
          {isEditing ? (
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                placeholder="Your name"
              />
              <TextInput
                label="Bio"
                value={bio}
                onChangeText={setBio}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
                placeholder="Tell us about yourself..."
              />
            </>
          ) : (
            <>
              <Text style={styles.nameText}>{name || 'Not set'}</Text>
              <Text style={styles.bioText}>{bio || 'No bio added yet'}</Text>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Likes */}
      {renderSection(
        'Things I Like',
        'heart',
        likes,
        setLikes,
        newLike,
        setNewLike,
        'Add something you like...'
      )}

      {/* Principles */}
      {renderSection(
        'My Principles',
        'shield-checkmark',
        principles,
        setPrinciples,
        newPrinciple,
        setNewPrinciple,
        'Add a principle or value...'
      )}

      {/* Strengths */}
      {renderSection(
        'My Strengths',
        'trending-up',
        strengths,
        setStrengths,
        newStrength,
        setNewStrength,
        'Add a strength...'
      )}

      {/* Weaknesses */}
      {renderSection(
        'Areas for Improvement',
        'construct',
        weaknesses,
        setWeaknesses,
        newWeakness,
        setNewWeakness,
        'Add an area to work on...'
      )}

      {/* Goals */}
      {renderSection(
        'My Goals',
        'flag',
        goals,
        setGoals,
        newGoal,
        setNewGoal,
        'Add a goal...'
      )}

      {/* Interests */}
      {renderSection(
        'Interests & Hobbies',
        'star',
        interests,
        setInterests,
        newInterest,
        setNewInterest,
        'Add an interest...'
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#6366f1',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1f2937',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
    backgroundColor: '#e0e7ff',
  },
  chipText: {
    color: '#6366f1',
    fontSize: 13,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default ProfileScreen;

