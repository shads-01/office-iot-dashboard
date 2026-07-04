# Circuit Schematic — Representative Room (Work Room 1)

Per the brief, a representative circuit for **one room** is sufficient as long
as the wiring makes physical sense. Work Room 1 (2 fans + 3 lights = 5
devices) is used here; the other two rooms are electrically identical.

## Components

| Qty | Component | Role |
|---|---|---|
| 1 | ESP32 dev board | Brain — reads switch states, drives relays, would report to backend over Wi-Fi in a real deployment |
| 5 | 5V single-channel relay module | One per device — lets a 3.3V/5V GPIO safely switch a mains-powered load |
| 5 | Toggle switch / pushbutton | Simulates a manual wall-switch override an employee could flip |
| 2 | DC motor (with fan blade) | Stand-in for a ceiling/desk fan (Wokwi doesn't simulate AC motors) |
| 3 | LED + 220Ω resistor | Stand-in for a light fixture |
| 1 | ACS712 current sensor | Lets the ESP32 sense real current draw, not just commanded on/off state |
| 1 | Breadboard + jumper wires | Physical wiring |

## GPIO pin mapping

| Device | Relay control pin (OUTPUT) | Manual switch pin (INPUT_PULLDOWN) |
|---|---|---|
| Fan 1 | GPIO 13 | GPIO 32 |
| Fan 2 | GPIO 12 | GPIO 33 |
| Light 1 | GPIO 14 | GPIO 25 |
| Light 2 | GPIO 27 | GPIO 4 |
| Light 3 | GPIO 26 | GPIO 5 |

| Sensor | Pin |
|---|---|
| ACS712 analog output | GPIO 34 (ADC1_CH6, input-only pin — correct choice for an analog read) |

## Wiring logic (per connection)

**Per-device relay loop (repeat 5x, one per device):**
1. ESP32 GPIO (output, from table above) → relay module's `IN` pin — this is the low-voltage control signal.
2. Relay module `VCC` → ESP32 `5V` (or external 5V rail); relay `GND` → common ground.
3. Relay `COM` (common) → simulated mains supply positive rail.
4. Relay `NO` (normally-open) → device positive terminal (motor lead or LED anode through its resistor).
5. Device negative terminal → mains/ground return.

This means the relay physically breaks/completes the device's power circuit —
the ESP32 never touches mains current directly, which is the correct and
safe pattern for switching a fan or light from a microcontroller.

**Per-device manual switch (repeat 5x):**
1. Switch one leg → 3.3V.
2. Switch other leg → ESP32 GPIO (input pin from table above), configured `INPUT_PULLDOWN` so the pin reads LOW when untouched and HIGH when pressed/flipped.
3. This lets the firmware detect a human physically overriding a device, not just software-driven state — satisfies the brief's implicit requirement that the system reflect real wall-switch behavior.

**Current sensor:**
1. ACS712 sits in series on the supply line feeding **one** relay branch (e.g. Fan 1) — current flows *through* the sensor before reaching the relay.
2. ACS712 analog output → ESP32 GPIO 34 (ADC).
3. In firmware, an analog read on this pin gives a proportional voltage the sketch converts to amps, then to watts (given known voltage) — this is what would let a real deployment measure actual draw instead of assuming a fixed wattage table.

## Firmware (Wokwi-ready sketch)

```cpp
const int RELAY_PINS[5]  = {13, 12, 14, 27, 26};   // fan1, fan2, light1, light2, light3
const int SWITCH_PINS[5] = {32, 33, 25, 4, 5};
const int CURRENT_SENSOR_PIN = 34;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 5; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    pinMode(SWITCH_PINS[i], INPUT_PULLDOWN);
  }
  pinMode(CURRENT_SENSOR_PIN, INPUT);
}

void loop() {
  for (int i = 0; i < 5; i++) {
    bool manualOverride = digitalRead(SWITCH_PINS[i]);
    digitalWrite(RELAY_PINS[i], manualOverride);
  }

  int raw = analogRead(CURRENT_SENSOR_PIN);         // 0-4095 on ESP32's 12-bit ADC
  float voltage = (raw / 4095.0) * 3.3;              // ADC counts -> volts
  float amps = (voltage - 2.5) / 0.185;              // ACS712-05B: 185mV/A, 2.5V @ 0A
  float watts = amps * 220.0;                        // assuming 220V mains

  Serial.printf("Sensed branch: %.2fA (%.1fW)\n", amps, watts);

  // In a real deployment, this is where you'd HTTP POST
  // { deviceId, status, wattage, timestamp } to the backend.
  // This build's live demo instead runs the software simulator
  // (backend/src/simulator.js) — an explicitly allowed shortcut
  // since Wokwi can't reach the public internet.

  delay(1000);
}
```

## Why this satisfies "makes physical sense"

- The ESP32 never switches mains current directly — it only ever drives a
  relay coil, which is the standard, safe separation between logic-level
  and load-level circuits.
- Manual switches are wired as digital inputs, not just simulated in
  software, so the design reflects that a real employee could physically
  override a device.
- The current sensor is placed in series with the load it measures, which
  is the only position from which it can actually sense current — not
  just tapped onto a signal wire.
- LEDs each have a series resistor sized to limit current to a safe range
  for both the LED and the GPIO/relay driving it.

Build this circuit yourself in Wokwi (wokwi.com → new ESP32 project) using
the components and pin table above, save a screenshot to
`docs/circuit-schematic.png`, and drop the project's shareable link into
`docs/wokwi-link.md`.
