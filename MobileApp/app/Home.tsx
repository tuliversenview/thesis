import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, Dimensions, TextInput, Button, Modal } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faExpand, faCompress, faRoute, faRemove, faClock, faTrash, faInfo, faCheck } from '@fortawesome/free-solid-svg-icons'; // Import the icons you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import ClustersDropdown from '../components/Home/ClustersDropdown'
import DateTimeSelector from '@/components/Home/DateTimeSelector';
import GlobalProvider, { useGlobalState } from '@/context/globalcontext';
import { jwtDecode } from "jwt-decode";
import { format } from 'date-fns';
import Header from '@/components/Home/Header';
import { getColorStyle } from '@/common';
export default function Home({ navigation }) {
  const { clustervalue} = useGlobalState();
  const { selectedDate} = useGlobalState();
  const { countfinish} = useGlobalState();
  const { taskDetails,setTaskDetails} = useGlobalState();
  const [expandedItemId, setExpandedItemId] = useState(null);
  const handleRoutePress = (item: never) => {
    navigation.navigate('Map', { item });
  }; 
  const handleDetailPress = (item: never) => {
   
  }; 

  
  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      await AsyncStorage.setItem('GPSLocation', JSON.stringify({ latitude, longitude }));

    } catch (error) {
      console.log('Error getting location:', error);
    }
  }
  const requestRoutingTaskByDate = (JWTToken,userid) => {
    var datepick=format(selectedDate, 'yyyy-MM-dd');
    var url='http://wastemanager.ddns.net:5000/api/mobile/RoutingTask/GetRoutingTaskDrivers?date='+datepick+'&TaskID='+clustervalue+'&DriverID='+userid;
    console.log(url)
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setTaskDetails(data.data);
      })
      .catch(error => {
        console.log('Error fetching data:', error);
      });
  };

  useEffect(() => {
   console.log("rerender list home");
    const getToken = async () => {
      try {
        const JWTToken = await AsyncStorage.getItem('JWTToken');
        const userid = await AsyncStorage.getItem('userid');
        if (JWTToken !== null && userid!=null) {
          requestRoutingTaskByDate(JWTToken,userid,);
        } else {
          // Handle case where token is not found
          console.log('JWTToken not found');
        }
      } catch (error) {
        // Handle AsyncStorage errors
        console.error('Error retrieving JWTToken:', error);
      }
    };

    getToken(); // Call the async function inside useEffect
    getLocation();
    // console.log(JSON.stringify(taskDetails))
  }, [clustervalue,selectedDate,countfinish]);



  const toggleExpand = (itemId: React.SetStateAction<null>) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };
  console.log(taskDetails)
  return (
    <View style={styles.container}>
    <Text style={styles.screentitle}>My tasks</Text>
     <Header></Header>
        <View style={styles.row1}>
          <ClustersDropdown></ClustersDropdown>
          <DateTimeSelector></DateTimeSelector>
        </View>
      
          <> 
          <View style={styles.container2}>
            <View style={styles.countsContainer}>
              {taskDetails&&(
                <>
                  <FontAwesomeIcon icon={faTrash} style={{ ...styles.icon, color: 'white' }} />
                  <Text style={styles.countValue}>{taskDetails.length}</Text>
                  {/* <FontAwesomeIcon icon={faTrash} style={{ ...styles.icon, color: 'red' }} />
                  <Text style={styles.countValue}>{taskDetails.length}</Text> */}
                </>
                )}
              
            </View>
            {/* <TouchableOpacity style={styles.button}>
                          <FontAwesomeIcon icon={faRoute} style={styles.buttonIcon} />
            </TouchableOpacity> */}
          </View>
          <View style={styles.container3}>
          <View style={styles.listViewContainer}>
          {taskDetails&&(
            <>
          <FlatList
            style={styles.listView}
            data={taskDetails}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <>
              <TouchableOpacity  
               disabled={item.status === 2}
                onPress={() => toggleExpand(item.id)}
              style={[styles.touchable, expandedItemId === item.id && styles.touchableExpanded,(item.status === 2&&styles.disabledItem)]}
              >
                <View style={styles.itemContainer}>
                  <View style={styles.titleContainer}>
                      <View style={[styles.rowNumberContainer,item.modified?{backgroundColor:'green'}:getColorStyle(item.currentFill)]}>
                        {item.modified?(
                          <FontAwesomeIcon icon={faCheck} style={styles.buttonIcon} />
                        ):(
                          <Text style={[styles.rowNumberText]}>{index + 1}</Text>
                        )}
                      </View>              
                  </View>
                  <Text style={styles.title}>{item.modified&&"Finished at: "+format(item.modified, 'yyyy-MM-dd hh:mm')}</Text> 
                  <View style={styles.buttonContainer}>
                  {item.status != 2 &&(
                    <TouchableOpacity style={styles.button} onPress={() => handleRoutePress(item)}>
                      <FontAwesomeIcon icon={faRoute} style={styles.buttonIcon} />
                    </TouchableOpacity>
                  )}
                  </View>
                </View>
                
              </TouchableOpacity>
              {(expandedItemId === item.id ||item.modified )&& (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>{item.streetName}</Text>
                  </View>
                )
                }
              </>
              
            )}
          />
           </>
            )}
        </View>
          </View></>
      </View>
  );
}
const styles = StyleSheet.create({
  screentitle:{
    top:25,
    left:20,
    position:'absolute',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#7a56b0',
  },
  disabledItem:{
    opacity: 0.5, // Reduce opacity for disabled items
    backgroundColor: 'rgba(0,0,0, 0.1)', // Example: Change background color for disabled items
  },
  containerdatetime:{
    width:'50%',
    backgroundColor: 'white',
    padding: 16,
  },
  container1:{
   height:'10%',
   backgroundColor: '#7a56b0',
   borderTopLeftRadius:50,
   borderBottomLeftRadius:50,
   marginLeft: '40%'
   
  },
  container2:{
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
    backgroundColor: '#7a56b0',
    display:'flex',
    flexDirection:'row'
  },
  row1:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-around'
  },
  color_orange:{
    color:'orange'
  },
  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    width:'20%',
    margin:15
  },
  subcontainer:{
    height:'100%',
    width:'100%',
  },
  countTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  countValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'

  },
  container: {
    backgroundColor: 'white',
  },
  container3: {
    height:'70%',
    backgroundColor: '#7a56b0',
  },
  rowNumberContainer: {
    position:'relative',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#563d7c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listViewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    color: 'white',
    fontSize: 20, // Adjust icon size as needed
  },
  listView: {
    flex: 1,
  },
  touchable: {
    padding: 16,
    borderTopWidth: 3,
    borderTopColor: '#7a56b0',
  },
  touchableExpanded: {
    backgroundColor: '#f2f2f2',
  },
  icon: {
    color: 'white',
    fontSize: 100,
    marginLeft: 10, // Adjust as needed for spacing between icon and text
  },
  icon_black: {
    color: 'black',
    fontSize: 100,
    marginLeft: 10, // Adjust as needed for spacing between icon and text
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth:'80%'
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#563d7c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor:'white',
    margin: 16,
    paddingHorizontal: 16
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  
});