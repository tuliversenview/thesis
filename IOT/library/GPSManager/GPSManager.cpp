#include "GPSManager.h"

GPSManager::GPSManager(int txPin, int rxPin, int baudRate) {
  SerialGPS = new HardwareSerial(1);
  SerialGPS->begin(baudRate, SERIAL_8N1, txPin, rxPin);
}

GPSData GPSManager::getGPSData() {
  GPSData data;
  while (SerialGPS->available() > 0) {
    if (gps.encode(SerialGPS->read())) {
      if (gps.location.isValid()) {
        data.latitude = gps.location.lat();
        data.longitude = gps.location.lng();
      }
      if (gps.time.isValid()) {
        data.hour = gps.time.hour();
        data.minute = gps.time.minute();
        data.second = gps.time.second();
      }
      return data;
    }
  }
  return data;
}