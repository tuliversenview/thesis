#ifndef HTTPREQUEST_H
#define HTTPREQUEST_H

#include <Arduino.h>

class HttpRequest {
private:
    const char* url;
    HardwareSerial* serial; // Pointer to the serial object
    int resetpin;

    bool sendATCommand(const char* cmd, unsigned long timeout = 1000, bool canBreak = true, bool writelog = false);
    String sendATCommandWithReponse(const char* cmd, unsigned long timeout = 1000, bool canBreak = true, bool writelog = false);

public:
    HttpRequest();
    void setUrl(const char* newUrl);
    void setSerial(HardwareSerial& serialObj);
    void setResetPin(int pin);
    bool init();
    bool reconnect();
    String fetch();
    String getIP();
};

#endif
