// src/components/BottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomNav = ({ navigation, currentScreen }) => {
  const insets = useSafeAreaInsets();
  const navItems = [
    { name: 'VisaoGeral', label: 'Início', icon: 'home' },
    { name: 'Pacientes', label: 'Pacientes', icon: 'users' },
    { name: 'Relatorios', label: 'Relatórios', icon: 'bar-chart-2' },
  ];

  return (
    <View style={[styles.bottomNavigation, { paddingBottom: 10 + insets.bottom }]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => {
            if (currentScreen !== item.name) {
              navigation.navigate(item.name);
            }
          }}
        >
          <Icon
            name={item.icon}
            size={22}
            color={currentScreen === item.name ? '#B367D4' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navText,
              currentScreen === item.name && styles.navTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 15,
  },
  navTextActive: {
    color: '#B367D4',
  },
});

export default BottomNav;