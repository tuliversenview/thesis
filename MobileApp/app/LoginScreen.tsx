import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, ImageBackground, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCar, faTruck, faExclamationCircle, faUser, faLock } from '@fortawesome/free-solid-svg-icons'; // Import FontAwesome icons
import { jwtDecode } from 'jwt-decode';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false); // State for error modal visibility
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const passwordInputRef = useRef(null); // Ref for password TextInput

  const handleLogin = async () => {
    try {
      const response = await fetch('http://wastemanager.ddns.net:5000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      await AsyncStorage.setItem('JWTToken', data.token);
      await AsyncStorage.setItem('username', username);
      const decoded = jwtDecode(data.token);
      await AsyncStorage.setItem('userid', decoded.nameid);
      await AsyncStorage.setItem('unique_name', decoded.unique_name);
      
      navigation.navigate('Home');
    } catch (error) {
      console.log('Login failed:', error.message);
      displayErrorModal('Login failed. Please try again.');
    }
  };

  const displayErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handlePressOutside = () => {
    // Unfocus both TextInput fields
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePressOutside}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ImageBackground
            source={{ uri: 'http://wastemanager.ddns.net:5000/img/mobile/mobilelogin.jpg' }}
            style={styles.image}
            resizeMode="cover"
            blurRadius={10} 
          >
            <FontAwesomeIcon icon={faTruck} style={styles.buttonIcon} size={60} />
            <Text style={styles.headertext}>WASTE MANAGER</Text>
          </ImageBackground>
        </View>

        <View style={styles.form}>
          <View style={styles.titleContainer}>
            <Text style={styles.logo}>Login</Text>
          </View>
          <View style={styles.inputView}>
            <FontAwesomeIcon icon={faUser} style={styles.inputIcon} size={20} color="#563d7c" />
            <TextInput
              style={styles.inputText}
              placeholder="Username"
              placeholderTextColor="#563d7c"
              autoCapitalize="none"
              onChangeText={setUsername}
              onSubmitEditing={() => passwordInputRef.current.focus()} // Focus next input on submit
              blurOnSubmit={false}
            />
          </View>
          <View style={styles.inputView}>
            <FontAwesomeIcon icon={faLock} style={styles.inputIcon} size={20} color="#563d7c" />
            <TextInput
              ref={passwordInputRef}
              style={styles.inputText}
              placeholder="Password"
              placeholderTextColor="#563d7c"
              secureTextEntry={true}
              onChangeText={setPassword}
            />
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginText}>LOGIN</Text>
          </TouchableOpacity>
        </View>

        {/* Error Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={errorModalVisible}
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FontAwesomeIcon icon={faExclamationCircle} style={styles.errorIcon} size={60} />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => setErrorModalVisible(false)}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  headertext: {
    fontWeight: 'bold',
    fontSize: 40,
    color: 'white',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    height: '120%',
    width: '100%',
    position: 'absolute',
    justifyContent: 'center',
    display: 'flex',
    alignItems: 'center'
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontWeight: 'bold',
    fontSize: 50,
    color: '#7a56b0',
  },
  form: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    height: '70%', // Adjusted height for the form
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputView: {
    width: '90%',
    backgroundColor: '#fff',
    borderColor: '#7a56b0',
    borderWidth: 3,
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    flexDirection: 'row', // Align icon and input horizontally
    alignItems: 'center', // Center vertically
    paddingHorizontal: 20, // Add padding to align icon and input
  },
  inputText: {
    flex: 1, // Take remaining width of inputView
    height: 50,
    color: '#563d7c',
    marginLeft: 10, // Space between icon and input text
  },
  inputIcon: {
    marginRight: 10, // Space between icon and input border
  },
  loginBtn: {
    width: '50%',
    backgroundColor: '#7a56b0',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 150,
  },
  loginText: {
    color: 'white',
    fontSize: 18,
  },
  buttonIcon: {
    color: 'white',
    marginBottom: 10,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  errorIcon: {
    color: 'red',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#7a56b0',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default LoginScreen;
