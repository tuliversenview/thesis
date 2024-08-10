import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useGlobalState} from '../../context/globalcontext';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
  
const DateTimeSelector = () => {
    const { selectedDate,setSelectedDate} = useGlobalState();
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);

    console.log(selectedDate)
    const openDateTimePicker = () => {
        setShowDateTimePicker(true);
      };
    
      const closeDateTimePicker = () => {
        setShowDateTimePicker(false);
      };
      const formatDateTime = (date: Date) => {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      };
      const handleDateTimeChange = (event: any, date: React.SetStateAction<Date>) => {
        if (date) {
          setSelectedDate(date);
        }
        setShowDateTimePicker(false);
      };
  return (
    <View style={[styles.containerdatetime, showDateTimePicker && { borderColor: '#563d7c' }]}>
    <TouchableOpacity style={styles.dateTimeButton} onPress={openDateTimePicker}> 
    <FontAwesomeIcon icon={faClock} style={styles.icon_black} />
        <DateTimePicker
                value={selectedDate}
                mode="date"
                is24Hour={true}
                onChange={handleDateTimeChange}
              />
    </TouchableOpacity>
  </View>
  );
};

export default DateTimeSelector;
const styles = StyleSheet.create({
    icon_black: {
        color: 'black',
        fontSize: 100,
        marginLeft: 10, // Adjust as needed for spacing between icon and text
      },
    containerdatetime:{
      width:'50%',
      backgroundColor: 'white',
      padding: 16,
    },
    dateTimeButton: {
      height: 50,
      backgroundColor: 'white',
      borderColor: 'gray',
      borderWidth: 3,
      borderRadius: 8,
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateTimeButtonText: {
      flex: 1,
      fontSize: 16,
    },
      
    dateTimePickerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      dateTimePickerContent: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      dateTimePickerButton: {
        backgroundColor: '#563d7c',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 4,
        marginTop: 16,
      },
      dateTimePickerButtonText: {
        fontSize: 30,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      },
  });