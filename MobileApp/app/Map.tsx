import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline ,Circle} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { decode } from "@googlemaps/polyline-codec";
import { faCar, faCheck, faLocationDot, faRemove, faRotateBack, faX } from '@fortawesome/free-solid-svg-icons';
import { MapViewWithHeading, ArrowedPolyline } from 'react-native-maps-line-arrow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useGlobalState } from '@/context/globalcontext';


const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0005;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const GOOGLE_MAPS_APIKEY = 'AIzaSyDbTJzSBg81iX6cSVMzw6cgfMxrBJ1LMFQ'; // Replace with your Google Maps API key



export default function Map({ route,navigation }) {
  const { item } = route.params;
  const [savedItem] = useState(item);
  const destination = { latitude: savedItem.lat, longitude: savedItem.lng};
  const [locationcurrent, setLocationcurrent] = useState(null);
  const [locationprojection, setLocationprojection] = useState(null);
  const [currentpolyline, setcurrentpolyline] = useState([]);
  const [intruction, setintruction] = useState({});
  const [polylinepaths, setpolylinepaths] = useState([]);
  const [isRouting, setisRouting] = useState(false);
  const [vectorList, setvectorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const {countfinish,setCountfinish}= useGlobalState();

    useEffect(() => {
        getLocation();
    }, [vectorList]);
  if(locationprojection){
    console.log('locationprojection '+JSON.stringify({latitude:locationprojection.latitude,longitude:locationprojection.longitude}))
  }
 
  useEffect(() => {
    if(locationcurrent){
       
        const result = calculateClosestVector([locationcurrent.latitude, locationcurrent.longitude],vectorList);
        if (result) {
            console.log('result+locationprojection '+JSON.stringify({latitude:locationcurrent.latitude,longitude:locationcurrent.longitude}))
           const { projected_point, endpoint } = result;
           setcurrentpolyline([{ latitude: projected_point[0], longitude: projected_point[1] }, { latitude: endpoint[0], longitude: endpoint[1] }]);
           setLocationprojection({ latitude: projected_point[0], longitude: projected_point[1] }); 
        }
    }
        
    }, [locationcurrent]);
  // Fetches current location and watches for updates
  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const result = calculateClosestVector([latitude, longitude],vectorList);
        if (result) {
            const { projected_point, endpoint } = result;
            setcurrentpolyline([{ latitude: projected_point[0], longitude: projected_point[1] }, { latitude: endpoint[0], longitude: endpoint[1] }]);
            setLocationprojection({ latitude: projected_point[0], longitude: projected_point[1] }); 
          
        } 

      setLocationcurrent({ latitude, longitude });
      setLoading(false)
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1, distanceInterval: 1 },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
         
        setLocationcurrent({ latitude, longitude });
        console.log('setLocationcurrent '+JSON.stringify({latitude:latitude,longitude:longitude}))
          
        }
      );

    } catch (error) {
      console.log('Error getting location:', error);
    }
  }

  // Finds the closest vector to the current location
   
  
  const fetchData = async () => {
    try {
      console.log(item)
      // Read JWT token from AsyncStorage
      const token = await AsyncStorage.getItem('JWTToken');
  
      const response = await fetch('http://wastemanager.ddns.net:5000/api/Mobile/RoutingTask/CompleteTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include JWT token in the Authorization header
        },
        body: JSON.stringify({
          DetailTaskID:item.id// Example date parameter
         
        }),
      });
  
      const json = await response.json();
      setCountfinish(countfinish+1)
    } catch (error) {
        console.log(error)
    }
  };

  // Function to calculate the closest vector to a point
  function calculateClosestVector(point,vectors) {
    let closestVector = null;
    let minDistance = Infinity;
    if(vectors!=null){
        if (!point) return null;
         for (const vector of vectors) {
          const [start_point, end_point] = vector;
    
          // Calculate vector from start point to end point
          const vector_direction = [end_point[0] - start_point[0], end_point[1] - start_point[1]];
    
          // Vector from start point to point
          const vector_to_point = [point[0] - start_point[0], point[1] - start_point[1]];
    
          // Calculate projection length
          let projection_length = (vector_to_point[0] * vector_direction[0] + vector_to_point[1] * vector_direction[1]) /
                                    (vector_direction[0] * vector_direction[0] + vector_direction[1] * vector_direction[1]);
    
          // Clamp projection length to be within the vector bounds
          projection_length = Math.max(0, Math.min(1, projection_length));
    
          // Calculate projected point on the vector
          const projected_point = [start_point[0] + projection_length * vector_direction[0],
                                   start_point[1] + projection_length * vector_direction[1]];
    
          // Calculate distance from point to projected point
          const distance_to_projected_point = Math.sqrt((point[0] - projected_point[0]) ** 2 +
                                                        (point[1] - projected_point[1]) ** 2);
    
          // Find minimum distance to this vector
          if (distance_to_projected_point < minDistance) {
           
            minDistance = distance_to_projected_point;
            closestVector = {
              projected_point: projected_point,
              endpoint: end_point
            };
          }
        }
    
    }
    return closestVector;
  }
  const directions = useMemo(() => (
    isRouting==false&&<MapViewDirections
            origin={locationcurrent}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={0.1}
            strokeColor="blue"
            optimizeWaypoints={true}
            language={'vn'}
            onStart={(params) => {
            //   console.log(Started routing between "${params.origin}" and "${params.destination}");
            }}
            onReady={(result) => {
                var mapPolylinetoInstruction={}
                setpolylinepaths(result.coordinates)
                var polylinePoints = result.legs[0].steps.map(leg => decode(leg.polyline.points, 5));
                var instructionPoints = result.legs[0].steps.map(leg => leg.html_instructions.replace(/<\/?[^>]+(>|$)/g, ''));
                var durations = result.legs[0].steps.map(leg => leg.duration.text);
                var end_address = result.legs[0].end_address;
                for(var i=0;i<instructionPoints.length;i++){
                    var polylinePoint= polylinePoints[i];
                     var instructionPoint= instructionPoints[i];
                     var duration= durations[i];
                    for(var j=1;j<polylinePoint.length;j++){
                        mapPolylinetoInstruction[JSON.stringify(polylinePoint[j])]={instructionPoint,duration,end_address}
                    }
                }
                // console.log('polylinePoints '+JSON.stringify(polylinePoints))
                // console.log('mapPolylinetoInstruction '+JSON.stringify(mapPolylinetoInstruction))
                // console.log('instructionPoints '+JSON.stringify(instructionPoints))
                 const coordinates = polylinePoints.reduce((total,leg) => {
                    const decodedPoints = leg
                    // console.log('polylinePoints.reduce'+JSON.stringify(decodedPoints))
                     return [...total, ...decodedPoints];
                  }, []);
                const vtList = [];

                // Iterate through the flatList to create pairs of coordinates
                for (let i = 0; i < coordinates.length - 1; i++) {
                const startPoint = coordinates[i];
                const endPoint = coordinates[i + 1];
                vtList.push([startPoint, endPoint]);
                 }
                // Print the resulting list of vectors
                // console.log("vectorList"+JSON.stringify(vectorList))
                // console.log("locationcurrent"+JSON.stringify([locationcurrent.latitude, locationcurrent.longitude]))
                 var rs=calculateClosestVector([locationcurrent.latitude, locationcurrent.longitude],vtList)
                
                if(rs){
                    var a_lat=rs.projected_point[0];
                    var a_lng=rs.projected_point[1];
    
                    var b_lat=rs.endpoint[0];
                    var b_lng=rs.endpoint[1];
    
                    setcurrentpolyline([{ latitude:a_lat, longitude: a_lng },{ latitude:b_lat, longitude:b_lng}])
                    setLocationprojection({ latitude:a_lat,  longitude: a_lng });
                    setintruction(mapPolylinetoInstruction[JSON.stringify([b_lat,b_lng])])
                    setisRouting(true)
                    setvectorList(vtList)
                    
                }else{
                    console.log('result null')
                }
             
            }}
            onError={(errorMessage) => {
              console.log('GOT AN ERROR');
            }}
            
            
          />
  ), [locationcurrent]);

  if (loading) {
    return (
        <View style={styles.loadingcontainer}>
        <View style={styles.loadingBackground}>
          <ActivityIndicator size="large" color="white" />
        </View>
      </View>
    );
  }

  function handleBack(){
    setCountfinish(countfinish+1)
    navigation.navigate('Home');
  }
  async function handleComplete(){
    await fetchData()
    navigation.navigate('Home');
  }


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.directionContainer}>
        <View style={styles.directionTextContainer}>
        <FontAwesome6 name="map-location-dot" size={24} color="white" />
          <View style={styles.directionRow}>
            <Text style={styles.directionText1}>{intruction.duration}</Text>
            <Text style={styles.directionText2}>{intruction.instructionPoint}</Text>
          </View>
        </View>
        <View style={styles.directionTextContainerSub}>
        <FontAwesomeIcon icon={faLocationDot}  style={{ color: 'white' }}/>
          <View style={styles.directionRow}>
            <Text style={styles.directionText2}>{intruction.end_address}</Text>
          </View>
        </View>
      </TouchableOpacity>
        <MapView
          style={styles.mapView}
          rotateEnabled={true}
          showsCompass={false}
          initialRegion={locationprojection&&{
            latitude: locationprojection.latitude,
            longitude: locationprojection.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
        >
         {locationprojection&& (
           <Marker
           coordinate={{ latitude: locationprojection.latitude, longitude: locationprojection.longitude }}
           title="Your Location"
           description="You are here"
         ></Marker>
          )}
         
          <Polyline
            coordinates={polylinepaths}
            strokeColor="rgba(50, 194, 208, 0.5)"
            strokeWidth={15}
            zIndex={100}
             
          />
            <Circle
          center={polylinepaths[polylinepaths.length-1]}
          radius={30} // in meters
          fillColor="rgba(255, 0, 0, 0.3)" // color of the fill
          strokeColor="rgba(255, 0, 0, 0.8)" // outline color
          strokeWidth={2} // outline width
        />
          {currentpolyline.length !== 0 && (
           <Polyline
           coordinates={currentpolyline}
           strokeColor="green"
           strokeWidth={10}
          />
           
          )}
      
        {directions}
        </MapView>
        <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, styles.orangeButton]} onPress={handleBack}>
            <FontAwesomeIcon icon={faRotateBack}  style={{ color: 'white' }}/>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.greenButton]} onPress={handleComplete}>
            <FontAwesomeIcon icon={faCheck}  style={{ color: 'white' }}/>
            <Text style={styles.buttonText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    loadingcontainer:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBackground:{
        height:'100%',
        width:'100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        color: 'white',
      },
    buttonsContainer: {
        position: 'absolute',
        bottom: 20, // Adjust as needed
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
      },
      button: {
        minWidth:120,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        display:'flex',
        justifyContent:'center'
      },
      orangeButton: {
        backgroundColor: 'orange',
        borderColor: 'orange',
      },
      greenButton: {
        backgroundColor: 'green',
        borderColor: 'green',
      },
  container: {
    position:'relative',
    height:'100%',
    flex: 1,
  },
  directionRow: {
    flex: 1,
    flexDirection: 'column'
  },
  directionContainer: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    top: 20,
    left: '5%',
    width: '90%',
    zIndex: 1,
    backgroundColor: '#563d7c',
    elevation: 4,
    borderBottomEndRadius: 20,
    borderTopLeftRadius: 20,
    borderTopEndRadius: 20,
  },
  directionTextContainerSub: {
    opacity:0.8,
    borderBottomLeftRadius: 20,
    borderBottomEndRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute',
    top: 100,
    left: '0%',
    width: '70%',
    zIndex: 1,
    backgroundColor: '#7a56b0',
    elevation: 4,
  },
  directionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapView: {
    flex: 1,
    height:'100%'
  },
  directionText1: {
    color: 'white',
    marginLeft: 10,
    fontSize: 25,
    fontWeight: 'bold',
  },
  directionText2: {
    color: '#b7aec5',
    marginLeft: 10,
    fontSize: 16,
  },
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 20,
    height: 20,
    color: 'red', // Example background color for the arrow icon
    transform: [{ rotate: '45deg' }], // Example rotation for the arrow icon
  },
});
