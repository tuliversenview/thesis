#include "DistanceCalculator.h"

DistanceCalculator::DistanceCalculator(int trigPin, int echoPin) : _trigPin(trigPin), _echoPin(echoPin) {
  pinMode(_trigPin, OUTPUT);
  pinMode(_echoPin, INPUT);
}

int DistanceCalculator::getDistance() {
  // Generate the trigger pulse
  digitalWrite(_trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(_trigPin, HIGH);
  delayMicroseconds(5);
  digitalWrite(_trigPin, LOW);

  // Measure the duration of the echo pulse
  long duration = pulseIn(_echoPin, HIGH);
  // Calculate the distance in centimeters
  int distance = duration * 0.034 / 2;

  return distance;
}