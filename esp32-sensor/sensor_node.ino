/**
 * ============================================================
 *  Blockchain Healthcare Logistics — ESP32 IoT Sensor Node
 * ============================================================
 *  Hardware:  ESP32 Dev Board + DS18B20 Temperature Sensor
 *  Reads temperature every 10 seconds and POSTs it to the
 *  live Render backend via HTTPS.
 *
 *  WIRING:
 *  ┌──────────────┬─────────────┐
 *  │  DS18B20 Pin │  ESP32 Pin  │
 *  ├──────────────┼─────────────┤
 *  │  + (VCC)     │  3.3V       │
 *  │  OUT (DATA)  │  GPIO 4     │
 *  │  - (GND)     │  GND        │
 *  └──────────────┴─────────────┘
 *  Note: Module already has pull-up resistor built in.
 *
 *  LIBRARIES TO INSTALL (Arduino IDE → Tools → Manage Libraries):
 *  1. OneWire        by Paul Stoffregen
 *  2. DallasTemperature  by Miles Burton
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ── CONFIG — Edit these values ────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_NAME";       // 2.4GHz only
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* BATCH_ID      = "73ae3cb4-61b3-4223-909e-8627126a5fd0";
const char* SERVER_URL    = "https://blockchain-based-healthcare-logistics.onrender.com";

const int   SEND_INTERVAL_MS = 10000;   // 10 seconds (matches simulator)
// ─────────────────────────────────────────────────────────────

// DS18B20 one-wire data pin
#define ONE_WIRE_PIN 4

OneWire           oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================");
  Serial.println("  Healthcare Logistics — ESP32 Node");
  Serial.println("========================================");

  // Start DS18B20
  sensors.begin();
  Serial.println("[Sensor] DS18B20 initialized on GPIO " + String(ONE_WIRE_PIN));

  // Connect to WiFi
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 30) {
      Serial.println("\n[WiFi] FAILED — Check SSID/Password. Restarting...");
      ESP.restart();
    }
  }

  Serial.println("\n[WiFi] Connected!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("[WiFi] Note: ESP32 only supports 2.4GHz networks");
  Serial.println("----------------------------------------");
  Serial.println("[Batch] ID: " + String(BATCH_ID));
  Serial.println("----------------------------------------\n");
}

// ─────────────────────────────────────────────────────────────
void loop() {
  // Read temperature from DS18B20
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  if (tempC == -127.0 || tempC == 85.0) {
    Serial.println("[ERROR] Sensor disconnected or not detected on GPIO " + String(ONE_WIRE_PIN));
    Serial.println("        Check wiring: + → 3.3V,  OUT → GPIO4,  - → GND");
    delay(SEND_INTERVAL_MS);
    return;
  }

  Serial.println("──────────────────────────────────────");
  Serial.print("[Sensor] Temperature: ");
  Serial.print(tempC, 1);
  Serial.println(" °C");

  // Build the POST URL
  String url = String(SERVER_URL)
               + "/api/batch/add-temperature/"
               + String(BATCH_ID);

  // Build JSON body
  String jsonBody = "{\"temperature\":" + String(tempC, 1) + "}";

  Serial.println("[HTTP]  POST → " + url);
  Serial.println("[HTTP]  Body: " + jsonBody);

  // Send HTTPS request (skip cert verify — fine for project demo)
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonBody);

  if (httpCode > 0) {
    Serial.print("[HTTP]  Response Code: ");
    Serial.println(httpCode);
    if (httpCode == 200 || httpCode == 201) {
      Serial.println("[HTTP]  ✅ Temperature logged successfully!");
    } else {
      String response = http.getString();
      Serial.println("[HTTP]  Response: " + response);
    }
  } else {
    Serial.print("[HTTP]  ❌ Request failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  Serial.println();

  delay(SEND_INTERVAL_MS);
}
