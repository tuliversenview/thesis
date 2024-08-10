import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleNodes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalState } from '@/context/globalcontext';
import { format } from 'date-fns';
import { AntDesign } from '@expo/vector-icons';
const ClustersDropdown = () => {
  const { clustervalue, setClusterValue } = useGlobalState();
  const { selectedDate} = useGlobalState();
  const [isFocus, setIsFocus] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    console.log(1)
    fetchClustersData();
    // if (data.length > 0) {
    //     // Set default selected value to the first item's value in data
    //     setClusterValue(data[0].value);
    // }
  }, [selectedDate]);

  function convertTimeFormat(timeString) {
    const datetime = new Date(timeString);
    const time = datetime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return time;
  }

  const fetchClustersData = () => {
    console.log('fetchClustersData')
    var datepick=format(selectedDate, 'yyyy-MM-dd');
    fetch('http://wastemanager.ddns.net:5000/api/mobile/RoutingTask/GetRoutingCluterDrivers?date='+datepick+'&DriverID=1')
      .then(response => response.json())
      .then(responseData => {
        // Map response data to dropdown data format
        const mappedData = responseData.data.map(item => ({
          label: convertTimeFormat(item.startTime), // Display StartTime as label
          value: item.id.toString(), // Use ID as value (convert to string if necessary)
          
        }));
        setData(mappedData);
      })
      .catch(error => {
        console.log('Error fetching data:', error);
      });
  };

  const renderLabel = () => {
    if (clustervalue || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: '#563d7c' }]}>
          Tasks by date
        </Text>
      );
    }
    return null;
  };
  // const renderItem = item => {
  //   return (
  //     <View style={styles.item}>
  //       <Text style={styles.textItem}>{item.label}</Text>
  //       {item.value == "09:31" && (
  //         <AntDesign
  //           style={styles.icon}
  //           color="black"
  //           name="Safety"
  //           size={20}
  //         />
  //       )}
  //     </View>
  //   );
  // };
  return (
    <View style={styles.container}>
        
      {renderLabel()}
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: '#563d7c' }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        search
        maxHeight={300}
        labelField="label" // Display StartTime as label
        valueField="value" // Use ID as value
        placeholder={!isFocus ? 'Select item' : '...'}
        searchPlaceholder="Search..."
        value={clustervalue}
        onFocus={() => {
            console.log(2)
          fetchClustersData(); // Fetch data based on search text
          setIsFocus(true);
        }}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          setClusterValue(item.value);
          setIsFocus(false);
        }}
        onChangeText={text => {
          setSearchText(text);
          console.log(3)
          fetchClustersData(); // Fetch data based on search text
        }}
        renderLeftIcon={() => (
          <FontAwesomeIcon icon={faCircleNodes} style={styles.icon} />
        )}
        // renderItem={renderItem}
      />
    </View>
  );
};

export default ClustersDropdown;

const styles = StyleSheet.create({
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textItem: {
    flex: 1,
    fontSize: 16,
  },
  container: {
    width: '50%',
    backgroundColor: 'white',
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
