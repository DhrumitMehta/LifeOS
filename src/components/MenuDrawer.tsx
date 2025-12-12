import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Text,
  IconButton,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type MenuDrawerProps = {
  visible: boolean;
  onClose: () => void;
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>;
};

const MenuDrawer = ({ visible, onClose, navigationRef }: MenuDrawerProps) => {

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      icon: 'person-outline',
      screen: 'Profile' as keyof RootStackParamList,
    },
    {
      id: 'reviews',
      title: 'Reviews',
      icon: 'document-text-outline',
      screen: 'Reviews' as keyof RootStackParamList,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'analytics-outline',
      screen: 'Analytics' as keyof RootStackParamList,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      screen: 'Settings' as keyof RootStackParamList,
    },
  ];

  const handleMenuItemPress = (screen: keyof RootStackParamList) => {
    onClose();
    // Navigate to the screen - these will be stack screens
    if (navigationRef.current) {
      navigationRef.current.navigate(screen as any);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <IconButton
              icon="close"
              size={24}
              iconColor="#fff"
              onPress={onClose}
            />
          </View>
          
          <ScrollView style={styles.drawerContent}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
              >
                <Ionicons name={item.icon as any} size={24} color="#6366f1" />
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: '75%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#fff',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366f1',
    borderTopRightRadius: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  drawerContent: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 16,
  },
});

export default MenuDrawer;

