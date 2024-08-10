// IndexScreen.tsx

import * as React from 'react';
import { Button, Text, View } from 'react-native';

function IndexScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to Index Screen!</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

export default IndexScreen;
