#include "HttpRequest.h"

HttpRequest::HttpRequest() : url(nullptr), serial(nullptr), resetpin(-1) {}

void HttpRequest::setUrl(const char* newUrl) {
    url = newUrl;
}

void HttpRequest::setSerial(HardwareSerial& serialObj) {
    serial = &serialObj;
}

void HttpRequest::setResetPin(int pin) {
    resetpin = pin;
    pinMode(resetpin, OUTPUT);
    digitalWrite(resetpin, HIGH); // Ensure the reset pin is initially set to HIGH (not resetting)
}

bool HttpRequest::sendATCommand(const char* cmd, unsigned long timeout, bool canBreak, bool writelog) {
    if (writelog) {
        Serial.print("Sending command: " + String(cmd));
    }

    serial->println(cmd); // Send the command to the provided serial object

    unsigned long start = millis();
    String response = "";

    while (millis() - start < timeout) {
        if (serial->available()) {
            char c = serial->read();
            response += c; // Append each character to the response string

            // Check for the "OK" response
            if (response.endsWith("OK")) {
                if (canBreak) {
                    break; // Exit the loop once "OK" is received
                }
            }
        }
    }

    if (response.indexOf("ERROR") != -1) {
        Serial.println("Response is Error " + response); // Print the complete response from SIM900A to Serial Monitor
        return false; // Return false if "ERROR" is found in the response
    }
    if (response.indexOf("601") != -1) {
        Serial.println("601 Error " + response); // Print the complete response from SIM900A to Serial Monitor
        return false; // Return false if "ERROR" is found in the response
    }
    if (writelog) {
        Serial.println(response); // Print the complete response from SIM900A to Serial Monitor
    }
    return true; // Return true if no "ERROR" is found in the response
}
String HttpRequest::getIP() {
    String response = sendATCommandWithReponse("AT+SAPBR=2,1", 5000, true, false);
    int ipStart = response.indexOf("\"");
    int ipEnd = response.lastIndexOf("\"");
    if (ipStart != -1 && ipEnd != -1) {
        return response.substring(ipStart + 1, ipEnd);
    } else {
        return "";
    }
}

String HttpRequest::sendATCommandWithReponse(const char* cmd, unsigned long timeout, bool canBreak, bool writelog) {
    if (writelog) {
        Serial.print("Sending command: " + String(cmd));
    }

    serial->println(cmd); // Send the command to the provided serial object

    unsigned long start = millis();
    String response = "";

    while (millis() - start < timeout) {
        if (serial->available()) {
            char c = serial->read();
            response += c; // Append each character to the response string

            // Check for the "OK" response
            //if (response.endsWith("OK")) {
                //if (canBreak) {
                    //break; // Exit the loop once "OK" is received
                //}
            //}
        }
    }

    if (response.indexOf("ERROR") != -1) {
        Serial.println("Response is Error " + response); // Print the complete response from SIM900A to Serial Monitor
        return "error"; // Return false if "ERROR" is found in the response
    }
    if (response.indexOf("601") != -1) {
        Serial.println("601 Error " + response); // Print the complete response from SIM900A to Serial Monitor
        return "error"; // Return false if "ERROR" is found in the response
    }
    if (writelog) {
        Serial.println(response); // Print the complete response from SIM900A to Serial Monitor
    }
    return response; // Return true if no "ERROR" is found in the response
}

bool HttpRequest::init() {
    Serial.println("Retrying to connect to GPRS...");
    digitalWrite(resetpin, LOW);
    delay(2000);
    digitalWrite(resetpin, HIGH);
    delay(2000);
    digitalWrite(resetpin, LOW);
    delay(2000);
    digitalWrite(resetpin, HIGH);
    delay(5000);
    sendATCommand("AT+SAPBR=0,1", 2000, true, true);
    delay(3000);
    if (!sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 2000, true, false)) return false;
    if (!sendATCommand("AT+SAPBR=3,1,\"APN\",\"m-wap\"", 2000, true, false)) return false; // Add your APN here

    bool success = false;
    while (success == false) {
        if (sendATCommand("AT+CSTT=\"m-wap\",\"mms\",\"mms\"", 2000, true, false)) {
            success = true;
        }
    }
    if (!sendATCommand("AT+SAPBR=1,1", 5000, true, false)) return false; // Give it more time to connect
    return true;
}

bool HttpRequest::reconnect() {
    return init();
}

String HttpRequest::fetch() {
    Serial.println("Check GPRS is connected");
    String response = sendATCommandWithReponse("AT+SAPBR=2,1", 5000, true, true);
    if (response.indexOf("1,1") == -1) {
        init();
    }
    sendATCommand("AT+CSQ", 2000, true, true);
    Serial.println("Start request");
    bool isinit = sendATCommand("AT+HTTPINIT", 10000, true, true);
    if (!isinit) {
        init();
    }
    if (!sendATCommand("AT+HTTPPARA=\"CID\",1", 2000, true, false)) return "";
    if (!sendATCommand("AT+CGDCONT?", 2000, true, false)) return "";

    String urlCommand = String("AT+HTTPPARA=\"URL\",\"") + url + "\"";
    if (!sendATCommand(urlCommand.c_str(), 2000, true, false)) return "";
    response = sendATCommandWithReponse("AT+HTTPACTION=0", 10000, true, false);
    if (response.indexOf("OK") == -1) {
        Serial.println("Fetch fall");
    } else {
        Serial.println("Reading HTTP response...");
        String httpResponse = sendATCommandWithReponse("AT+HTTPREAD", 5000, true, false); // Read the data from the server
        sendATCommand("AT+HTTPTERM", 2000, true, false);
        return httpResponse;
    }
    return "";
}