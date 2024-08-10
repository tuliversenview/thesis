#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

class OLEDDisplay {
public:
    OLEDDisplay();
    void begin();
    void displayData(const char* id, const char* filled, const char* timer, const char* ip);
    
private:
    Adafruit_SSD1306 display;
    void clearAndDisplay();
};

#endif // OLED_DISPLAY_H
