#include <Arduino.h>
#include <DistanceCalculator.h>
#include <GPSManager.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <HttpRequest.h>
#include <Arduino_JSON.h>
#include <PreferencesKeyValue.h>
#include <OLEDDisplay.h>



// Globals
PreferencesKeyValue preferences;
HttpRequest request;
OLEDDisplay oled;
GPSManager gpsManager(4, 5);
DistanceCalculator distanceCalculator(19, 18);

int count = 0;
float latitude = 0;
float longitude = 0;
int percent = 0;
String ip = "";
String idValue = "";
bool isSendData = false;

void setup() {
    Serial.begin(9600);
    oled.begin();

    // SIM module setup
    pinMode(2, OUTPUT);
    digitalWrite(2, HIGH);
    Serial2.begin(115200, SERIAL_8N1, 17, 16);
    request.setSerial(Serial2);
    request.setResetPin(2);

    // Memory setup
    if (!preferences.begin("2")) {
        Serial.println("Failed to initialize Preferences");
        return;
    }
    String value;
    if (!preferences.get("id", value)) {
        preferences.put("id", "0");
    }

    Serial.println("initDepth: ");
    delay(2000);
    initDepth();
    Serial.println("end initDepth: ");

    xTaskCreatePinnedToCore(
        writeScreen, // Task function
        "writeScreen", // Name of the task
        10000, // Stack size of the task
        NULL, // Parameter of the task
        1, // Priority of the task
        NULL, // Task handle
        0 // Core where the task should run
    );
}

void initDepth() {
    String value;
    if (!preferences.get("depth", value)) {
        for (int i = 0; i < 10; i++) {
            int distance = distanceCalculator.getDistance();
            Serial.println("depth: " + intToString(distance));
            preferences.put("depth", intToString(distance));
            delay(1000);
        }
    }

    if (value == "0") {
        for (int i = 0; i < 10; i++) {
            int distance = distanceCalculator.getDistance();
            Serial.println("depth: " + intToString(distance));
            preferences.put("depth", intToString(distance));
            delay(1000);
        }
    }

    preferences.get("depth", value);
    Serial.println("final depth: " + value);
}

String extractJsonString(String input) {
    regex_t jsonRegex;
    regcomp(&jsonRegex, "\\{[^}]+\\}", REG_EXTENDED);

    regmatch_t matches[1];
    if (regexec(&jsonRegex, input.c_str(), 1, matches, 0) == 0) {
        int start = matches[0].rm_so;
        int end = matches[0].rm_eo;
        String jsonStr = input.substring(start, end);
        regfree(&jsonRegex);
        return jsonStr;
    } else {
        regfree(&jsonRegex);
        return "";
    }
}

String buildUrl(const char* id, float latitude, float longitude, int percent) {
    String url = "http://wastemanager.ddns.net:5000/api/IOT/TransmitSensorData?";
    url += "id=";
    url += id;
    url += "&lat=";
    url += String(latitude, 6); // 6 decimal places for latitude
    url += "&lng=";
    url += String(longitude, 6); // 6 decimal places for longitude
    url += "&percent=";
    url += String(percent); // Convert distance to string
    return url;
}

String intToString(int input) {
    return String(input);
}

String intToStringWithPercent(int value) {
    return String(value) + "%";
}

void writeScreen(void *pvParameters) {
    while (1) {
        if (isSendData) {
            oled.displayData(idValue.c_str(), intToStringWithPercent(percent).c_str(), "sending ...", ip.c_str());
        } else {
            oled.displayData(idValue.c_str(), intToStringWithPercent(percent).c_str(), intToString(count).c_str(), ip.c_str());
        }
        delay(100);
    }
}

void sendRequest(void *pvParameters) {
    String urlString = buildUrl(idValue.c_str(), latitude, longitude, percent);
    Serial.println(urlString);
    request.setUrl(urlString.c_str());
    String response = request.fetch();
    String jsonStr = extractJsonString(response);
    Serial.println("fetchresponse " + jsonStr);

    JSONVar jsonObject = JSON.parse(jsonStr);
    if (JSON.typeof(jsonObject) == "undefined") {
        Serial.println("Parsing JSON failed!");
        count = 30;
    } else {
        int id = jsonObject["id"];
        count = jsonObject["timmer"];
        preferences.put("id", intToString(id));
    }
    isSendData = false;
    vTaskDelete(NULL);
}

int percentCalculator(int distance) {
    String value;
    if (preferences.get("depth", value)) {
        int depth = value.toInt();
        if (depth != 0) { // Ensure that depth is not zero to avoid division by zero
            int result = (int)(((float)distance / (float)depth) * 100);
            return 100 - result;
        } else {
            Serial.println("Depth value is zero, cannot calculate percentage");
            return 100;
        }
    } else {
        return 100;
    }
}

void loop() {
    delay(1000);

    Serial.println("--------------- GPS data ----------------");
    GPSData data = gpsManager.getGPSData();
    Serial.println(data.latitude, 6);
    Serial.println(data.longitude, 6);
    latitude = data.latitude;
    longitude = data.longitude;

    Serial.println("--------------- Distance data ----------------");
    int distance = distanceCalculator.getDistance() - 3;
    String depthValue;
    preferences.get("depth", depthValue);
    Serial.println(distance);
    Serial.println(depthValue);
    
    if (distance > depthValue.toInt()) {
        distance = depthValue.toInt();
    }

    percent = percentCalculator(distance);
    Serial.println(percent);

    Serial.println("--------------- Get IP ----------------");
    Serial.println("ip: " + ip);

    Serial.println("--------------- Get ID ----------------");
    preferences.get("id", idValue);
    Serial.println("id: " + idValue);

    if (count < 1 && !isSendData) {
        isSendData = true;
        Serial.println("--------------- Request data ----------------");
        Serial.println(isSendData);
        ip = request.getIP();
        xTaskCreatePinnedToCore(
            sendRequest, // Task function
            "sendRequest", // Name of the task
            10000, // Stack size of the task
            NULL, // Parameter of the task
            1, // Priority of the task
            NULL, // Task handle
            1 // Core where the task should run
        );
        Serial.println("-------------------------------");
    }

    count -= 1;
}
