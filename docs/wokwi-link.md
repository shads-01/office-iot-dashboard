# Wokwi / Tinkercad Hardware Simulation

The hardware for this dashboard is simulated since it's a software-focused Techathon project. However, to fulfill the circuit schematic and hardware simulation requirements, you can create a working Wokwi project using an ESP32.

## How to set up your Wokwi Simulation:

1. Go to [wokwi.com](https://wokwi.com/)
2. Create a new **ESP32** project
3. Paste the following into `sketch.ino`:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Pins for our simulated devices (Room 1)
const int FAN_PIN = 12;
const int LIGHT_PIN = 14;

void setup() {
  Serial.begin(115200);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi!");
}

void loop() {
  // In a real scenario, this would connect to the Socket.IO server or REST API
  // to fetch the latest device state and toggle the relays.
  
  // Simulated toggle
  digitalWrite(FAN_PIN, HIGH);
  digitalWrite(LIGHT_PIN, LOW);
  delay(5000);
  
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(LIGHT_PIN, HIGH);
  delay(5000);
}
```

4. Paste the following into `diagram.json` to automatically set up the components:

```json
{
  "version": 1,
  "author": "Techathon Nationals",
  "editor": "wokwi",
  "parts": [
    { "type": "board-esp32-devkit-c-v4", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    {
      "type": "wokwi-led",
      "id": "led1",
      "top": -60,
      "left": 120,
      "attrs": { "color": "yellow" }
    },
    { "type": "wokwi-relay-module", "id": "relay1", "top": -80, "left": -120, "attrs": {} }
  ],
  "connections": [
    [ "esp:TX", "$serialMonitor:RX", "", [] ],
    [ "esp:RX", "$serialMonitor:TX", "", [] ],
    [ "esp:14", "led1:A", "green", [ "v0" ] ],
    [ "esp:GND.1", "led1:C", "black", [ "v0" ] ],
    [ "esp:12", "relay1:IN", "blue", [ "v0" ] ],
    [ "esp:GND.2", "relay1:GND", "black", [ "v0" ] ],
    [ "esp:5V", "relay1:VCC", "red", [ "v0" ] ]
  ]
}
```

5. Click **Save** in Wokwi, copy the URL of your project, and replace the link below:

**Link to Wokwi Simulation:** 
[https://wokwi.com/projects/YOUR_PROJECT_ID_HERE](https://wokwi.com/)

*(Once done, take a screenshot of the Wokwi circuit and save it as `docs/circuit-schematic.png`)*
