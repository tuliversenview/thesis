import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, PanResponder, Text ,Dimensions } from 'react-native';
function SwipeableComponent(){
const SCREEN_HEIGHT = Dimensions.get('window').height;
console.log(SCREEN_HEIGHT)
  const pan = useRef(new Animated.ValueXY({x:0,y:SCREEN_HEIGHT*0.7})).current;
   pan.extractOffset();
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        console.log( _)
        pan.y.setValue(gesture.dy);
        
      },
      onPanResponderRelease: (_, gesture) => {
        // Release the pan responder and set the position based on gesture end
        pan.extractOffset();
      }
    })
  ).current;

  return (
    <Animated.View
        style={[
          styles.box,
          {
            transform: [{ translateY: pan.y }]
          }
        ]}
        {...panResponder.panHandlers}
      />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'lightblue',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
   box: {
    height: 300,
    width: '100%',
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SwipeableComponent;
