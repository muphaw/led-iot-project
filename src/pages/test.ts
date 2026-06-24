// #include <WiFi.h>
// #include <WiFiClientSecure.h>
// #include <PubSubClient.h>         // Installed via Library Manager
// #include <WiFiManager.h>
// #include <FastLED.h>
// #include <arduinoFFT.h>
// #include <time.h>

// // ================= HIVEMQ MQTT CONFIGURATION =================
// // ⚠️ PASTE YOUR HIVEMQ DETAILS HERE (Do not include "wss://" or ports here)
// const char* mqtt_server = "2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud";
// const int mqtt_port = 8883;                            // Secure TLS Port
// const char* mqtt_user = "smartled";               // Created in Authentication tab
// const char* mqtt_pass = "12345Abcde";               // Created in Authentication tab

// // Target Topic Path
// const char* command_topic = "home/led/control";

// WiFiClientSecure espClient;
// PubSubClient client(espClient);

// // ================= LED STRIP =================
// #define LED_PIN 12
// #define NUM_LEDS 8
// #define PIR_PIN 14
// #define SOUND_PIN 34
// #define TRIGGER_PIN 0             // Physical BOOT button on ESP32

// CRGB leds[NUM_LEDS];

// bool ledState = false;
// bool motionEnabled = false;
// bool musicMode = false;

// // ================= COLOR =================
// int currentR = 255;
// int currentG = 0;
// int currentB = 0;

// // ================= PIR / FFT =================
// int motionState = LOW;
// unsigned long lastMotionTime = 0;
// const unsigned long holdTime = 2000;

// #define SAMPLES 128
// double vReal[SAMPLES];
// double vImag[SAMPLES];
// ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, SAMPLES, 100);

// int manualBrightness = 50;
// float displayLevel = 0;
// float globalBrightness = 80;

// // ================= TRANSITIONS =================
// bool sunriseActive = false;
// unsigned long sunriseStartTime = 0;
// unsigned long sunriseDuration = 30000;

// bool sunsetActive = false;
// unsigned long sunsetStartTime = 0;
// unsigned long sunsetDuration = 30000;

// // =======================================================
// // POMODORO TIMER ENGINE
// // =======================================================
// bool timerActive = false;
// bool timerPaused = false;
// unsigned long timerEndTime = 0;
// unsigned long pausedRemaining = 0;
// String timerAnimation = "blink";
// String currentTimerAction = "on"; // Tracks if timer turns light ON or OFF

// // ================= ALARM ENGINE =================
// bool alarmEnabled = false;
// bool alarmTriggered = false;
// String alarmTime = "";
// String alarmAnimation = "blink";

// // Animation status tracking
// bool animationRunning = false;
// String activeAnimationType = "";
// unsigned long animationStartTime = 0;
// uint8_t rainbowHue = 0;

// int targetR = 255;
// int targetG = 0;
// int targetB = 0;
// String targetAnimation = "blink";

// int backupR = 255;
// int backupG = 255;
// int backupB = 255;

// // ================= LED CORE FUNCTIONS =================
// void setLED(bool state) {
//   ledState = state;
//   FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));

//   if (state) {
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(currentR, currentG, currentB);
//   } else {
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(0, 0, 0);
//   }
//   FastLED.show();
// }

// void setColor(int r, int g, int b) {
//   currentR = r; currentG = g; currentB = b;
//   if (ledState) {
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(r, g, b);
//     FastLED.show();
//   }
// }

// // ================= ANIMATION ENGINE =================
// void startTriggerAnimation(String animType) {
//   animationRunning = true;
//   activeAnimationType = animType;
//   animationStartTime = millis();
//   ledState = true;
// }

// void stopTriggerAnimation() {
//   animationRunning = false;
//   activeAnimationType = "";
// }

// void runActiveAnimation() {
//   if (!animationRunning) return;

//   static float smoothBrightness = 0;
//   int targetBrightness = map(manualBrightness, 0, 100, 10, 255);

//   if (activeAnimationType != "fade_out") {
//     smoothBrightness += (targetBrightness - smoothBrightness) * 0.08;
//   }

//   if (activeAnimationType == "fade") {
//     float progress = (float)(millis() - animationStartTime) / 3000.0;
//     progress = constrain(progress, 0.0, 1.0);
//     float smoothProgress = pow(progress, 2.2);

//     FastLED.setBrightness(smoothProgress * smoothBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(currentR, currentG, currentB);
//     FastLED.show();

//     if (progress >= 1.0) animationRunning = false;
//   }

//   else if (activeAnimationType == "fade_out") {
//     float progress = (float)(millis() - animationStartTime) / (float)sunsetDuration;
//     progress = constrain(progress, 0.0, 1.0);
//     float smoothProgress = 1.0 - pow(progress, 2.2);

//     int currentFadeBrightness = smoothProgress * targetBrightness;
//     FastLED.setBrightness(currentFadeBrightness);

//     for (int i = 0; i < NUM_LEDS; i++) {
//       leds[i] = CRGB(currentR, currentG, currentB);
//     }
//     FastLED.show();

//     if (progress >= 1.0) {
//       animationRunning = false;
//       setLED(false);
//     }
//   }

//   else if (activeAnimationType == "blink") {
//     bool toggle = ((millis() - animationStartTime) / 500) % 2 == 0;
//     FastLED.setBrightness(smoothBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = toggle ? CRGB(currentR, currentG, currentB) : CRGB::Black;
//     FastLED.show();
//   }

//   else if (activeAnimationType == "wave") {
//     uint8_t timeShift = millis() / 15;
//     int baseBrightness = map(manualBrightness, 0, 100, 20, 255);
//     FastLED.setBrightness(baseBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) {
//       uint8_t wavePhase = i * 25 + timeShift;
//       uint8_t w = sin8(wavePhase);
//       float energy = w / 255.0;
//       energy = sin(energy * PI);
//       uint8_t brightness = energy * 255;
//       leds[i] = CRGB(currentR, currentG, currentB);
//       leds[i].fadeToBlackBy(255 - brightness);
//     }
//     FastLED.show();
//   }

//   else if (activeAnimationType == "rainbow") {
//     FastLED.setBrightness(smoothBrightness);
//     fill_rainbow(leds, NUM_LEDS, rainbowHue++, 25);
//     FastLED.show();
//   }
// }

// // ================= TIME / NTP SYNCHRONIZATION =================
// void syncTime() {
//   configTime(6 * 3600 + 1800, 0, "pool.ntp.org");
//   struct tm timeinfo;
//   if (getLocalTime(&timeinfo)) Serial.println("NTP Time Synced.");
// }

// // ================= FFT AUDIO PROCESSING =================
// void readAudioFFT() {
//   for (int i = 0; i < SAMPLES; i++) {
//     vReal[i] = analogRead(SOUND_PIN);
//     vImag[i] = 0;
//     delayMicroseconds(180);
//   }

//   FFT.windowing(FFTWindow::Hamming, FFTDirection::Forward);
//   FFT.compute(FFTDirection::Forward);
//   FFT.complexToMagnitude();

//   double bass = 0, mid = 0, treble = 0;
//   for (int i = 2; i < 10; i++) bass += vReal[i];
//   for (int i = 10; i < 40; i++) mid += vReal[i];
//   for (int i = 40; i < 80; i++) treble += vReal[i];

//   bass /= 8; mid /= 30; treble /= 40;

//   int level = map(bass + mid + treble, 0, 2000, 0, NUM_LEDS);
//   level = constrain(level, 0, NUM_LEDS);

//   if (level > displayLevel) displayLevel += 0.6;
//   else displayLevel -= 0.25;
//   displayLevel = constrain(displayLevel, 0, NUM_LEDS);

//   float targetBrightness = 50 + (bass * 0.05 + mid * 0.03 + treble * 0.02);
//   globalBrightness += (targetBrightness - globalBrightness) * 0.1;
//   globalBrightness = constrain(globalBrightness, 20, 140);

//   FastLED.setBrightness((int)globalBrightness);

//   for (int i = 0; i < NUM_LEDS; i++) {
//     CRGB color = (i < 2) ? CRGB(0, 180, 180) : (i < 4) ? CRGB(0, 255, 0) : (i < 6) ? CRGB(255, 200, 0) : CRGB(255, 60, 0);
//     leds[i] = (i < (int)displayLevel) ? color : CRGB::Black;
//   }
//   FastLED.show();
// }

// void checkAlarmTime(struct tm* timeinfo) {
//   char currentFormatted[9];
//   sprintf(currentFormatted, "%02d:%02d", timeinfo->tm_hour, timeinfo->tm_min);

//   if (alarmTime == String(currentFormatted)) {
//     Serial.println("ALARM TRIGGERED ✅");
//     alarmTriggered = true;
//     backupR = currentR; backupG = currentG; backupB = currentB;

//     if (alarmAnimation == "fade_out") {
//       stopTriggerAnimation();
//       startTriggerAnimation("fade_out");
//     } else {
//       currentR = targetR; currentG = targetG; currentB = targetB;
//       stopTriggerAnimation();
//       setColor(currentR, currentG, currentB);
//       delay(50);
//       startTriggerAnimation(alarmAnimation);
//       if (alarmAnimation == "" || alarmAnimation == "none") setLED(true);
//     }
//   }
// }

// void handleWiFiReset() {
//   Serial.println("Wi-Fi wiped. Hard rebooting...");
//   delay(1000);
//   WiFiManager wm;
//   wm.resetSettings();
//   ESP.restart();
// }

// // =======================================================
// // MQTT STRING PARSER PIPELINE (Replaces Old URL Paths)
// // =======================================================
// void parseMqttCommand(String message) {
//   Serial.print("Processing MQTT message payload: ");
//   Serial.println(message);

//   // Simple Base Requests
//   if (message == "on") { stopTriggerAnimation(); setLED(true); }
//   else if (message == "off") { stopTriggerAnimation(); setLED(false); }
//   else if (message == "motion/on") { motionEnabled = true; }
//   else if (message == "motion/off") { motionEnabled = false; }
//   else if (message == "music/on") { musicMode = true; }
//   else if (message == "music/off") { musicMode = false; setLED(false); }
//   else if (message == "wifi/reset") { handleWiFiReset(); }

//   // Brightness Control Parsing (Expected payload example: "brightness:75")
//   else if (message.startsWith("brightness:")) {
//     int val = message.substring(11).toInt();
//     manualBrightness = constrain(val, 0, 100);
//     FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));
//     FastLED.show();
//   }

//   // Color Mapping Parsing (Expected payload example: "color:255,128,0")
//   else if (message.startsWith("color:")) {
//     String csv = message.substring(6);
//     int firstComma = csv.indexOf(',');
//     int secondComma = csv.indexOf(',', firstComma + 1);
//     if (firstComma != -1 && secondComma != -1) {
//       int r = csv.substring(0, firstComma).toInt();
//       int g = csv.substring(firstComma + 1, secondComma).toInt();
//       int b = csv.substring(secondComma + 1).toInt();
//       setColor(r, g, b);
//     }
//   }

//   // Timer Control Pipeline Parsing
//   // Expected payload layout: "timer:start|durationSeconds|action|r|g|b|animation"
//   // Example text values: "timer:start|1500|off" or "timer:start|60|on|0|255|0|wave"
//   else if (message.startsWith("timer:start|")) {
//     String data = message.substring(12);
//     int parts[6];
//     int idx = 0;
//     int pos = 0;
//     while ((pos = data.indexOf('|')) != -1 && idx < 6) {
//       parts[idx++] = pos;
//       data.setCharAt(pos, '~'); // placeholder character to advance index tracking
//     }

//     // Reverse string clean separation
//     long totalSeconds = message.substring(12, 12 + data.indexOf('~')).toInt();
//     if (totalSeconds <= 0) return;

//     // Advanced modular extraction matching index marks
//     int nextDelimiter = message.indexOf('|', 12 + data.indexOf('~'));
//     currentTimerAction = (nextDelimiter != -1) ? message.substring(12 + data.indexOf('~') + 1, nextDelimiter) : "on";

//     if (ledState) { backupR = currentR; backupG = currentG; backupB = currentB; }

//     // Parse target values if trailing arguments exist
//     // Setup generic overrides matching structure layouts
//     timerEndTime = millis() + (totalSeconds * 1000UL);
//     timerActive = true;
//     timerPaused = false;
//     pausedRemaining = 0;
//     stopTriggerAnimation();

//     if (currentTimerAction == "off") {
//       sunsetDuration = totalSeconds * 1000UL;
//       startTriggerAnimation("fade_out");
//     }
//   }
//   else if (message == "timer/pause") {
//     if (timerActive && !timerPaused) {
//       pausedRemaining = timerEndTime - millis();
//       timerPaused = true;
//       if (currentTimerAction == "off") animationRunning = false;
//     }
//   }
//   else if (message == "timer/resume") {
//     if (timerActive && timerPaused) {
//       timerEndTime = millis() + pausedRemaining;
//       timerPaused = false;
//       if (currentTimerAction == "off") {
//         sunsetDuration = pausedRemaining;
//         animationStartTime = millis();
//         animationRunning = true;
//       }
//     }
//   }
//   else if (message == "timer/cancel") {
//     timerActive = false; timerPaused = false; pausedRemaining = 0;
//     stopTriggerAnimation();
//     currentR = backupR; currentG = backupG; currentB = backupB;
//     setLED(true);
//   }

//   // Alarm Pipeline Parsing (Expected format payload: "alarm:set|HH:MM|action|r|g|b|animation")
//   else if (message.startsWith("alarm:set|")) {
//     String data = message.substring(10);
//     int firstPipe = data.indexOf('|');
//     if (firstPipe != -1) {
//       alarmTime = data.substring(0, firstPipe);
//       String action = data.substring(firstPipe + 1);
//       if (action.startsWith("off")) {
//         alarmAnimation = "fade_out"; sunsetDuration = 10000;
//       } else {
//         alarmAnimation = "fade";
//       }
//       alarmEnabled = true; alarmTriggered = false;
//     }
//   }
//   else if (message == "alarm/cancel") {
//     alarmTriggered = false; alarmEnabled = false; animationRunning = false; activeAnimationType = "";
//     currentR = backupR; currentG = backupG; currentB = backupB;
//     setLED(true);
//   }
// }

// // ================= MQTT MAIN CALLBACK BRIDGE =================
// void mqttCallback(char* topic, byte* payload, unsigned int length) {
//   String message = "";
//   for (unsigned int i = 0; i < length; i++) {
//     message += (char)payload[i];
//   }
//   parseMqttCommand(message);
// }

// void reconnectMqtt() {
//   while (!client.connected()) {
//     Serial.print("Connecting to HiveMQ Cloud Broker Thread...");
//     String clientId = "LumenOSBridge-" + String(random(0, 0xffff), HEX);

//     if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
//       Serial.println("🟢 Connected to HiveMQ Cloud!");
//       client.subscribe(command_topic);
//     } else {
//       Serial.print("Failed string code runtime handle, rc=");
//       Serial.print(client.state());
//       Serial.println(" retrying line connection in 5 seconds");
//       delay(5000);
//     }
//   }
// }

// // ================= SETUP =================
// void setup() {
//   Serial.begin(115200);
//   pinMode(PIR_PIN, INPUT);
//   pinMode(TRIGGER_PIN, INPUT_PULLUP);

//   FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
//   FastLED.setBrightness(50);
//   fill_solid(leds, NUM_LEDS, CRGB::Black);
//   FastLED.show();

//   WiFiManager wm;
//   wm.setConfigPortalTimeout(180);
//   if (!wm.autoConnect("full-mqtt")) { delay(3000); ESP.restart(); }

//   Serial.print("Assigned Node Network Link IP: ");
//   Serial.println(WiFi.localIP());
//   syncTime();

//   // Secure SSL Handshake Config Initialization
//   espClient.setInsecure(); // Skips certificate file storage parameters for ease of execution

//   client.setServer(mqtt_server, mqtt_port);
//   client.setCallback(mqttCallback);
// }

// // ================= MAIN RUNTIME LOOP =================
// void loop() {
//   // Ensure background MQTT client thread execution is processing loops
//   if (!client.connected()) {
//     reconnectMqtt();
//   }
//   client.loop();

//   if (animationRunning && !timerPaused) {
//     runActiveAnimation();
//   }

//   if (digitalRead(TRIGGER_PIN) == LOW) {
//     delay(50);
//     if (digitalRead(TRIGGER_PIN) == LOW) handleWiFiReset();
//   }

//   if (motionEnabled && !animationRunning && !timerActive) {
//     motionState = digitalRead(PIR_PIN);
//     if (motionState == HIGH) { lastMotionTime = millis(); setLED(true); }
//     if (millis() - lastMotionTime > holdTime) setLED(false);
//   }

//   if (timerActive && !timerPaused) {
//     if (millis() >= timerEndTime) {
//       timerActive = false;
//       pausedRemaining = 0;

//       if (currentTimerAction == "off") {
//         stopTriggerAnimation();
//         setLED(false);
//       } else {
//         currentR = targetR; currentG = targetG; currentB = targetB;
//         timerAnimation = targetAnimation;
//         setColor(currentR, currentG, currentB);
//         startTriggerAnimation(timerAnimation);
//       }
//     }
//   }

//   if (alarmEnabled && !alarmTriggered) {
//     struct tm timeinfo;
//     if (getLocalTime(&timeinfo)) checkAlarmTime(&timeinfo);
//   }

//   if (musicMode && !animationRunning && !timerActive) {
//     readAudioFFT();
//   }
// }
