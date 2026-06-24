// #include <Arduino.h>
// #include <WiFi.h>
// #include <WebServer.h>
// #include <DNSServer.h>
// #include <WiFiManager.h>
// #include <Firebase_ESP_Client.h>

// // Helper headers for token generation and formatting
// #include "addons/TokenHelper.h"
// #include "addons/RTDBHelper.h"

// // 1. Replace with your actual Web API Key from Firebase Project Settings
// #define API_KEY "AIzaSyAo6MH0bU54zHZ3G6F8L6pyBIMs5C7ulrg"
// #define DATABASE_URL "https://smart-led-91252-default-rtdb.asia-southeast1.firebasedatabase.app"

// const int RED_LED_PIN = 12;

// FirebaseData streamData; // Dedicated Data object for the persistent stream
// FirebaseAuth auth;
// FirebaseConfig config;

// // Callback function: Runs automatically ONLY when the React app updates the value in Firebase
// void streamCallback(FirebaseStream data) {
//   Serial.printf("Stream Data Available... Path: %s, Data: %s\n", data.streamPath().c_str(), data.dataPath().c_str());

//   if (data.dataType() == "int") {
//     int ledState = data.intData();
//     if (ledState == 1) {
//       digitalWrite(RED_LED_PIN, HIGH);
//       Serial.println("🔴 Red LED Status Changed: ON");
//     } else {
//       digitalWrite(RED_LED_PIN, LOW);
//       Serial.println("⚪ Red LED Status Changed: OFF");
//     }
//   }
// }

// // Optional callback to catch stream timeout/network dropouts
// void streamTimeoutCallback(bool timeout) {
//   if (timeout) {
//     Serial.println("Stream timed out, resuming connection...");
//   }
//   if (!streamData.httpConnected()) {
//     Serial.printf("Stream error code: %d, reason: %s\n", streamData.httpCode(), streamData.errorReason().c_str());
//   }
// }

// void setup() {
//   Serial.begin(115200);
//   pinMode(RED_LED_PIN, OUTPUT);
//   digitalWrite(RED_LED_PIN, LOW);

//   // Initialize WiFiManager
//   WiFiManager wm;

//   // Note: If you ever change home networks or need to clear credentials, uncomment the line below:
//   // wm.resetSettings();

//   Serial.println("Launching WiFiManager...");
//   if(!wm.autoConnect("mini-firebase")) {
//     Serial.println("Failed to connect to Wi-Fi. Restarting MCU...");
//     delay(3000);
//     ESP.restart();
//   }

//   Serial.println("🎯 Wi-Fi Connected successfully!");

//   // Assign Firebase configuration
//   config.api_key = API_KEY;
//   config.database_url = DATABASE_URL;

//   // Sign up anonymously to bypass strict authentication rules during testing
//   if (Firebase.signUp(&config, &auth, "", "")) {
//     Serial.println("Firebase Anonymous Auth Success.");
//   } else {
//     Serial.printf("Auth Registration Error: %s\n", config.signer.signupError.message.c_str());
//   }

//   Firebase.begin(&config, &auth);
//   Firebase.reconnectWiFi(true);

//   // Open the active stream listener on the database path
//   if (!Firebase.RTDB.beginStream(&streamData, "/iot_device/control_led")) {
//     Serial.printf("Stream startup error: %s\n", streamData.errorReason().c_str());
//   }

//   // Bind the event handlers
//   Firebase.RTDB.setStreamCallback(&streamData, streamCallback, streamTimeoutCallback);
// }

// void loop() {
//   // The stream runs asynchronously in the background.
//   // You can leave the main loop completely empty!
// }
