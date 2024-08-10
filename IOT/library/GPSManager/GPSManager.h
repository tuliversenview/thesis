#ifndef GPS_MANAGER_H
#define GPS_MANAGER_H

#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

struct GPSData {
  float latitude;
  float longitude;
  int hour;
  int minute;
  int second;
};

class GPSManager {
public:
  GPSManager(int txPin, int rxPin, int baudRate = 9600);
  GPSData getGPSData();

private:
  HardwareSerial* SerialGPS;
  TinyGPSPlus gps;
};

#endif // GPS_MANAGER_H