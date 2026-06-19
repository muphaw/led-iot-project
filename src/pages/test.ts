// #include <WiFi.h>
// #include <WebServer.h>
// #include <DNSServer.h>
// #include <WiFiManager.h>          
// #include <FastLED.h>
// #include <arduinoFFT.h>
// #include <time.h>

// // ================= WEB SERVER =================
// WebServer server(80);

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
// // POMODORO TIMER ENGINE (UPDATED TO MATCH REACT PARAMS)
// // =======================================================
// bool timerActive = false;
// bool timerPaused = false;

// unsigned long timerEndTime = 0;
// unsigned long pausedRemaining = 0;

// String timerAnimation = "blink";

// // =======================================================
// // ALARM ENGINE
// // =======================================================
// bool alarmEnabled = false;
// bool alarmTriggered = false;
// String alarmTime = "";
// String alarmAnimation = "blink";

// // Animation status tracking
// bool animationRunning = false;
// String activeAnimationType = "";
// unsigned long animationStartTime = 0;
// uint8_t rainbowHue = 0;

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
//   setLED(false);
// }

// void runActiveAnimation() {

//   if (!animationRunning) return;

//   // ================= SMOOTH MASTER BRIGHTNESS =================
//   static float smoothBrightness = 0;
//   int targetBrightness = map(manualBrightness, 0, 100, 10, 255);
//   smoothBrightness += (targetBrightness - smoothBrightness) * 0.08; // smoothing factor

//   // ================= FADE =================
//   if (activeAnimationType == "fade") {

//     float progress = (float)(millis() - animationStartTime) / 3000.0;
//     progress = constrain(progress, 0.0, 1.0);

//     // Smooth curve (IMPORTANT: makes fade feel natural)
//     float smoothProgress = pow(progress, 2.2);  // gamma correction

//     FastLED.setBrightness(smoothProgress * smoothBrightness);

//     for (int i = 0; i < NUM_LEDS; i++) {
//       leds[i] = CRGB(currentR, currentG, currentB);
//     }

//     FastLED.show();

//     if (progress >= 1.0) {
//       animationRunning = false;
//     }
//   }

//   // ================= BLINK (unchanged but stable) =================
//   else if (activeAnimationType == "blink") {

//     bool toggle = ((millis() - animationStartTime) / 500) % 2 == 0;

//     FastLED.setBrightness(smoothBrightness);

//     for (int i = 0; i < NUM_LEDS; i++) {
//       leds[i] = toggle
//         ? CRGB(currentR, currentG, currentB)
//         : CRGB::Black;
//     }

//     FastLED.show();
//   }

//   // ================= SMOOTH WAVE (FIXED) =================
//   else if (activeAnimationType == "wave") {

//   uint8_t timeShift = millis() / 15;  // smooth motion speed

//   int baseBrightness = map(manualBrightness, 0, 100, 20, 255);
//   FastLED.setBrightness(baseBrightness);

//   for (int i = 0; i < NUM_LEDS; i++) {

//     // 🔥 continuous phase (same idea as rainbow hue shift)
//     uint8_t wavePhase = i * 25 + timeShift;

//     // smooth sine wave field
//     uint8_t w = sin8(wavePhase);

//     // convert to smooth 0–1 energy
//     float energy = w / 255.0;

//     // soften curve (removes flicker)
//     energy = sin(energy * PI);

//     // final brightness per LED
//     uint8_t brightness = energy * 255;

//     leds[i] = CRGB(currentR, currentG, currentB);
//     leds[i].fadeToBlackBy(255 - brightness);
//   }

//   FastLED.show();
// }

//   // ================= RAINBOW =================
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

// // ================= CORS HEADERS FORMATION =================
// void sendCORSHeaders() {
//   server.sendHeader("Access-Control-Allow-Origin", "*");
//   server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
//   server.sendHeader("Access-Control-Allow-Headers", "*");
// }

// void handleRoot() { sendCORSHeaders(); server.send(200, "text/plain", "Lumen OS Bridge Online"); }
// void handleOn() { sendCORSHeaders(); stopTriggerAnimation(); setLED(true); server.send(200, "text/plain", "LED ON"); }
// void handleOff() { sendCORSHeaders(); stopTriggerAnimation(); setLED(false); server.send(200, "text/plain", "LED OFF"); }

// void handleColor() {
//   sendCORSHeaders();
//   if (server.hasArg("r") && server.hasArg("g") && server.hasArg("b")) {
//     setColor(server.arg("r").toInt(), server.arg("g").toInt(), server.arg("b").toInt());
//     server.send(200, "text/plain", "Color Updated");
//   } else {
//     server.send(400, "text/plain", "Missing RGB Matrix Data");
//   }
// }

// void handleMotionOn() { sendCORSHeaders(); motionEnabled = true; server.send(200, "text/plain", "PIR Enabled"); }
// void handleMotionOff() { sendCORSHeaders(); motionEnabled = false; server.send(200, "text/plain", "PIR Disabled"); }
// void handleMusicOn() { sendCORSHeaders(); musicMode = true; server.send(200, "text/plain", "FFT Mode ON"); }
// void handleMusicOff() { sendCORSHeaders(); musicMode = false; setLED(false); server.send(200, "text/plain", "FFT Mode OFF"); }

// // ================= LIVE POLLING STATE API (MATCHED TO FRONTEND) =================
// void handleTimerStatus() {
//   sendCORSHeaders();

//   long remainingMs = 0;
//   String state = "idle";

//   if (animationRunning) {
//     state = "done";
//   }
//   else if (timerActive) {

//     state = "running";

//     if (timerPaused)
//       remainingMs = pausedRemaining;
//     else
//       remainingMs = max(0L, (long)(timerEndTime - millis()));
//   }

//   long remainingSeconds = (remainingMs + 999) / 1000;

//   String json = "{";
//   json += "\"state\":\"" + state + "\",";
//   json += "\"remainingSeconds\":" + String(remainingSeconds) + ",";
//   json += "\"activeAnimation\":\"" + activeAnimationType + "\"";
//   json += "}";

//   server.send(200, "application/json", json);
// }

// // ================= TIMER CONTROLS (UPDATED TO EXPECT H, M, S) =================
// void handleStartTimer() {
//   sendCORSHeaders();

//   long h = server.hasArg("hour") ? server.arg("hour").toInt() : 0;
//   long m = server.hasArg("min") ? server.arg("min").toInt() : 0;
//   long s = server.hasArg("second") ? server.arg("second").toInt() : 0;

//   long totalSeconds = h * 3600 + m * 60 + s;

//   if (totalSeconds <= 0) {
//     server.send(400, "text/plain", "Invalid Timer");
//     return;
//   }

//   if (server.hasArg("r")) currentR = server.arg("r").toInt();
//   if (server.hasArg("g")) currentG = server.arg("g").toInt();
//   if (server.hasArg("b")) currentB = server.arg("b").toInt();

//   timerAnimation = server.hasArg("animation")
//                      ? server.arg("animation")
//                      : "blink";

//   timerEndTime = millis() + (totalSeconds * 1000UL);

//   timerActive = true;
//   timerPaused = false;
//   pausedRemaining = 0;

//   stopTriggerAnimation();

//   server.send(200, "text/plain", "Timer Started");
// }

// void handlePauseTimer() {
//   sendCORSHeaders();

//   if (!timerActive || timerPaused) {
//     server.send(400, "text/plain", "Timer not running");
//     return;
//   }

//   pausedRemaining = timerEndTime - millis();

//   timerPaused = true;

//   server.send(200, "text/plain", "Paused");
// }

// void handleResumeTimer() {
//   sendCORSHeaders();

//   if (!timerActive || !timerPaused) {
//     server.send(400, "text/plain", "Timer not paused");
//     return;
//   }

//   timerEndTime = millis() + pausedRemaining;

//   timerPaused = false;

//   server.send(200, "text/plain", "Resumed");
// }

// void handleCancelTimer() {
//   sendCORSHeaders();

//   timerActive = false;
//   timerPaused = false;
//   pausedRemaining = 0;

//   stopTriggerAnimation();

//   server.send(200, "text/plain", "Canceled");
// }

// // ================= ALARM CONTROLS =================
// void handleAlarm() {
//   sendCORSHeaders();
//   if (!server.hasArg("time") || !server.hasArg("r") || !server.hasArg("g") || !server.hasArg("b")) {
//     server.send(400, "text/plain", "Missing context parameters");
//     return;
//   }
//   alarmTime = server.arg("time"); // Expected format: "HH:MM AM" or "HH:MM PM" from formatAlarm()
//   currentR = server.arg("r").toInt();
//   currentG = server.arg("g").toInt();
//   currentB = server.arg("b").toInt();
//   alarmAnimation = server.hasArg("animation") ? server.arg("animation") : "fade";
  
//   alarmEnabled = true;
//   alarmTriggered = false;
//   server.send(200, "text/plain", "Alarm Registered");
// }

// void handleCancelAlarm() {
//   sendCORSHeaders();
//   alarmTriggered = false;
//   alarmEnabled = false;
//   stopTriggerAnimation();
//   server.send(200, "text/plain", "Alarm Canceled");
// }

// void handleWiFiReset() {
//   sendCORSHeaders();
//   server.send(200, "text/plain", "Wi-Fi wiped. Hard rebooting...");
//   delay(1000);
//   WiFiManager wm;
//   wm.resetSettings();
//   ESP.restart();
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

// void handleBrightness() {
//   sendCORSHeaders();
//   if (server.hasArg("value")) {
//     manualBrightness = constrain(server.arg("value").toInt(), 0, 100);
//     FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));
//     FastLED.show();
//     server.send(200, "text/plain", "Brightness Updated");
//   } else {
//     server.send(400, "text/plain", "Missing value");
//   }
// }

// // ================= REAL-TIME NTP COMPLIANT ALARM CHECK =================
// void checkAlarmTime(struct tm* timeinfo) {
//   char currentFormatted[9];
//   int hr12 = timeinfo->tm_hour % 12;
//   if (hr12 == 0) hr12 = 12;
//   const char* ampm = (timeinfo->tm_hour >= 12) ? "PM" : "AM";
  
//   // Format matching formatAlarm util output exactly: "HH:MM AM"
//   sprintf(currentFormatted, "%02d:%02d", timeinfo->tm_hour, timeinfo->tm_min);

//   Serial.print("Alarm set: ");
//   Serial.println(alarmTime);

//   Serial.print("Current time: ");
//   Serial.println(currentFormatted);
  
//   if (alarmTime == String(currentFormatted)) {

//     Serial.println("ALARM TRIGGERED ✅");

//   alarmTriggered = true;

//   // STOP everything first
//   stopTriggerAnimation();

//   // FORCE immediate visible state (IMPORTANT FIX)
//   setLED(true);
//   FastLED.show();

//   delay(50); // tiny visual sync buffer

//   // NOW start animation
//   startTriggerAnimation(alarmAnimation);

//   // safety fallback: if animation is empty
//   if (alarmAnimation == "" || alarmAnimation == "none") {
//     setLED(true);
//   }
// }
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
  
//   if (!wm.autoConnect("ESP32_Config_AP")) {
//     delay(3000);
//     ESP.restart();
//   }

//   Serial.print("Assigned Node IP: ");
//   Serial.println(WiFi.localIP());

//   syncTime();

//   // --- API Routes (Perfect Alignment mapping to your Manual.tsx architecture) ---
//   server.on("/", handleRoot);
//   server.on("/on", handleOn);
//   server.on("/off", handleOff);
//   server.on("/color", handleColor);
//   server.on("/motion/on", handleMotionOn);
//   server.on("/motion/off", handleMotionOff);
//   server.on("/music/on", handleMusicOn);
//   server.on("/music/off", handleMusicOff);
//   server.on("/brightness", handleBrightness);
//   server.on("/wifi/reset", handleWiFiReset);

//   // Re-aligned Layout Routes
//   server.on("/timer", handleStartTimer);             // Matches: fetch(`${ESP32_BASE_URL}/timer?...`)
//   server.on("/timer/pause", handlePauseTimer);       // Matches: fetch(`${ESP32_BASE_URL}/timer/pause`)
//   server.on("/timer/resume", handleResumeTimer);     // Matches: fetch(`${ESP32_BASE_URL}/timer/resume`)
//   server.on("/timer/cancel", handleCancelTimer);     // Matches: fetch(`${ESP32_BASE_URL}/timer/cancel`)
//   server.on("/timer/status", handleTimerStatus);     // Matches: fetch(`${ESP32_BASE_URL}/timer/status`)
  
//   server.on("/alarm", handleAlarm);                  // Matches: fetch(`${ESP32_BASE_URL}/alarm?...`)
//   server.on("/alarm/off", handleCancelAlarm);        // Matches: fetch(`${ESP32_BASE_URL}/alarm/off`)
//   server.begin();
//   Serial.println("HTTP Server Running.");
// }

// // ================= MAIN RUNTIME LOOP =================
// void loop() {
//   server.handleClient();
  
//   if (animationRunning) {
//     runActiveAnimation();
//   }

//   // Physical pin manual hardware override sequence
//   if (digitalRead(TRIGGER_PIN) == LOW) {
//     delay(50);
//     if (digitalRead(TRIGGER_PIN) == LOW) {
//       handleWiFiReset();
//     }
//   }

//   // PIR Sensor Monitoring Loop
//   if (motionEnabled && !animationRunning) {
//     motionState = digitalRead(PIR_PIN);
//     if (motionState == HIGH) {
//       lastMotionTime = millis();
//       setLED(true);
//     }
//     if (millis() - lastMotionTime > holdTime) {
//       setLED(false);
//     }
//   }

//   // Active Countdown Verification Engine
//   if (timerActive && !timerPaused) {

//   if (millis() >= timerEndTime) {

//     timerActive = false;
//     pausedRemaining = 0;

//     startTriggerAnimation(timerAnimation);
//   }
// }

//   // Active Live Alarm Verification Engine
//   if (alarmEnabled && !alarmTriggered) {
//     struct tm timeinfo;
//     if (getLocalTime(&timeinfo)) {
//       checkAlarmTime(&timeinfo);
//     }
//   }

//   // Audio Music Mode Active Sampling Engine
//   if (musicMode && !animationRunning && !timerActive) {
//     readAudioFFT();
//   }
// }