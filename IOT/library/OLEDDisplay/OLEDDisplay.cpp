#include "OLEDDisplay.h"

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

OLEDDisplay::OLEDDisplay() : display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET) {}

void OLEDDisplay::begin() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        for (;;); // Don't proceed, loop forever
    }
    display.display();
    delay(2000); // Pause for 2 seconds
    clearAndDisplay();
}

void OLEDDisplay::clearAndDisplay() {
    display.clearDisplay();
}

void OLEDDisplay::displayData(const char* id, const char* filled, const char* timer, const char* ip) {
    clearAndDisplay();
    display.setTextColor(WHITE);
    display.setCursor(5, 10);
    display.setTextSize(1);
    display.printf("ID: %s", id);

    display.setCursor(5, 25);
    display.setTextSize(1);
    display.printf("Bin filled: %s", filled);

    display.setCursor(5, 40);
    display.setTextSize(1);
    display.printf("Timer: %s", timer);

    display.setCursor(5, 55);
    display.setTextSize(1);
    display.printf("IP: %s", ip);

    display.display();
}
