// #include <WiFi.h>
// #include <WiFiClientSecure.h>
// #include <PubSubClient.h>
// #include <WiFiManager.h>

// // ⚠️ PASTE YOUR HIVEMQ DETAILS HERE (Do not include "wss://" or ports here)
// const char* mqtt_server = "2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud";
// const int mqtt_port = 8883;                            // Secure TLS Port for ESP32
// const char* mqtt_user = "smartled";               // The username you created in Authentication
// const char* mqtt_pass = "12345Abcde";               // The password you created in Authentication
// const char* topic = "home/led/control";

// const int RED_LED_PIN = 12;

// WiFiClientSecure espClient;
// PubSubClient client(espClient);

// void callback(char* topic, byte* payload, unsigned int length) {
//   Serial.print("Message arrived on topic: ");
//   Serial.println(topic);

//   if (length > 0) {
//     char status = (char)payload[0];
//     if (status == '1') {
//       digitalWrite(RED_LED_PIN, HIGH);
//       Serial.println("🔴 LED: ON");
//     } else if (status == '0') {
//       digitalWrite(RED_LED_PIN, LOW);
//       Serial.println("⚪ LED: OFF");
//     }
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
//   pinMode(RED_LED_PIN, OUTPUT);
//   digitalWrite(RED_LED_PIN, LOW);

//   WiFiManager wm;
//   if(!wm.autoConnect("ESP32_Config_AP")) {
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
