// #include <WiFi.h>
// #include <WiFiManager.h>          
// #include <FastLED.h>
// #include <Firebase_ESP_Client.h> 
// #include <arduinoFFT.h>
// #include <time.h>

// // ================= FIREBASE INITIALIZATION =================
// #define FIREBASE_HOST "led-iot-31edf-default-rtdb.asia-southeast1.firebasedatabase.app" 
// #define FIREBASE_AUTH "AIzaSyBWJbn078kC33F5UC3C-kFkcYDnMvyDIcU"

// FirebaseData fbdo;      
// FirebaseData stream;    

// FirebaseConfig config;
// FirebaseAuth auth;

// // ================= LED STRIP =================
// #define LED_PIN 12
// #define NUM_LEDS 8
// #define PIR_PIN 14
// #define SOUND_PIN 34
// #define TRIGGER_PIN 0             

// CRGB leds[NUM_LEDS];

// bool ledState = false;
// bool motionEnabled = false;
// bool musicMode = false;

// int currentR = 255;
// int currentG = 0;
// int currentB = 0;

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

// // ================= TIMERS & ANIMATIONS =================
// bool timerActive = false;
// bool timerPaused = false;
// unsigned long timerEndTime = 0;
// unsigned long pausedRemaining = 0;
// unsigned long lastCountdownUpdate = 0;
// String currentTimerAction = "on";

// bool alarmEnabled = false;
// bool alarmTriggered = false;
// String alarmTime = "";
// String alarmAnimation = "blink";
// int alarmR = 255, alarmG = 150, alarmB = 0;
// String alarmAction = "on";

// bool animationRunning = false;
// String activeAnimationType = "";
// unsigned long animationStartTime = 0;
// unsigned long sunsetDuration = 30000;
// uint8_t rainbowHue = 0;

// int targetR = 255, targetG = 0, targetB = 0;
// String targetAnimation = "blink";
// int backupR = 255, backupG = 255, backupB = 255;

// // ================= LED ENGINE CORE =================
// void setLED(bool state) {
//   ledState = state;
//   int safeBrightness = (manualBrightness <= 0) ? 50 : manualBrightness;
//   FastLED.setBrightness(map(safeBrightness, 0, 100, 10, 255));
  
//   Serial.print("[HARDWARE ENGINE] -> setLED called! State: ");
//   if (state) {
//     Serial.printf("ON | Color: RGB(%d, %d, %d) | Brightness: %d%%\n", currentR, currentG, currentB, safeBrightness);
//   } else {
//     Serial.println("OFF | Stripping colors to Black");
//   }

//   for (int i = 0; i < NUM_LEDS; i++) {
//     leds[i] = state ? CRGB(currentR, currentG, currentB) : CRGB::Black;
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
//   int targetBrightness = map(manualBrightness, 0, 100, 10, 255);

//   if (activeAnimationType == "fade") {
//     float progress = (float)(millis() - animationStartTime) / 3000.0;
//     progress = constrain(progress, 0.0, 1.0);
//     FastLED.setBrightness(pow(progress, 2.2) * targetBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(currentR, currentG, currentB);
//     FastLED.show();
//     if (progress >= 1.0) animationRunning = false;
//   }
//   else if (activeAnimationType == "fade_out") {
//     float progress = (float)(millis() - animationStartTime) / (float)sunsetDuration;
//     progress = constrain(progress, 0.0, 1.0);
//     FastLED.setBrightness((1.0 - pow(progress, 2.2)) * targetBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(currentR, currentG, currentB);
//     FastLED.show();
//     if (progress >= 1.0) { animationRunning = false; setLED(false); }
//   }
//   else if (activeAnimationType == "blink") {
//     bool toggle = ((millis() - animationStartTime) / 500) % 2 == 0;
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = toggle ? CRGB(currentR, currentG, currentB) : CRGB::Black;
//     FastLED.show();
//   }
//   else if (activeAnimationType == "rainbow") {
//     fill_rainbow(leds, NUM_LEDS, rainbowHue++, 25);
//     FastLED.show();
//   }
// }

// // ================= STREAM CALLBACK ENGINE =================
// void streamCallback(FirebaseStream data) {
//   String path = data.dataPath();
  
//   // Clean off leading slash to keep string evaluations clean and straightforward
//   if (path.startsWith("/")) {
//     path = path.substring(1);
//   }

//   Serial.println("\n--- [STREAM DATA EVENT INTERCEPTED] ---");
//   Serial.print("Normalized Path: "); Serial.println(path);
//   Serial.print("Data Payload Type: "); Serial.println(data.dataType());

//   // Handle Full JSON Structure Updates
//   if (data.dataType() == "json") {
//     FirebaseJson *json = data.jsonObjectPtr();
//     FirebaseJsonData jsonData;

//     if (json->get(jsonData, "device_state/isOn")) ledState = jsonData.boolValue;
//     if (json->get(jsonData, "device_state/brightness")) manualBrightness = jsonData.intValue;
//     if (json->get(jsonData, "device_state/color/r")) currentR = jsonData.intValue;
//     if (json->get(jsonData, "device_state/color/g")) currentG = jsonData.intValue;
//     if (json->get(jsonData, "device_state/color/b")) currentB = jsonData.intValue;
//     if (json->get(jsonData, "device_state/sensors/motionEnabled")) motionEnabled = jsonData.boolValue;
//     if (json->get(jsonData, "device_state/sensors/musicEnabled")) musicMode = jsonData.boolValue;

//     Serial.print("-> Initial Sync Complete. Power Level: ");
//     Serial.println(ledState ? "ON" : "OFF");

//     setLED(ledState);
//     Serial.println("----------------------------------------\n");
//     return;
//   }

//   // Handle Single Value Changes from React Client Sets
//   if (path == "device_state/isOn") {
//     bool newState = data.boolData();
//     Serial.print("-> Power State Changed: "); Serial.println(newState ? "ON" : "OFF");
//     setLED(newState);
//   }
//   else if (path == "device_state/brightness") {
//     manualBrightness = data.intData();
//     FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));
//     FastLED.show();
//     Serial.print("-> Brightness Level Updated: "); Serial.println(manualBrightness);
//   }
//   else if (path.startsWith("device_state/color")) {
//     if (path == "device_state/color") {
//       FirebaseJson json = data.jsonObject();
//       FirebaseJsonData r, g, b;
//       json.get(r, "r"); json.get(g, "g"); json.get(b, "b");
//       currentR = r.intValue; currentG = g.intValue; currentB = b.intValue;
//     } else if (path == "device_state/color/r") { currentR = data.intData(); }
//     else if (path == "device_state/color/g") { currentG = data.intData(); }
//     else if (path == "device_state/color/b") { currentB = data.intData(); }
    
//     Serial.printf("-> Active Color Vector Set: RGB(%d, %d, %d)\n", currentR, currentG, currentB);
//     if (ledState) setLED(true);
//   }
//   else if (path == "device_state/sensors/motionEnabled") {
//     motionEnabled = data.boolData();
//     Serial.print("-> Motion Tracking: "); Serial.println(motionEnabled ? "ENABLED" : "DISABLED");
//   }
//   else if (path == "device_state/sensors/musicEnabled") {
//     musicMode = data.boolData();
//     Serial.print("-> Music Mode Sync: "); Serial.println(musicMode ? "ENABLED" : "DISABLED");
//     if (!musicMode) setLED(false);
//   }
//   else if (path == "timer/state") {
//     String state = data.stringData();
//     if (state == "running") {
//       if (timerPaused) {
//         timerEndTime = millis() + pausedRemaining;
//         timerPaused = false;
//       } else {
//         timerActive = true; timerPaused = false;
//       }
//     } else if (state == "paused") {
//       timerPaused = true;
//       pausedRemaining = timerEndTime - millis();
//     } else if (state == "idle") {
//       timerActive = false; timerPaused = false;
//     }
//   }
//   else if (path == "timer/remainingSeconds" && !timerActive) {
//     pausedRemaining = data.intData() * 1000UL;
//     timerEndTime = millis() + pausedRemaining;
//   }
  
//   Serial.println("----------------------------------------\n");
// }

// void streamTimeoutCallback(bool timeout) {
//   if (timeout) Serial.println("Stream timeout occurred, adjusting reconnect loops...");
// }

// void checkAlarmTime(struct tm* timeinfo) {
//   char currentFormatted[6];
//   sprintf(currentFormatted, "%02d:%02d", timeinfo->tm_hour, timeinfo->tm_min);
  
//   if (alarmTime == String(currentFormatted)) {
//     alarmTriggered = true;
//     if (alarmAction == "off") {
//       sunsetDuration = 10000;
//       startTriggerAnimation("fade_out");
//     } else {
//       currentR = alarmR; currentG = alarmG; currentB = alarmB;
//       setColor(currentR, currentG, currentB);
//       startTriggerAnimation(alarmAnimation);
//     }
//   }
// }

// void readAudioFFT() {
//   for (int i = 0; i < SAMPLES; i++) {
//     vReal[i] = analogRead(SOUND_PIN); vImag[i] = 0;
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

//   if (level > displayLevel) displayLevel += 0.6; else displayLevel -= 0.25;
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

// void setup() {
//   Serial.begin(115200);
  
//   fbdo.clear();
//   stream.clear();
  
//   pinMode(PIR_PIN, INPUT);
//   pinMode(TRIGGER_PIN, INPUT_PULLUP);

//   FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
//   setLED(false);

//   WiFiManager wm;
//   wm.autoConnect("ESP32_Config_AP");

//   configTime(6 * 3600 + 1800, 0, "pool.ntp.org");

//   // Re-establishing configurations
//   config.api_key = FIREBASE_AUTH;
//   config.database_url = FIREBASE_HOST;

//   // Sign in anonymously to clear credentials engine mapping completely
//   auth.user.email = "";
//   auth.user.password = "";

//   Firebase.begin(&config, &auth);
//   Firebase.reconnectWiFi(true);

//   Serial.println("Establishing Firebase Realtime Database stream...");
  
//   // 🔥 FIX: Listen to "/led" folder instead of dropping down to device_state directly
//   if (!Firebase.RTDB.beginStream(&stream, "/led")) {
//     Serial.println("❌ Stream connection error: " + stream.errorReason());
//   } else {
//     Serial.println("✅ Firebase Stream Connected Successfully! Listening for changes...");
//   }

//   Serial.println("🔥 Testing Firebase connection...");
//   if (Firebase.RTDB.setBool(&fbdo, "/led/test", true)) {
//     Serial.println("✅ Write test OK");
//   } else {
//     Serial.println("❌ Write test FAILED");
//     Serial.println(fbdo.errorReason());
//   }

//   Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);
// }

// void loop() {
//   if (animationRunning && !timerPaused) runActiveAnimation();

//   if (digitalRead(TRIGGER_PIN) == LOW) {
//     delay(50);
//     if (digitalRead(TRIGGER_PIN) == LOW) { WiFiManager wm; wm.resetSettings(); ESP.restart(); }
//   }

//   if (motionEnabled && !ledState && !animationRunning && !timerActive) {
//     motionState = digitalRead(PIR_PIN);
//     if (motionState == HIGH) { lastMotionTime = millis(); setLED(true); }
//     if (ledState && (millis() - lastMotionTime > holdTime)) setLED(false);
//   }

//   if (timerActive && !timerPaused) {
//     if (millis() >= timerEndTime) {
//       timerActive = false;
//       Firebase.RTDB.setString(&fbdo, "/led/timer/state", "idle");
//       Firebase.RTDB.setInt(&fbdo, "/led/timer/remainingSeconds", 0);

//       if (currentTimerAction == "off") {
//         stopTriggerAnimation(); setLED(false);
//       } else {
//         currentR = targetR; currentG = targetG; currentB = targetB;
//         setColor(currentR, currentG, currentB);
//         startTriggerAnimation(targetAnimation);
//       }
//     } 
//     else if (millis() - lastCountdownUpdate >= 1000) {
//       lastCountdownUpdate = millis();
//       long secLeft = (timerEndTime - millis()) / 1000;
//       Firebase.RTDB.setInt(&fbdo, "/led/timer/remainingSeconds", max(0L, secLeft));
//     }
//   }

//   if (alarmEnabled && !alarmTriggered) {
//     struct tm timeinfo;
//     if (getLocalTime(&timeinfo)) checkAlarmTime(&timeinfo);
//   }

//   if (musicMode && !animationRunning && !timerActive) readAudioFFT();
// }