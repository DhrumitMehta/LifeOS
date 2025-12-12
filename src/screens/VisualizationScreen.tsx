import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  IconButton,
  SegmentedButtons,
  Divider,
  Checkbox,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Audio, Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pre-loaded relaxing music tracks (using free/public domain music)
const MUSIC_TRACKS = [
  {
    id: '1',
    title: 'Nature Sounds - Forest',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    icon: 'leaf-outline',
  },
  {
    id: '2',
    title: 'Ocean Waves',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    icon: 'water-outline',
  },
  {
    id: '3',
    title: 'Rain Sounds',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    icon: 'rainy-outline',
  },
  {
    id: '4',
    title: 'Meditation Music',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    icon: 'musical-notes-outline',
  },
  {
    id: '5',
    title: 'Peaceful Piano',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    icon: 'piano-outline',
  },
];

// Pre-loaded relaxing videos (using sample videos - replace with your own)
const VIDEO_TRACKS = [
  {
    id: '1',
    title: 'Nature Scenery',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: '🌲',
  },
  {
    id: '2',
    title: 'Ocean View',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: '🌊',
  },
  {
    id: '3',
    title: 'Mountain Landscape',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: '⛰️',
  },
];

// Types for custom tracks
type CustomMusicTrack = {
  id: string;
  title: string;
  uri: string;
  icon: string;
  source: 'device' | 'youtube' | 'url';
  youtubeUrl?: string;
};

type CustomVideoTrack = {
  id: string;
  title: string;
  uri: string;
  thumbnail: string;
  source: 'device' | 'youtube' | 'url';
  youtubeUrl?: string;
};

const STORAGE_KEYS = {
  ENABLED_MUSIC_TRACKS: 'visualization_enabled_music_tracks',
  ENABLED_VIDEO_TRACKS: 'visualization_enabled_video_tracks',
  CUSTOM_MUSIC_TRACKS: 'visualization_custom_music_tracks',
  CUSTOM_VIDEO_TRACKS: 'visualization_custom_video_tracks',
  DELETED_MUSIC_TRACKS: 'visualization_deleted_music_tracks',
  DELETED_VIDEO_TRACKS: 'visualization_deleted_video_tracks',
};

const VisualizationScreen = () => {
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const beepSoundRef = useRef<Audio.Sound | null>(null);

  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentMusicTrack, setCurrentMusicTrack] = useState<(typeof MUSIC_TRACKS[0] | CustomMusicTrack)>(MUSIC_TRACKS[0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);

  // Video state
  const [video, setVideo] = useState<Video.Video | null>(null);
  const [currentVideoTrack, setCurrentVideoTrack] = useState<(typeof VIDEO_TRACKS[0] | CustomVideoTrack)>(VIDEO_TRACKS[0]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  // Track selection state
  const [enabledMusicTracks, setEnabledMusicTracks] = useState<Set<string>>(
    new Set(MUSIC_TRACKS.map(t => t.id))
  );
  const [enabledVideoTracks, setEnabledVideoTracks] = useState<Set<string>>(
    new Set(VIDEO_TRACKS.map(t => t.id))
  );
  const [showMusicTrackSelection, setShowMusicTrackSelection] = useState(false);
  const [showVideoTrackSelection, setShowVideoTrackSelection] = useState(false);
  
  // Custom tracks state
  const [customMusicTracks, setCustomMusicTracks] = useState<CustomMusicTrack[]>([]);
  const [customVideoTracks, setCustomVideoTracks] = useState<CustomVideoTrack[]>([]);
  
  // Deleted tracks state (for default tracks)
  const [deletedMusicTracks, setDeletedMusicTracks] = useState<Set<string>>(new Set());
  const [deletedVideoTracks, setDeletedVideoTracks] = useState<Set<string>>(new Set());
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [newMusicTitle, setNewMusicTitle] = useState('');
  const [newMusicUrl, setNewMusicUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
    loadCustomTracks();
    loadDeletedTracks();
    loadBeepSound();
  }, []);

  // Load preferences from AsyncStorage
  const loadPreferences = async () => {
    try {
      const musicTracksJson = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_MUSIC_TRACKS);
      const videoTracksJson = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_VIDEO_TRACKS);
      
      if (musicTracksJson) {
        const tracks = JSON.parse(musicTracksJson);
        setEnabledMusicTracks(new Set(tracks));
        // Set current track to first enabled track
        const firstEnabled = MUSIC_TRACKS.find(t => tracks.includes(t.id));
        if (firstEnabled) {
          setCurrentMusicTrack(firstEnabled);
        }
      }
      
      if (videoTracksJson) {
        const tracks = JSON.parse(videoTracksJson);
        setEnabledVideoTracks(new Set(tracks));
        // Set current track to first enabled track
        const firstEnabled = VIDEO_TRACKS.find(t => tracks.includes(t.id));
        if (firstEnabled) {
          setCurrentVideoTrack(firstEnabled);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Load custom tracks from AsyncStorage
  const loadCustomTracks = async () => {
    try {
      const musicTracksJson = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_MUSIC_TRACKS);
      const videoTracksJson = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_VIDEO_TRACKS);
      
      if (musicTracksJson) {
        const tracks = JSON.parse(musicTracksJson);
        setCustomMusicTracks(tracks);
        // Add custom tracks to enabled set
        tracks.forEach((track: CustomMusicTrack) => {
          setEnabledMusicTracks(prev => new Set(prev).add(track.id));
        });
      }
      
      if (videoTracksJson) {
        const tracks = JSON.parse(videoTracksJson);
        setCustomVideoTracks(tracks);
        // Add custom tracks to enabled set
        tracks.forEach((track: CustomVideoTrack) => {
          setEnabledVideoTracks(prev => new Set(prev).add(track.id));
        });
      }
    } catch (error) {
      console.error('Error loading custom tracks:', error);
    }
  };

  // Save custom tracks to AsyncStorage
  const saveCustomTracks = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_MUSIC_TRACKS, JSON.stringify(customMusicTracks));
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_VIDEO_TRACKS, JSON.stringify(customVideoTracks));
    } catch (error) {
      console.error('Error saving custom tracks:', error);
    }
  };

  // Load deleted tracks from AsyncStorage
  const loadDeletedTracks = async () => {
    try {
      const musicTracksJson = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_MUSIC_TRACKS);
      const videoTracksJson = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_VIDEO_TRACKS);
      
      if (musicTracksJson) {
        const deleted = JSON.parse(musicTracksJson);
        setDeletedMusicTracks(new Set(deleted));
        // Remove deleted tracks from enabled set
        deleted.forEach((trackId: string) => {
          setEnabledMusicTracks(prev => {
            const newSet = new Set(prev);
            newSet.delete(trackId);
            return newSet;
          });
        });
      }
      
      if (videoTracksJson) {
        const deleted = JSON.parse(videoTracksJson);
        setDeletedVideoTracks(new Set(deleted));
        // Remove deleted tracks from enabled set
        deleted.forEach((trackId: string) => {
          setEnabledVideoTracks(prev => {
            const newSet = new Set(prev);
            newSet.delete(trackId);
            return newSet;
          });
        });
      }
    } catch (error) {
      console.error('Error loading deleted tracks:', error);
    }
  };

  // Save deleted tracks to AsyncStorage
  const saveDeletedTracks = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DELETED_MUSIC_TRACKS, JSON.stringify(Array.from(deletedMusicTracks)));
      await AsyncStorage.setItem(STORAGE_KEYS.DELETED_VIDEO_TRACKS, JSON.stringify(Array.from(deletedVideoTracks)));
    } catch (error) {
      console.error('Error saving deleted tracks:', error);
    }
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url: string): boolean => {
    return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);
  };

  // Extract YouTube video ID
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Add music track from device
  const addMusicFromDevice = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newTrack: CustomMusicTrack = {
          id: `custom_music_${Date.now()}`,
          title: asset.name || 'Custom Music',
          uri: asset.uri,
          icon: 'musical-notes-outline',
          source: 'device',
        };
        
        const updated = [...customMusicTracks, newTrack];
        setCustomMusicTracks(updated);
        setEnabledMusicTracks(prev => new Set(prev).add(newTrack.id));
        await saveCustomTracks();
        Alert.alert('Success', 'Music track added from device!');
        setShowAddMusicModal(false);
      }
    } catch (error) {
      console.error('Error picking music file:', error);
      Alert.alert('Error', `Failed to pick music file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add music track from YouTube/URL
  const addMusicFromUrl = async () => {
    if (!newMusicTitle.trim() || !newMusicUrl.trim()) {
      Alert.alert('Error', 'Please enter both title and URL.');
      return;
    }

    const isYouTube = isYouTubeUrl(newMusicUrl);
    const youtubeId = isYouTube ? extractYouTubeId(newMusicUrl) : null;
    
    // For YouTube, we'll store the YouTube URL
    // Note: Playing YouTube audio directly requires a backend service or library
    // For now, we'll store the URL and the user can use it with a YouTube player
    const newTrack: CustomMusicTrack = {
      id: `custom_music_${Date.now()}`,
      title: newMusicTitle,
      uri: isYouTube ? `https://www.youtube.com/watch?v=${youtubeId}` : newMusicUrl,
      icon: isYouTube ? 'logo-youtube' : 'link-outline',
      source: isYouTube ? 'youtube' : 'url',
      youtubeUrl: isYouTube ? newMusicUrl : undefined,
    };

    const updated = [...customMusicTracks, newTrack];
    setCustomMusicTracks(updated);
    setEnabledMusicTracks(prev => new Set(prev).add(newTrack.id));
    await saveCustomTracks();
    
    Alert.alert(
      'Success', 
      isYouTube 
        ? 'YouTube music added! Note: YouTube audio playback may require additional setup.'
        : 'Music URL added!'
    );
    
    setNewMusicTitle('');
    setNewMusicUrl('');
    setShowAddMusicModal(false);
  };

  // Add video track from device
  const addVideoFromDevice = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newTrack: CustomVideoTrack = {
          id: `custom_video_${Date.now()}`,
          title: asset.name || 'Custom Video',
          uri: asset.uri,
          thumbnail: '🎬',
          source: 'device',
        };
        
        const updated = [...customVideoTracks, newTrack];
        setCustomVideoTracks(updated);
        setEnabledVideoTracks(prev => new Set(prev).add(newTrack.id));
        await saveCustomTracks();
        Alert.alert('Success', 'Video track added from device!');
        setShowAddVideoModal(false);
      }
    } catch (error) {
      console.error('Error picking video file:', error);
      Alert.alert('Error', `Failed to pick video file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add video track from YouTube/URL
  const addVideoFromUrl = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      Alert.alert('Error', 'Please enter both title and URL.');
      return;
    }

    const isYouTube = isYouTubeUrl(newVideoUrl);
    const youtubeId = isYouTube ? extractYouTubeId(newVideoUrl) : null;
    
    const newTrack: CustomVideoTrack = {
      id: `custom_video_${Date.now()}`,
      title: newVideoTitle,
      uri: isYouTube ? `https://www.youtube.com/watch?v=${youtubeId}` : newVideoUrl,
      thumbnail: isYouTube ? '▶️' : '🎬',
      source: isYouTube ? 'youtube' : 'url',
      youtubeUrl: isYouTube ? newVideoUrl : undefined,
    };

    const updated = [...customVideoTracks, newTrack];
    setCustomVideoTracks(updated);
    setEnabledVideoTracks(prev => new Set(prev).add(newTrack.id));
    await saveCustomTracks();
    
    Alert.alert(
      'Success', 
      isYouTube 
        ? 'YouTube video added! Note: YouTube videos may require a YouTube player library.'
        : 'Video URL added!'
    );
    
    setNewVideoTitle('');
    setNewVideoUrl('');
    setShowAddVideoModal(false);
  };

  // Delete track (works for both default and custom tracks)
  const deleteMusicTrack = async (trackId: string) => {
    // Check if it's a custom track
    const isCustomTrack = customMusicTracks.some(t => t.id === trackId);
    
    let newDeletedSet = deletedMusicTracks;
    
    if (isCustomTrack) {
      // Delete custom track
      const updated = customMusicTracks.filter(t => t.id !== trackId);
      setCustomMusicTracks(updated);
      await saveCustomTracks();
    } else {
      // Delete default track (mark as deleted)
      newDeletedSet = new Set(deletedMusicTracks);
      newDeletedSet.add(trackId);
      setDeletedMusicTracks(newDeletedSet);
      await saveDeletedTracks();
    }
    
    // Remove from enabled set
    setEnabledMusicTracks(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    
    // If it's the current track, switch to first available
    if (currentMusicTrack.id === trackId) {
      // Get available tracks (excluding the one we just deleted)
      const defaultTracks = MUSIC_TRACKS.filter(
        t => enabledMusicTracks.has(t.id) && !newDeletedSet.has(t.id) && t.id !== trackId
      );
      const customTracks = customMusicTracks.filter(
        t => enabledMusicTracks.has(t.id) && t.id !== trackId
      );
      const availableTracks = [...defaultTracks, ...customTracks];
      
      if (availableTracks.length > 0) {
        await handleChangeMusicTrack(availableTracks[0]);
      } else {
        // No tracks available, reset to first default track that's not deleted
        const firstAvailable = MUSIC_TRACKS.find(t => !newDeletedSet.has(t.id));
        if (firstAvailable) {
          setCurrentMusicTrack(firstAvailable);
        }
      }
    }
    
    Alert.alert('Success', 'Track deleted!');
  };

  const deleteVideoTrack = async (trackId: string) => {
    // Check if it's a custom track
    const isCustomTrack = customVideoTracks.some(t => t.id === trackId);
    
    let newDeletedSet = deletedVideoTracks;
    
    if (isCustomTrack) {
      // Delete custom track
      const updated = customVideoTracks.filter(t => t.id !== trackId);
      setCustomVideoTracks(updated);
      await saveCustomTracks();
    } else {
      // Delete default track (mark as deleted)
      newDeletedSet = new Set(deletedVideoTracks);
      newDeletedSet.add(trackId);
      setDeletedVideoTracks(newDeletedSet);
      await saveDeletedTracks();
    }
    
    // Remove from enabled set
    setEnabledVideoTracks(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    
    // If it's the current track, switch to first available
    if (currentVideoTrack.id === trackId) {
      // Get available tracks (excluding the one we just deleted)
      const defaultTracks = VIDEO_TRACKS.filter(
        t => enabledVideoTracks.has(t.id) && !newDeletedSet.has(t.id) && t.id !== trackId
      );
      const customTracks = customVideoTracks.filter(
        t => enabledVideoTracks.has(t.id) && t.id !== trackId
      );
      const availableTracks = [...defaultTracks, ...customTracks];
      
      if (availableTracks.length > 0) {
        await handleChangeVideoTrack(availableTracks[0]);
      } else {
        // No tracks available, reset to first default track that's not deleted
        const firstAvailable = VIDEO_TRACKS.find(t => !newDeletedSet.has(t.id));
        if (firstAvailable) {
          setCurrentVideoTrack(firstAvailable);
        }
      }
    }
    
    Alert.alert('Success', 'Track deleted!');
  };

  // Load beep sound
  const loadBeepSound = async () => {
    try {
      // Create a simple beep using a data URI (sine wave beep)
      // For a real beep, you'd use an actual audio file, but we'll create a tone programmatically
      const beepUri = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+P';
      // Actually, let's use a simple approach - we'll generate a beep using expo-av
      // For now, we'll use a placeholder that will work
    } catch (error) {
      console.error('Error loading beep sound:', error);
    }
  };

  // Play beep sound
  const playBeepSound = async () => {
    try {
      // Clean up any existing beep sound
      if (beepSoundRef.current) {
        try {
          await beepSoundRef.current.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
        beepSoundRef.current = null;
      }
      
      // Use a reliable beep/alarm sound
      // Using a short notification beep sound that should work reliably
      // You can replace this with your own beep sound file URL
      const beepUri = 'https://assets.mixkit.co/active_storage/sfx/1023/1023-preview.mp3';
      
      // Play beep sound multiple times for better alert
      const playBeep = async (times: number = 3) => {
        for (let i = 0; i < times; i++) {
          try {
            const { sound: beepSound } = await Audio.Sound.createAsync(
              { uri: beepUri },
              { shouldPlay: true, volume: 1.0, isLooping: false }
            );
            
            // Wait for sound to finish before playing next
            await new Promise<void>((resolve) => {
              beepSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  beepSound.unloadAsync().catch(() => {});
                  resolve();
                }
              });
            });
            
            // Small delay between beeps
            if (i < times - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (error) {
            console.error(`Error playing beep ${i + 1}:`, error);
          }
        }
      };
      
      // Play 3 beeps
      await playBeep(3);
    } catch (error) {
      console.error('Error playing beep:', error);
      // Fallback: Try a simpler beep
      try {
        // Try alternative beep URL
        const { sound: beepSound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
          { shouldPlay: true, volume: 0.9, isLooping: false }
        );
        beepSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            beepSound.unloadAsync().catch(() => {});
          }
        });
      } catch (fallbackError) {
        console.error('Fallback beep also failed:', fallbackError);
      }
    }
  };

  // Save preferences to AsyncStorage
  const savePreferences = async (musicTracks: Set<string>, videoTracks: Set<string>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_MUSIC_TRACKS, JSON.stringify(Array.from(musicTracks)));
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_VIDEO_TRACKS, JSON.stringify(Array.from(videoTracks)));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Toggle music track
  const toggleMusicTrack = async (trackId: string) => {
    const newSet = new Set(enabledMusicTracks);
    if (newSet.has(trackId)) {
      newSet.delete(trackId);
      // If we're removing the current track, switch to first available
      if (currentMusicTrack.id === trackId) {
        const firstEnabled = MUSIC_TRACKS.find(t => t.id !== trackId && newSet.has(t.id));
        if (firstEnabled) {
          setCurrentMusicTrack(firstEnabled);
          if (sound) {
            await handleChangeMusicTrack(firstEnabled);
          }
        }
      }
    } else {
      newSet.add(trackId);
    }
    setEnabledMusicTracks(newSet);
    savePreferences(newSet, enabledVideoTracks);
  };

  // Toggle video track
  const toggleVideoTrack = async (trackId: string) => {
    const newSet = new Set(enabledVideoTracks);
    if (newSet.has(trackId)) {
      newSet.delete(trackId);
      // If we're removing the current track, switch to first available
      if (currentVideoTrack.id === trackId) {
        const firstEnabled = VIDEO_TRACKS.find(t => t.id !== trackId && newSet.has(t.id));
        if (firstEnabled) {
          setCurrentVideoTrack(firstEnabled);
          if (video) {
            await handleChangeVideoTrack(firstEnabled);
          }
        }
      }
    } else {
      newSet.add(trackId);
    }
    setEnabledVideoTracks(newSet);
    savePreferences(enabledMusicTracks, newSet);
  };

  // Get enabled tracks (including custom tracks, excluding deleted)
  const getEnabledMusicTracks = () => {
    const defaultTracks = MUSIC_TRACKS.filter(
      t => enabledMusicTracks.has(t.id) && !deletedMusicTracks.has(t.id)
    );
    const customTracks = customMusicTracks.filter(t => enabledMusicTracks.has(t.id));
    return [...defaultTracks, ...customTracks];
  };
  
  const getEnabledVideoTracks = () => {
    const defaultTracks = VIDEO_TRACKS.filter(
      t => enabledVideoTracks.has(t.id) && !deletedVideoTracks.has(t.id)
    );
    const customTracks = customVideoTracks.filter(t => enabledVideoTracks.has(t.id));
    return [...defaultTracks, ...customTracks];
  };

  // Get all tracks (for management, excluding deleted)
  const getAllMusicTracks = () => {
    const defaultTracks = MUSIC_TRACKS.filter(t => !deletedMusicTracks.has(t.id));
    return [...defaultTracks, ...customMusicTracks];
  };
  
  const getAllVideoTracks = () => {
    const defaultTracks = VIDEO_TRACKS.filter(t => !deletedVideoTracks.has(t.id));
    return [...defaultTracks, ...customVideoTracks];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (video) {
        video.unloadAsync();
      }
      if (beepSoundRef.current) {
        beepSoundRef.current.unloadAsync();
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Play beep sound
            playBeepSound();
            Alert.alert('Timer Complete!', 'Your timer has finished.');
            if (sound) {
              sound.stopAsync();
              setIsMusicPlaying(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining, sound]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer controls
  const handleStartTimer = () => {
    const minutes = parseInt(timerMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of minutes.');
      return;
    }
    setTimeRemaining(minutes * 60);
    setIsTimerRunning(true);
  };

  // Quick start timer with preset minutes
  const handleQuickStartTimer = (minutes: number) => {
    setTimerMinutes(minutes.toString());
    setTimeRemaining(minutes * 60);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    if (timeRemaining > 0) {
      setIsTimerRunning(true);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(0);
  };

  // Audio controls
  const loadAudio = async (track: typeof MUSIC_TRACKS[0] | CustomMusicTrack) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: false, volume: musicVolume, isLooping: true }
      );
      setSound(newSound);
      setCurrentMusicTrack(track);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Could not load audio track. Please try another one or check your internet connection.');
    }
  };

  const handlePlayMusic = async () => {
    try {
      // Check if it's a YouTube track
      const customTrack = customMusicTracks.find(t => t.id === currentMusicTrack.id);
      const isYouTube = customTrack?.source === 'youtube' || 
                       (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
      
      if (isYouTube) {
        // For YouTube, we need to use the video player (YouTube doesn't allow direct audio extraction)
        // Extract YouTube video ID
        const videoId = customTrack?.youtubeUrl 
          ? extractYouTubeId(customTrack.youtubeUrl)
          : extractYouTubeId(currentMusicTrack.uri);
        
        if (videoId) {
          // Show YouTube player for music (since we can't extract audio directly)
          setYoutubeVideoId(videoId);
          setYoutubePlaying(true);
          setIsMusicPlaying(true);
          Alert.alert(
            'YouTube Music',
            'YouTube content will play as video (YouTube does not allow direct audio extraction). The video player will appear below.'
          );
          return;
        } else {
          Alert.alert('Error', 'Could not extract YouTube video ID from URL.');
          return;
        }
      }

      // Regular audio playback
      let soundToPlay = sound;
      if (!soundToPlay) {
        // Load audio first
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentMusicTrack.uri },
          { shouldPlay: false, volume: musicVolume, isLooping: true }
        );
        setSound(newSound);
        setCurrentMusicTrack(currentMusicTrack);
        soundToPlay = newSound;
      }
      if (soundToPlay) {
        await soundToPlay.playAsync();
        setIsMusicPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio. Please try selecting a different track or check the file/URL.');
    }
  };

  const handlePauseMusic = async () => {
    try {
      // Check if it's YouTube
      const customTrack = customMusicTracks.find(t => t.id === currentMusicTrack.id);
      const isYouTube = customTrack?.source === 'youtube' || 
                       (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
      
      if (isYouTube && youtubeVideoId) {
        setYoutubePlaying(false);
        setIsMusicPlaying(false);
        return;
      }
      
      if (sound) {
        await sound.pauseAsync();
        setIsMusicPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const handleStopMusic = async () => {
    try {
      // Check if it's YouTube
      const customTrack = customMusicTracks.find(t => t.id === currentMusicTrack.id);
      const isYouTube = customTrack?.source === 'youtube' || 
                       (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
      
      if (isYouTube && youtubeVideoId) {
        setYoutubeVideoId(null);
        setYoutubePlaying(false);
        setIsMusicPlaying(false);
        return;
      }
      
      if (sound) {
        await sound.stopAsync();
        setIsMusicPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handleChangeMusicTrack = async (track: typeof MUSIC_TRACKS[0] | CustomMusicTrack) => {
    const wasPlaying = isMusicPlaying;
    
    // Stop current audio (YouTube or regular)
    if (wasPlaying) {
      if (youtubeVideoId) {
        setYoutubePlaying(false);
        setYoutubeVideoId(null);
      }
      if (sound) {
        await sound.stopAsync();
      }
      setIsMusicPlaying(false);
    }
    
    // Clear YouTube state
    setYoutubeVideoId(null);
    setYoutubePlaying(false);
    
    // Check if new track is YouTube
    const customTrack = customMusicTracks.find(t => t.id === track.id);
    const isYouTube = customTrack?.source === 'youtube' || 
                     (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
    
    if (isYouTube) {
      // For YouTube, just set the track - playback will be handled by handlePlayMusic
      setCurrentMusicTrack(track);
      if (wasPlaying) {
        // Extract video ID and play
        const videoId = customTrack?.youtubeUrl 
          ? extractYouTubeId(customTrack.youtubeUrl)
          : extractYouTubeId(track.uri);
        if (videoId) {
          setYoutubeVideoId(videoId);
          setYoutubePlaying(true);
          setIsMusicPlaying(true);
        }
      }
      return;
    }
    
    // Load new regular audio
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: track.uri },
      { shouldPlay: false, volume: musicVolume, isLooping: true }
    );
    setSound(newSound);
    setCurrentMusicTrack(track);
    
    // Play if it was playing before
    if (wasPlaying) {
      await newSound.playAsync();
      setIsMusicPlaying(true);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    setMusicVolume(volume);
    if (sound) {
      await sound.setVolumeAsync(volume);
    }
  };

  // Video controls
  const loadVideo = async (track: typeof VIDEO_TRACKS[0] | CustomVideoTrack) => {
    try {
      if (video) {
        await video.unloadAsync();
        setVideo(null);
      }

      const { video: newVideo } = await Video.createAsync(
        { uri: track.uri },
        { shouldPlay: false, isLooping: true, resizeMode: ResizeMode.COVER }
      );
      setVideo(newVideo);
      setCurrentVideoTrack(track);
    } catch (error) {
      console.error('Error loading video:', error);
      Alert.alert('Error', 'Could not load video. Please try another one or check your internet connection.');
    }
  };

  const handlePlayVideo = async () => {
    try {
      // Check if it's a YouTube track
      const customTrack = customVideoTracks.find(t => t.id === currentVideoTrack.id);
      const isYouTube = customTrack?.source === 'youtube' || 
                       (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
      
      if (isYouTube) {
        // Extract YouTube video ID
        const videoId = customTrack?.youtubeUrl 
          ? extractYouTubeId(customTrack.youtubeUrl)
          : extractYouTubeId(currentVideoTrack.uri);
        
        if (videoId) {
          setYoutubeVideoId(videoId);
          setYoutubePlaying(true);
          setShowVideo(true);
          setIsVideoPlaying(true);
          return;
        } else {
          Alert.alert('Error', 'Could not extract YouTube video ID from URL.');
          return;
        }
      }

      // Regular video playback
      let videoToPlay = video;
      if (!videoToPlay) {
        // Load video first
        if (video) {
          await video.unloadAsync();
        }
        const { video: newVideo } = await Video.createAsync(
          { uri: currentVideoTrack.uri },
          { shouldPlay: false, isLooping: true, resizeMode: ResizeMode.COVER }
        );
        setVideo(newVideo);
        setCurrentVideoTrack(currentVideoTrack);
        videoToPlay = newVideo;
      }
      if (videoToPlay) {
        await videoToPlay.playAsync();
        setIsVideoPlaying(true);
        setShowVideo(true);
      }
    } catch (error) {
      console.error('Error playing video:', error);
      Alert.alert('Error', 'Could not play video. Please try selecting a different video or check the file/URL.');
    }
  };

  const handlePauseVideo = async () => {
    try {
      // Check if it's YouTube
      if (youtubeVideoId) {
        setYoutubePlaying(false);
        setIsVideoPlaying(false);
        return;
      }
      
      if (video) {
        await video.pauseAsync();
        setIsVideoPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing video:', error);
    }
  };

  const handleStopVideo = async () => {
    try {
      // Check if it's YouTube
      if (youtubeVideoId) {
        setYoutubePlaying(false);
        setYoutubeVideoId(null);
        setIsVideoPlaying(false);
        setShowVideo(false);
        return;
      }
      
      if (video) {
        await video.stopAsync();
        setIsVideoPlaying(false);
        setShowVideo(false);
      }
    } catch (error) {
      console.error('Error stopping video:', error);
    }
  };

  const handleChangeVideoTrack = async (track: typeof VIDEO_TRACKS[0] | CustomVideoTrack) => {
    const wasPlaying = isVideoPlaying;
    
    // Stop current video (YouTube or regular)
    if (wasPlaying) {
      if (youtubeVideoId) {
        setYoutubePlaying(false);
        setYoutubeVideoId(null);
      }
      if (video) {
        await video.stopAsync();
      }
      setIsVideoPlaying(false);
      setShowVideo(false);
    }
    
    // Clear YouTube state
    setYoutubeVideoId(null);
    setYoutubePlaying(false);
    
    // Check if new track is YouTube
    const customTrack = customVideoTracks.find(t => t.id === track.id);
    const isYouTube = customTrack?.source === 'youtube' || 
                     (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
    
    if (isYouTube) {
      // For YouTube, just set the track - playback will be handled by handlePlayVideo
      setCurrentVideoTrack(track);
      if (wasPlaying) {
        // Extract video ID and play
        const videoId = customTrack?.youtubeUrl 
          ? extractYouTubeId(customTrack.youtubeUrl)
          : extractYouTubeId(track.uri);
        if (videoId) {
          setYoutubeVideoId(videoId);
          setYoutubePlaying(true);
          setShowVideo(true);
          setIsVideoPlaying(true);
        }
      }
      return;
    }
    
    // Load new regular video
    if (video) {
      await video.unloadAsync();
    }
    const { video: newVideo } = await Video.createAsync(
      { uri: track.uri },
      { shouldPlay: false, isLooping: true, resizeMode: ResizeMode.COVER }
    );
    setVideo(newVideo);
    setCurrentVideoTrack(track);
    
    // Play if it was playing before
    if (wasPlaying) {
      await newVideo.playAsync();
      setIsVideoPlaying(true);
      setShowVideo(true);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      {/* Timer Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="timer-outline" size={24} color="#6366f1" />
            <Title style={styles.sectionTitle}>Meditation Timer</Title>
          </View>
          
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>
              {timeRemaining > 0 ? formatTime(timeRemaining) : '00:00'}
            </Text>
          </View>

          {!isTimerRunning && timeRemaining === 0 && (
            <>
              <Text style={styles.presetTimersTitle}>Quick Start:</Text>
              <View style={styles.presetTimersContainer}>
                <Button
                  mode="outlined"
                  onPress={() => handleQuickStartTimer(5)}
                  style={styles.presetTimerButton}
                  icon="timer"
                >
                  Visualization (5 min)
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleQuickStartTimer(2)}
                  style={styles.presetTimerButton}
                  icon="heart"
                >
                  Gratitude (2 min)
                </Button>
              </View>
              
              <Divider style={styles.timerDivider} />
              
              <Text style={styles.customTimerTitle}>Or set custom time:</Text>
              <View style={styles.timerInputContainer}>
                <TextInput
                  label="Minutes"
                  value={timerMinutes}
                  onChangeText={setTimerMinutes}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.timerInput}
                />
                <Button
                  mode="contained"
                  onPress={handleStartTimer}
                  style={styles.timerButton}
                  icon="play"
                >
                  Start Timer
                </Button>
              </View>
            </>
          )}

          {isTimerRunning && (
            <View style={styles.timerControls}>
              <Button
                mode="outlined"
                onPress={handlePauseTimer}
                style={styles.timerControlButton}
                icon="pause"
              >
                Pause
              </Button>
              <Button
                mode="outlined"
                onPress={handleResetTimer}
                style={styles.timerControlButton}
                icon="stop"
                textColor="#ef4444"
              >
                Reset
              </Button>
            </View>
          )}

          {!isTimerRunning && timeRemaining > 0 && (
            <View style={styles.timerControls}>
              <Button
                mode="contained"
                onPress={handleResumeTimer}
                style={styles.timerButton}
                icon="play"
              >
                Resume
              </Button>
              <Button
                mode="outlined"
                onPress={handleResetTimer}
                style={styles.timerControlButton}
                icon="refresh"
              >
                Reset
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Music Player Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="musical-notes-outline" size={24} color="#6366f1" />
            <Title style={styles.sectionTitle}>Relaxing Music</Title>
          </View>

          <Text style={styles.currentTrackText}>
            Current: {currentMusicTrack.title}
          </Text>

          {/* YouTube Player for Music (when playing YouTube tracks) */}
          {youtubeVideoId && (() => {
            const customTrack = customMusicTracks.find(t => t.id === currentMusicTrack.id);
            const isYouTubeMusic = customTrack?.source === 'youtube' || 
                                   (customTrack?.youtubeUrl && isYouTubeUrl(customTrack.youtubeUrl));
            return isYouTubeMusic ? (
              <View style={styles.videoContainer}>
                <YoutubePlayer
                  height={200}
                  videoId={youtubeVideoId}
                  play={youtubePlaying}
                  onChangeState={(state) => {
                    if (state === 'ended') {
                      setYoutubePlaying(false);
                      setIsMusicPlaying(false);
                    } else if (state === 'playing') {
                      setIsMusicPlaying(true);
                    } else if (state === 'paused') {
                      setIsMusicPlaying(false);
                    }
                  }}
                  onError={(error) => {
                    console.error('YouTube player error:', error);
                    Alert.alert('Error', 'Failed to play YouTube video. Please check your internet connection.');
                  }}
                />
              </View>
            ) : null;
          })()}

          <View style={styles.musicControls}>
            <IconButton
              icon="skip-previous"
              size={32}
              onPress={() => {
                const enabledTracks = getEnabledMusicTracks();
                const currentIndex = enabledTracks.findIndex(t => t.id === currentMusicTrack.id);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : enabledTracks.length - 1;
                if (enabledTracks[prevIndex]) {
                  handleChangeMusicTrack(enabledTracks[prevIndex]);
                }
              }}
            />
            {!isMusicPlaying ? (
              <IconButton
                icon="play"
                size={40}
                iconColor="#fff"
                style={styles.playButton}
                onPress={handlePlayMusic}
              />
            ) : (
              <IconButton
                icon="pause"
                size={40}
                iconColor="#fff"
                style={styles.playButton}
                onPress={handlePauseMusic}
              />
            )}
            <IconButton
              icon="stop"
              size={32}
              onPress={handleStopMusic}
            />
            <IconButton
              icon="skip-next"
              size={32}
              onPress={() => {
                const enabledTracks = getEnabledMusicTracks();
                const currentIndex = enabledTracks.findIndex(t => t.id === currentMusicTrack.id);
                const nextIndex = (currentIndex + 1) % enabledTracks.length;
                if (enabledTracks[nextIndex]) {
                  handleChangeMusicTrack(enabledTracks[nextIndex]);
                }
              }}
            />
          </View>

          <View style={styles.volumeContainer}>
            <Ionicons name="volume-low-outline" size={20} color="#6366f1" />
            <View style={styles.volumeSlider}>
              <Button
                mode="outlined"
                compact
                onPress={() => handleVolumeChange(Math.max(0, musicVolume - 0.1))}
              >
                -
              </Button>
              <Text style={styles.volumeText}>
                {Math.round(musicVolume * 100)}%
              </Text>
              <Button
                mode="outlined"
                compact
                onPress={() => handleVolumeChange(Math.min(1, musicVolume + 0.1))}
              >
                +
              </Button>
            </View>
            <Ionicons name="volume-high-outline" size={20} color="#6366f1" />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.trackSelectionHeader}>
            <Text style={styles.trackListTitle}>Select Track:</Text>
            <Button
              mode="outlined"
              compact
              onPress={() => setShowMusicTrackSelection(!showMusicTrackSelection)}
              icon={showMusicTrackSelection ? 'chevron-up' : 'chevron-down'}
              style={styles.manageButton}
            >
              {showMusicTrackSelection ? 'Hide' : 'Manage Tracks'}
            </Button>
          </View>

          {showMusicTrackSelection && (
            <Card style={styles.trackSelectionCard}>
              <Card.Content>
                <View style={styles.trackSelectionHeader}>
                  <Text style={styles.trackSelectionTitle}>Enable/Disable Music Tracks:</Text>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => setShowAddMusicModal(true)}
                    icon="plus"
                    style={styles.addButton}
                  >
                    Add Track
                  </Button>
                </View>
                
                {/* Default tracks */}
                {MUSIC_TRACKS.filter(t => !deletedMusicTracks.has(t.id)).map((track) => (
                  <List.Item
                    key={track.id}
                    title={track.title}
                    description="Default Track"
                    left={(props) => (
                      <Ionicons 
                        name={track.icon as any} 
                        size={24} 
                        color={enabledMusicTracks.has(track.id) ? '#6366f1' : '#9ca3af'} 
                        style={{ marginRight: 8 }}
                      />
                    )}
                    right={() => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox
                          status={enabledMusicTracks.has(track.id) ? 'checked' : 'unchecked'}
                          onPress={() => toggleMusicTrack(track.id)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#ef4444"
                          onPress={() => deleteMusicTrack(track.id)}
                        />
                      </View>
                    )}
                  />
                ))}
                
                {/* Custom tracks */}
                {customMusicTracks.map((track) => (
                  <List.Item
                    key={track.id}
                    title={track.title}
                    description={track.source === 'device' ? 'From Device' : track.source === 'youtube' ? 'YouTube' : 'URL'}
                    left={(props) => (
                      <Ionicons 
                        name={track.icon as any} 
                        size={24} 
                        color={enabledMusicTracks.has(track.id) ? '#6366f1' : '#9ca3af'} 
                        style={{ marginRight: 8 }}
                      />
                    )}
                    right={() => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox
                          status={enabledMusicTracks.has(track.id) ? 'checked' : 'unchecked'}
                          onPress={() => toggleMusicTrack(track.id)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#ef4444"
                          onPress={() => deleteMusicTrack(track.id)}
                        />
                      </View>
                    )}
                  />
                ))}
              </Card.Content>
            </Card>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trackList}>
            {getEnabledMusicTracks().map((track) => (
              <Button
                key={track.id}
                mode={currentMusicTrack.id === track.id ? 'contained' : 'outlined'}
                onPress={() => handleChangeMusicTrack(track)}
                style={styles.trackButton}
                icon={track.icon}
              >
                {track.title}
              </Button>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Video Player Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam-outline" size={24} color="#6366f1" />
            <Title style={styles.sectionTitle}>Relaxing Videos</Title>
          </View>

          {showVideo && youtubeVideoId && (
            <View style={styles.videoContainer}>
              <YoutubePlayer
                height={200}
                videoId={youtubeVideoId}
                play={youtubePlaying}
                onChangeState={(state) => {
                  if (state === 'ended') {
                    setYoutubePlaying(false);
                    setIsVideoPlaying(false);
                  } else if (state === 'playing') {
                    setIsVideoPlaying(true);
                  } else if (state === 'paused') {
                    setIsVideoPlaying(false);
                  }
                }}
                onError={(error) => {
                  console.error('YouTube player error:', error);
                  Alert.alert('Error', 'Failed to play YouTube video. Please check your internet connection.');
                }}
              />
            </View>
          )}

          {showVideo && video && !youtubeVideoId && (
            <View style={styles.videoContainer}>
              <Video
                ref={(ref) => {
                  if (ref) {
                    setVideo(ref);
                  }
                }}
                style={styles.video}
                source={{ uri: currentVideoTrack.uri }}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying);
                  }
                }}
              />
            </View>
          )}

          <Text style={styles.currentTrackText}>
            Current: {currentVideoTrack.title}
          </Text>

          <View style={styles.videoControls}>
            {!showVideo ? (
              <Button
                mode="contained"
                onPress={handlePlayVideo}
                style={styles.videoButton}
                icon="play"
              >
                Play Video
              </Button>
            ) : (
              <>
                {!isVideoPlaying ? (
                  <Button
                    mode="contained"
                    onPress={handlePlayVideo}
                    style={styles.videoButton}
                    icon="play"
                  >
                    Resume
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handlePauseVideo}
                    style={styles.videoButton}
                    icon="pause"
                  >
                    Pause
                  </Button>
                )}
                <Button
                  mode="outlined"
                  onPress={handleStopVideo}
                  style={styles.videoButton}
                  icon="stop"
                  textColor="#ef4444"
                >
                  Stop
                </Button>
              </>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.trackSelectionHeader}>
            <Text style={styles.trackListTitle}>Select Video:</Text>
            <Button
              mode="outlined"
              compact
              onPress={() => setShowVideoTrackSelection(!showVideoTrackSelection)}
              icon={showVideoTrackSelection ? 'chevron-up' : 'chevron-down'}
              style={styles.manageButton}
            >
              {showVideoTrackSelection ? 'Hide' : 'Manage Videos'}
            </Button>
          </View>

          {showVideoTrackSelection && (
            <Card style={styles.trackSelectionCard}>
              <Card.Content>
                <View style={styles.trackSelectionHeader}>
                  <Text style={styles.trackSelectionTitle}>Enable/Disable Video Tracks:</Text>
                  <Button
                    mode="contained"
                    compact
                    onPress={() => setShowAddVideoModal(true)}
                    icon="plus"
                    style={styles.addButton}
                  >
                    Add Video
                  </Button>
                </View>
                
                {/* Default tracks */}
                {VIDEO_TRACKS.filter(t => !deletedVideoTracks.has(t.id)).map((track) => (
                  <List.Item
                    key={track.id}
                    title={track.title}
                    description="Default Track"
                    left={() => (
                      <Text style={styles.videoThumbnail}>{track.thumbnail}</Text>
                    )}
                    right={() => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox
                          status={enabledVideoTracks.has(track.id) ? 'checked' : 'unchecked'}
                          onPress={() => toggleVideoTrack(track.id)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#ef4444"
                          onPress={() => deleteVideoTrack(track.id)}
                        />
                      </View>
                    )}
                  />
                ))}
                
                {/* Custom tracks */}
                {customVideoTracks.map((track) => (
                  <List.Item
                    key={track.id}
                    title={track.title}
                    description={track.source === 'device' ? 'From Device' : track.source === 'youtube' ? 'YouTube' : 'URL'}
                    left={() => (
                      <Text style={styles.videoThumbnail}>{track.thumbnail}</Text>
                    )}
                    right={() => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox
                          status={enabledVideoTracks.has(track.id) ? 'checked' : 'unchecked'}
                          onPress={() => toggleVideoTrack(track.id)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#ef4444"
                          onPress={() => deleteVideoTrack(track.id)}
                        />
                      </View>
                    )}
                  />
                ))}
              </Card.Content>
            </Card>
          )}

          <View style={styles.videoTrackList}>
            {getEnabledVideoTracks().map((track) => (
              <Button
                key={track.id}
                mode={currentVideoTrack.id === track.id ? 'contained' : 'outlined'}
                onPress={() => handleChangeVideoTrack(track)}
                style={styles.videoTrackButton}
                icon="play-circle-outline"
              >
                {track.thumbnail} {track.title}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />

      {/* Add Music Track Modal */}
      {showAddMusicModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={100}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>Add Music Track</Title>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => {
                    setShowAddMusicModal(false);
                    setNewMusicTitle('');
                    setNewMusicUrl('');
                  }}
                />
              </View>
              
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Button
                  mode="contained"
                  onPress={addMusicFromDevice}
                  style={styles.modalButton}
                  icon="folder-music"
                >
                  Choose from Device
                </Button>
                
                <Divider style={styles.modalDivider} />
                
                <Text style={styles.modalSubtitle}>Or add from YouTube/URL:</Text>
                <TextInput
                  label="Track Title"
                  value={newMusicTitle}
                  onChangeText={setNewMusicTitle}
                  mode="outlined"
                  style={styles.modalInput}
                  placeholder="Enter track name"
                />
                <TextInput
                  label="YouTube URL or Direct Audio URL"
                  value={newMusicUrl}
                  onChangeText={setNewMusicUrl}
                  mode="outlined"
                  style={styles.modalInput}
                  placeholder="https://youtube.com/... or https://..."
                />
                <Button
                  mode="contained"
                  onPress={addMusicFromUrl}
                  style={styles.modalButton}
                  icon="link"
                  disabled={!newMusicTitle.trim() || !newMusicUrl.trim()}
                >
                  Add from URL
                </Button>
              </ScrollView>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      )}

      {/* Add Video Track Modal */}
      {showAddVideoModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={100}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>Add Video Track</Title>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => {
                    setShowAddVideoModal(false);
                    setNewVideoTitle('');
                    setNewVideoUrl('');
                  }}
                />
              </View>
              
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Button
                  mode="contained"
                  onPress={addVideoFromDevice}
                  style={styles.modalButton}
                  icon="folder-video"
                >
                  Choose from Device
                </Button>
                
                <Divider style={styles.modalDivider} />
                
                <Text style={styles.modalSubtitle}>Or add from YouTube/URL:</Text>
                <TextInput
                  label="Video Title"
                  value={newVideoTitle}
                  onChangeText={setNewVideoTitle}
                  mode="outlined"
                  style={styles.modalInput}
                  placeholder="Enter video name"
                />
                <TextInput
                  label="YouTube URL or Direct Video URL"
                  value={newVideoUrl}
                  onChangeText={setNewVideoUrl}
                  mode="outlined"
                  style={styles.modalInput}
                  placeholder="https://youtube.com/... or https://..."
                />
                <Button
                  mode="contained"
                  onPress={addVideoFromUrl}
                  style={styles.modalButton}
                  icon="link"
                  disabled={!newVideoTitle.trim() || !newVideoUrl.trim()}
                >
                  Add from URL
                </Button>
              </ScrollView>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1f2937',
  },
  timerDisplay: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    fontFamily: 'monospace',
  },
  timerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerInput: {
    flex: 1,
  },
  timerButton: {
    backgroundColor: '#6366f1',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  timerControlButton: {
    flex: 1,
  },
  currentTrackText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  musicControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  playButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 8,
  },
  volumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  volumeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 50,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  trackListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  trackSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButton: {
    borderColor: '#6366f1',
  },
  addButton: {
    backgroundColor: '#6366f1',
  },
  modalCard: {
    margin: 16,
    marginTop: 0,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  modalInput: {
    marginBottom: 12,
  },
  modalButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
  },
  modalDivider: {
    marginVertical: 16,
  },
  trackSelectionCard: {
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  trackSelectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  videoThumbnail: {
    fontSize: 24,
    marginRight: 8,
  },
  trackList: {
    marginTop: 8,
  },
  trackButton: {
    marginRight: 8,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  videoButton: {
    flex: 1,
  },
  videoTrackList: {
    gap: 8,
  },
  videoTrackButton: {
    marginBottom: 8,
  },
  bottomSpacing: {
    height: 32,
  },
  presetTimersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  presetTimersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  presetTimerButton: {
    flex: 1,
    borderColor: '#6366f1',
  },
  customTimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  timerDivider: {
    marginVertical: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default VisualizationScreen;

