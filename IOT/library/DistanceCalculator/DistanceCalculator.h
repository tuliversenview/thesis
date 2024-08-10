#ifndef DISTANCE_CALCULATOR_H
#define DISTANCE_CALCULATOR_H

#include <Arduino.h>

class DistanceCalculator {
private:
  const int _trigPin;
  const int _echoPin;

public:
  DistanceCalculator(int trigPin, int echoPin);
  int getDistance();
};

#endif // DISTANCE_CALCULATOR_H