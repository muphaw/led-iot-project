// #include <WiFi.h>
// #include <WiFiClientSecure.h>
// #include <PubSubClient.h>
// #include <WiFiManager.h>
// #include <FastLED.h> // Re-added the FastLED engine library

// // ⚠️ PASTE YOUR HIVEMQ DETAILS HERE (Do not include "wss://" or ports here)
// const char* mqtt_server = "2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud";
// const int mqtt_port = 8883;                         // Secure TLS Port for ESP32
// const char* mqtt_user = "smartled";                // The username you created in Authentication
// const char* mqtt_pass = "12345Abcde";               // The password you created in Authentication
// const char* topic = "home/led/control";

// // ================= FASTLED CONFIGURATION =================
// #define LED_PIN 12
// #define NUM_LEDS 8
// CRGB leds[NUM_LEDS];

// int currentR = 255;
// int currentG = 0;
// int currentB = 0;
// int manualBrightness = 50;

// WiFiClientSecure espClient;
// PubSubClient client(espClient);

// // Helper function to safely update the entire physical array matching your old logic
// void setLED(bool state) {
//   FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));

//   if (state) {
//     fill_solid(leds, NUM_LEDS, CRGB(currentR, currentG, currentB));
//   } else {
//     fill_solid(leds, NUM_LEDS, CRGB::Black);
//   }
//   FastLED.show();
// }

// void callback(char* topic, byte* payload, unsigned int length) {
//   Serial.print("Message arrived on topic: ");
//   Serial.println(topic);

//   // Convert the payload data bytes into a standard null-terminated string
//   String message = "";
//   for (unsigned int i = 0; i < length; i++) {
//     message += (char)payload[i];
//   }
//   Serial.println("Payload string received: " + message);

//   // 1. Check for standard structural text matching flat on/off toggles
//   if (message == "on") {
//     setLED(true);
//     Serial.println("🟢 Strip Triggered: ON");
//   } 
//   else if (message == "off") {
//     setLED(false);
//     Serial.println("⚪️ Strip Triggered: OFF");
//   }
//   // 2. Parse out color payloads string matching frontend "color:r,g,b" 
//   else if (message.startsWith("color:")) {
//     String data = message.substring(6); // Snip out "color:"
    
//     // Split the comma separated value parameters 
//     int firstComma = data.indexOf(',');
//     int secondComma = data.indexOf(',', firstComma + 1);
    
//     if (firstComma != -1 && secondComma != -1) {
//       currentR = data.substring(0, firstComma).toInt();
//       currentG = data.substring(firstComma + 1, secondComma).toInt();
//       currentB = data.substring(secondComma + 1).toInt();
      
//       // Update the active physical color arrays matrix instantly
//       setLED(true); 
//       Serial.printf("🎨 Color Sync -> R: %d, G: %d, B: %d\n", currentR, currentG, currentB);
//     }
//   }
//   // 3. Parse out brightness payloads matching frontend "brightness:value"
//   else if (message.startsWith("brightness:")) {
//     int value = message.substring(11).toInt();
//     manualBrightness = constrain(value, 0, 100);
    
//     FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));
//     FastLED.show();
//     Serial.printf("🔆 Brightness Sync -> %d%%\n", manualBrightness);
//   }
// }

// void reconnect() {
//   while (!client.connected()) {
//     Serial.print("Attempting MQTT cloud connection...");
//     String clientId = "ESP32Client-" + String(random(0, 0xffff), HEX);

//     if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
//       Serial.println("🟢 Connected to HiveMQ Cloud!");
//       client.subscribe(topic);
//     } else {
//       Serial.print("Failed, rc=");
//       Serial.print(client.state());
//       Serial.println(" trying again in 5 seconds");
//       delay(5000);
//     }
//   }
// }

// void setup() {
//   Serial.begin(115200);

//   // Initialize your FastLED matrix engine properties 
//   FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
//   FastLED.setBrightness(50);
//   fill_solid(leds, NUM_LEDS, CRGB::Black); // Clear strip on startup
//   FastLED.show();

//   WiFiManager wm;
//   // NOTE: Comment out the line below after your first successful setup so it remembers your router!
//   wm.resetSettings(); 
  
//   if(!wm.autoConnect("mini-mqtt")) {
//     delay(3000);
//     ESP.restart();
//   }
//   Serial.println("🎯 Wi-Fi Connected!");
//   // Bypasses local provider network blocks
//   IPAddress google_DNS(8, 8, 8, 8);
//   WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, google_DNS);

//   // Skip strict certificate validation for an easier setup handshake
//   espClient.setInsecure();

//   client.setServer(mqtt_server, mqtt_port);
//   client.setCallback(callback);
// }

// void loop() {
//   if (!client.connected()) {
//     reconnect();
//   }
//   client.loop();
// }