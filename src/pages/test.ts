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
  
//   // Skip smooth tracking on fade_out to avoid startup lag blinks
//   if (activeAnimationType != "fade_out") {
//     smoothBrightness += (targetBrightness - smoothBrightness) * 0.08;
//   }

//   // ================= FADE IN =================
//   if (activeAnimationType == "fade") {
//     float progress = (float)(millis() - animationStartTime) / 3000.0;
//     progress = constrain(progress, 0.0, 1.0);
//     float smoothProgress = pow(progress, 2.2);  

//     FastLED.setBrightness(smoothProgress * smoothBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(currentR, currentG, currentB);
//     FastLED.show();

//     if (progress >= 1.0) animationRunning = false;
//   }
  
//   // ================= SLOW FADE OUT =================
//   else if (activeAnimationType == "fade_out") {
//     float progress = (float)(millis() - animationStartTime) / (float)sunsetDuration;
//     progress = constrain(progress, 0.0, 1.0);
    
//     float smoothProgress = 1.0 - pow(progress, 2.2); 

//     // Directly scale down from target hardware limits
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

//   // ================= BLINK =================
//   else if (activeAnimationType == "blink") {
//     bool toggle = ((millis() - animationStartTime) / 500) % 2 == 0;
//     FastLED.setBrightness(smoothBrightness);
//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = toggle ? CRGB(currentR, currentG, currentB) : CRGB::Black;
//     FastLED.show();
//   }

//   // ================= SMOOTH WAVE =================
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

// // ================= LIVE POLLING STATE API =================
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

// // ================= TIMER CONTROLS =================
// void handleStartTimer() {
//   sendCORSHeaders();

//   long h = server.hasArg("hour") ? server.arg("hour").toInt() : 0;
//   long m = server.hasArg("min") ? server.arg("min").toInt() : 0;
//   long s = server.hasArg("second") ? server.arg("second").toInt() : 0;
//   long totalSeconds = h * 3600 + m * 60 + s;

//   if (totalSeconds <= 0) {
//     server.send(400, "text/plain", "Invalid Timer Duration");
//     return;
//   }

//   currentTimerAction = server.hasArg("action") ? server.arg("action") : "on";

//   if (ledState) {
//     backupR = currentR;
//     backupG = currentG;
//     backupB = currentB;
//   }

//   if (server.hasArg("r")) targetR = server.arg("r").toInt();
//   if (server.hasArg("g")) targetG = server.arg("g").toInt();
//   if (server.hasArg("b")) targetB = server.arg("b").toInt();
//   targetAnimation = server.hasArg("animation") ? server.arg("animation") : "blink";

//   timerEndTime = millis() + (totalSeconds * 1000UL);
//   timerActive = true;
//   timerPaused = false;
//   pausedRemaining = 0;
  
//   stopTriggerAnimation(); 

//   // Start dimming immediately across the length of the countdown window
//   if (currentTimerAction == "off") {
//     sunsetDuration = totalSeconds * 1000UL; 
//     startTriggerAnimation("fade_out");
//   }

//   server.send(200, "text/plain", "Timer Initiated");
// }

// void handlePauseTimer() {
//   sendCORSHeaders();
//   if (!timerActive || timerPaused) { server.send(400, "text/plain", "Timer not running"); return; }
  
//   pausedRemaining = timerEndTime - millis();
//   timerPaused = true;

//   // 🔥 FIX: Pause the fading engine calculation loop immediately
//   if (currentTimerAction == "off") {
//     animationRunning = false; 
//   }
//   server.send(200, "text/plain", "Paused");
// }

// void handleResumeTimer() {
//   sendCORSHeaders();
//   if (!timerActive || !timerPaused) { server.send(400, "text/plain", "Timer not paused"); return; }

//   // 🔥 FIX: Extract structural parameter payload directly from the React payload URL
//   if (server.hasArg("remaining")) {
//     long remainingSeconds = server.arg("remaining").toInt();
//     pausedRemaining = remainingSeconds * 1000UL;
//   }

//   timerEndTime = millis() + pausedRemaining;
//   timerPaused = false;

//   // 🔥 FIX: Re-align fade-out visual parameters matching the new time window
//   if (currentTimerAction == "off") {
//     sunsetDuration = pausedRemaining; 
//     animationStartTime = millis();    
//     animationRunning = true;
//   }

//   server.send(200, "text/plain", "Resumed");
// }

// void handleCancelTimer() {
//   sendCORSHeaders();

//   timerActive = false;
//   timerPaused = false;
//   pausedRemaining = 0;
//   stopTriggerAnimation();

//   // Bring the safe room environment light back alive instantly
//   currentR = backupR;
//   currentG = backupG;
//   currentB = backupB;
//   setLED(true);

//   server.send(200, "text/plain", "Canceled");
// }

// // ================= ALARM CONTROLS =================
// void handleAlarm() {
//   sendCORSHeaders();
//   if (!server.hasArg("time") || !server.hasArg("r") || !server.hasArg("g") || !server.hasArg("b")) {
//     server.send(400, "text/plain", "Missing parameters");
//     return;
//   }
  
//   alarmTime = server.arg("time"); 
//   String action = server.hasArg("action") ? server.arg("action") : "on";

//   if (server.hasArg("r")) targetR = server.arg("r").toInt();
//   if (server.hasArg("g")) targetG = server.arg("g").toInt();
//   if (server.hasArg("b")) targetB = server.arg("b").toInt();
  
//   if (action == "off") {
//     alarmAnimation = "fade_out";
//     sunsetDuration = 10000; 
//   } else {
//     alarmAnimation = server.hasArg("animation") ? server.arg("animation") : "fade";
//   }
  
//   alarmEnabled = true;
//   alarmTriggered = false;
//   server.send(200, "text/plain", "Alarm Registered");
// }

// void handleCancelAlarm() {
//   sendCORSHeaders();
//   alarmTriggered = false;
//   alarmEnabled = false;
//   animationRunning = false;
//   activeAnimationType = "";

//   currentR = backupR;
//   currentG = backupG;
//   currentB = backupB;
//   setLED(true);
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
//   if (!wm.autoConnect("ESP32_Config_AP")) { delay(3000); ESP.restart(); }

//   Serial.print("Assigned Node IP: ");
//   Serial.println(WiFi.localIP());
//   syncTime();

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
//   server.on("/timer", handleStartTimer);             
//   server.on("/timer/pause", handlePauseTimer);       
//   server.on("/timer/resume", handleResumeTimer);     
//   server.on("/timer/cancel", handleCancelTimer);     
//   server.on("/timer/status", handleTimerStatus);     
//   server.on("/alarm", handleAlarm);                  
//   server.on("/alarm/off", handleCancelAlarm);        
//   server.begin();
// }

// // ================= MAIN RUNTIME LOOP =================
// void loop() {
//   server.handleClient();
  
//   if (animationRunning && !timerPaused) {
//     runActiveAnimation();
//   }

//   if (digitalRead(TRIGGER_PIN) == LOW) {
//     delay(50);
//     if (digitalRead(TRIGGER_PIN) == LOW) handleWiFiReset();
//   }

//   // PIR sensor loop checking block (Ignores loops while countdown runs)
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
//         setLED(false); // Snap perfectly down to 0 remaining emissions 
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