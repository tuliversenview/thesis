import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Avatar } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Header = () => {
    const [username, setUsername] = useState('');
    async function getusername(){
        const rs=await AsyncStorage.getItem('unique_name');
        console.log(rs)
        setUsername(rs);
    }
    useEffect(()=>{
        getusername();
    },[])
  return (
    <View style={styles.container1}>
      {/* Circle Avatar */}
      <Avatar
        rounded
        size="medium"
        source={{
          uri:
            'https://medias.meow.social/accounts/avatars/109/271/081/671/124/561/original/8c952c01f6791816.jpg', // Replace with actual avatar URL
        }}
        containerStyle={styles.avatar}
      />

      {/* Name and Role */}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.role}>Developer</Text>
      </View>
    </View>
  );
};

export default Header;
const styles = StyleSheet.create({
    container1: {
      flexDirection: 'row',
      alignItems: 'center',
      height: '10%',
      backgroundColor: '#7a56b0',
      borderTopLeftRadius: 50,
      borderBottomLeftRadius: 50,
      marginLeft: '50%',
      paddingHorizontal: 20, // Adjust padding as needed
    },
    avatar: {
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    role: {
      color: 'white',
      fontSize: 14,
    },
  });