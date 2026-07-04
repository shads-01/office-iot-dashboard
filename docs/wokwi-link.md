# Wokwi Representative Circuit — Work Room 1

This document describes the representative Wokwi circuit demonstrating the physical wiring logic and firmware for a single room area (Work Room 1: 2 fans + 3 lights = 5 devices).

## 🔗 Wokwi Project Details
* **Shareable Link**: [https://wokwi.com/projects/397395094916892673](https://wokwi.com/projects/397395094916892673)
* **Status**: Simulated Reference Design

---

## 🔌 Hardware Connections (BOM & Pinout)

| Component | ESP32 GPIO | Mode | Purpose |
|---|---|---|---|
| **Manual Switch 1** (Button) | `GPIO 32` | `INPUT_PULLDOWN` | Manual toggle for Fan 1 |
| **Manual Switch 2** (Button) | `GPIO 33` | `INPUT_PULLDOWN` | Manual toggle for Fan 2 |
| **Manual Switch 3** (Button) | `GPIO 25` | `INPUT_PULLDOWN` | Manual toggle for Light 1 |
| **Manual Switch 4** (Button) | `GPIO 4`  | `INPUT_PULLDOWN` | Manual toggle for Light 2 |
| **Manual Switch 5** (Button) | `GPIO 5`  | `INPUT_PULLDOWN` | Manual toggle for Light 3 |
| **Relay Module 1** (5V) | `GPIO 13` | `OUTPUT` | Controls DC Motor 1 (Fan 1) |
| **Relay Module 2** (5V) | `GPIO 12` | `OUTPUT` | Controls DC Motor 2 (Fan 2) |
| **Relay Module 3** (5V) | `GPIO 14` | `OUTPUT` | Controls LED 1 (Light 1) |
| **Relay Module 4** (5V) | `GPIO 27` | `OUTPUT` | Controls LED 2 (Light 2) |
| **Relay Module 5** (5V) | `GPIO 26` | `OUTPUT` | Controls LED 3 (Light 3) |
| **ACS712 Current Sensor** | `GPIO 34` | `ANALOG INPUT` | Reads analog current draw for calculations |

---

## 💾 C++ ESP32 Firmware Sketch

Copy this sketch into the Wokwi C++ editor:

```cpp
/**
 * Lights, Fans, Discord — Room ESP32 Firmware
 * ===========================================
 * Simulates physical toggles and relays for one room.
 * Reads manual toggle buttons and drives relay switches.
 * Samples a representative current sensor to measure consumption.
 * 
 * NOTE: The ESP32 -> Backend server connection is conceptual. Wokwi runs
 * inside a browser sandbox and cannot communicate directly with the local
 * development server (localhost:4000). In a real production deployment,
 * this sketch would join Wi-Fi and execute an HTTP POST request to
 * http://localhost:4000/api/devices/:id/toggle on manual state changes.
 * The live demo uses the software simulator layer (simulator.js) instead.
 */

const int relayPins[5] = {13, 12, 14, 27, 26};   // Fan 1, Fan 2, Light 1, Light 2, Light 3
const int switchPins[5] = {32, 33, 25, 4, 5};    // Manual toggle switches
const int currentSensorPin = 34;                 // ACS712 analog read pin

// Track previous button states for edge detection
bool lastSwitchState[5] = {false, false, false, false, false};
bool relayState[5] = {false, false, false, false, false};

void setup() {
  Serial.begin(115200);
  Serial.println("===============================================");
  Serial.println("Office IoT Room Node Initialized (Work Room 1)");
  Serial.println("5 Relays and 5 Manual Overrides Active.");
  Serial.println("===============================================");

  for (int i = 0; i < 5; i++) {
    pinMode(relayPins[i], OUTPUT);
    pinMode(switchPins[i], INPUT_PULLDOWN);
    digitalWrite(relayPins[i], LOW); // Start off
  }
}

void loop() {
  bool stateChanged = false;
  
  for (int i = 0; i < 5; i++) {
    bool currentSwitch = digitalRead(switchPins[i]);
    
    // Detect button press transition (Rising Edge)
    if (currentSwitch && !lastSwitchState[i]) {
      relayState[i] = !relayState[i];
      digitalWrite(relayPins[i], relayState[i] ? HIGH : LOW);
      stateChanged = true;
      
      Serial.print("Device [");
      Serial.print(i);
      Serial.print("] Toggled. Status: ");
      Serial.println(relayState[i] ? "ON" : "OFF");
    }
    lastSwitchState[i] = currentSwitch;
  }

  // Read analog current sensor (ACS712)
  int rawADC = analogRead(currentSensorPin);
  float voltage = (rawADC / 4095.0) * 3.3;
  // Calculate current (offset 1.65V for ACS712, 185mV per Amp sensitivity)
  float current = (voltage - 1.65) / 0.185;
  if (current < 0.05) current = 0.0; // Noise gate
  
  // Print status when toggles happen or every 3 seconds
  static unsigned long lastPrint = 0;
  if (stateChanged || (millis() - lastPrint > 3000)) {
    lastPrint = millis();
    Serial.print("System Status -> ");
    for (int i = 0; i < 5; i++) {
      Serial.print(relayState[i] ? " [ON] " : " [OFF] ");
    }
    Serial.print(" | Current Sensor draw: ");
    Serial.print(current, 3);
    Serial.println(" A");
  }

  delay(50); // debounce delay
}
```
