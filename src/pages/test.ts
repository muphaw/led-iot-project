// #include <WiFi.h>
// #include <WiFiClientSecure.h>
// #include <PubSubClient.h>
// #include <WiFiManager.h>          
// #include <FastLED.h>
// #include <arduinoFFT.h>
// #include <time.h>

// // ================= MQTT CLOUD PLATFORM CONFIGURATION =================
// const char* mqtt_server = "2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud";
// const int mqtt_port = 8883;                         // Secure TLS Port
// const char* mqtt_user = "smartled";                
// const char* mqtt_pass = "12345Abcde";               
// const char* topic = "home/led/control";

// WiFiClientSecure espClient;
// PubSubClient client(espClient);

// // ================= LED STRIP PINOUT MATRIX =================
// #define LED_PIN 12
// #define NUM_LEDS 8
// #define PIR_PIN 14
// #define SOUND_PIN 34
// #define TRIGGER_PIN 0             // Physical BOOT button on ESP32

// CRGB leds[NUM_LEDS];

// bool ledState = false;
// bool motionEnabled = false;
// bool musicMode = false;

// // ================= COLOR CHANNELS =================
// int currentR = 255;
// int currentG = 0;
// int currentB = 0;

// // ================= PIR / FFT SENSORS =================
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

// // ================= POMODORO TIMER ENGINE =================
// bool timerActive = false;
// bool timerPaused = false;
// unsigned long timerEndTime = 0;
// unsigned long pausedRemaining = 0;
// String timerAnimation = "blink";
// String currentTimerAction = "on"; 

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

// bool backupMotionEnabled = false;
// bool backupMusicMode = false;

// int targetR = 255;
// int targetG = 0;
// int targetB = 0;
// String targetAnimation = "blink";

// // Backups for state restoration
// int backupR = 255;
// int backupG = 255;
// int backupB = 255;
// bool backupLedState = false; // Tracks if LED was originally ON or OFF

// // Forward Declarations
// void setLED(bool state);
// void setColor(int r, int g, int b);
// void stopTriggerAnimation();
// void startTriggerAnimation(String animType);
// void handleWiFiReset();

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

//     if (progress >= 1.0) {
//       animationRunning = false;
//       setLED(true); // 🟢 ADDED: Lock the hardware state to true when the fade finishes!
//     }
//   }
//   else if (activeAnimationType == "fade_out") {
//     float progress = (float)(millis() - animationStartTime) / (float)sunsetDuration;
//     progress = constrain(progress, 0.0, 1.0);
//     float smoothProgress = 1.0 - pow(progress, 2.2); 

//     int currentFadeBrightness = smoothProgress * targetBrightness;
//     FastLED.setBrightness(currentFadeBrightness);

//     for (int i = 0; i < NUM_LEDS; i++) leds[i] = CRGB(currentR, currentG, currentB);
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

// // ================= ROBUST ARGUMENT PARSER (FIXED BUG) =================
// String getSubArg(String msg, String key) {
//   // Look for key formatted as a sub-argument (preceded by a comma) to avoid matching "timer:"
//   int keyIdx = msg.indexOf("," + key + ":");
//   if (keyIdx == -1) {
//     // Fallback: Check if the key starts at the absolute beginning of the string
//     if (msg.startsWith(key + ":")) {
//       keyIdx = 0;
//     } else {
//       return "";
//     }
//   }
  
//   // Calculate index offset based on if we matched a comma or started at index 0
//   int startIdx = (keyIdx == 0) ? (key.length() + 1) : (keyIdx + key.length() + 2);
//   int endIdx = msg.indexOf(",", startIdx);
  
//   if (endIdx == -1) return msg.substring(startIdx);
//   return msg.substring(startIdx, endIdx);
// }

// // ================= AUTOMATED STATE RESTORATION ENGINE =================
// void evaluateSystemState() {
//   stopTriggerAnimation(); // Stop any running fade/blink overrides

//   // Revert structural state trackers to their historical values
//   ledState = backupLedState;
//   motionEnabled = backupMotionEnabled;
//   musicMode = backupMusicMode;
//   currentR = backupR;
//   currentG = backupG;
//   currentB = backupB;

 

//   if (ledState) {
//     setLED(true);
//     client.publish(topic, "on");
//   } 
//   else if (musicMode) {
//     fill_solid(leds, NUM_LEDS, CRGB::Black); 
//     FastLED.show();
//     // 🟢 TELL REACT: Music mode is now actively running
//     client.publish(topic, "status:music"); 
//   } 
//   else if (motionEnabled) {
//     fill_solid(leds, NUM_LEDS, CRGB::Black);
//     FastLED.show();
//     // 🟢 TELL REACT: Motion sensor is now actively running
//     client.publish(topic, "status:motion");
//   }
//   else {
//     fill_solid(leds, NUM_LEDS, CRGB::Black);
//     FastLED.show();
//     // 🟢 TELL REACT: Everything is turned off
//     client.publish(topic, "status:idle");
//   }
// }

// // ================= CENTRAL MQTT CONTROL CALLBACK =================
// void callback(char* topic, byte* payload, unsigned int length) {
//   String message = "";
//   for (unsigned int i = 0; i < length; i++) {
//     message += (char)payload[i];
//   }
//   Serial.println("📥 MQTT Payload Received: " + message);

//   // 1. Manual State Switches (With Protection Guard)
//   if (message == "on") {
//     if (!timerActive) {
//       stopTriggerAnimation();
//       setLED(true);
//     }
//   } 
//   else if (message == "off") {
//     if (!timerActive) {
//       stopTriggerAnimation();
//       setLED(false);
//     }
//   }
  
//   // 2. Manual Color Update Matrix (With Protection Guard)
//   else if (message.startsWith("color:")) {
//     if (!timerActive) {
//       String data = message.substring(6);
//       int firstComma = data.indexOf(',');
//       int secondComma = data.indexOf(',', firstComma + 1);
//       if (firstComma != -1 && secondComma != -1) {
//         int r = data.substring(0, firstComma).toInt();
//         int g = data.substring(firstComma + 1, secondComma).toInt();
//         int b = data.substring(secondComma + 1).toInt();
//         setColor(r, g, b);
//       }
//     }
//   }
  
//   // 3. Manual Brightness Processing (With Protection Guard)
//   else if (message.startsWith("brightness:")) {
//     if (!timerActive) {
//       manualBrightness = constrain(message.substring(11).toInt(), 0, 100);
//       FastLED.setBrightness(map(manualBrightness, 0, 100, 10, 255));
//       FastLED.show();
//     }
//   }

//   // 4. Automation & Acoustic Sensors
//   else if (message == "motion:on")   { motionEnabled = true; }
//   else if (message == "motion:off")  { motionEnabled = false; }
//   else if (message == "music:on")    { musicMode = true; }
//   else if (message == "music:off")   { musicMode = false; setLED(false); }

//   // 5. Pomodoro Timer Execution Block
//   else if (message.startsWith("timer:start")) {
//     long totalSeconds = getSubArg(message, "s").toInt();
//     if (totalSeconds <= 0) return;

//     currentTimerAction = getSubArg(message, "action");
//     if (currentTimerAction == "") currentTimerAction = "on";

//     // CRITICAL FIX: Always backup state and current colors
//     backupLedState = ledState;
//     backupR = currentR; 
//     backupG = currentG; 
//     backupB = currentB;

//     String rVal = getSubArg(message, "r");
//     String gVal = getSubArg(message, "g");
//     String bVal = getSubArg(message, "b");
//     if (rVal != "") targetR = rVal.toInt();
//     if (gVal != "") targetG = gVal.toInt();
//     if (bVal != "") targetB = bVal.toInt();

//     targetAnimation = getSubArg(message, "anim");
//     if (targetAnimation == "") targetAnimation = "blink";

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
//   else if (message == "timer:pause") {
//     if (timerActive && !timerPaused) {
//       pausedRemaining = timerEndTime - millis();
//       timerPaused = true;
//       if (currentTimerAction == "off") animationRunning = false;
//     }
//   }
//   else if (message.startsWith("timer:resume")) {
//     if (timerActive && timerPaused) {
//       String remVal = getSubArg(message, "rem");
//       if (remVal != "") {
//         pausedRemaining = remVal.toInt() * 1000UL;
//       }
//       timerEndTime = millis() + pausedRemaining;
//       timerPaused = false;

//       if (currentTimerAction == "off") {
//         sunsetDuration = pausedRemaining; 
//         animationStartTime = millis();    
//         animationRunning = true;
//       }
//     }
//   }
//   else if (message == "timer:cancel") {
//     timerActive = false; 
//     timerPaused = false; 
//     pausedRemaining = 0;
//     stopTriggerAnimation();
//     evaluateSystemState();
    
//     // Restore exact values and the original ON/OFF state
//     // currentR = backupR; 
//     // currentG = backupG; 
//     // currentB = backupB;
//     // setLED(backupLedState); 
//   }

//   // 6. Alarm Scheduling Matrix (FIXED ORDER)
//   else if (message == "alarm:off") {
//     alarmTriggered = false; 
//     alarmEnabled = false;
//     stopTriggerAnimation();
//     evaluateSystemState();

//     // motionEnabled = true; 
//     // musicMode = false;
    
//     // Restore exact values and original ON/OFF state
//     currentR = backupR; 
//     currentG = backupG; 
//     currentB = backupB;
//     setLED(backupLedState);
//   }
//   else if (message.startsWith("alarm:")) {
//     alarmTime = getSubArg(message, "time");
//     String action = getSubArg(message, "action");

//     // CRITICAL FIX: Always backup state and current colors
//     backupLedState = ledState;
//     backupR = currentR; 
//     backupG = currentG; 
//     backupB = currentB;

//     targetR = getSubArg(message, "r").toInt();
//     targetG = getSubArg(message, "g").toInt();
//     targetB = getSubArg(message, "b").toInt();
    
//     if (action == "off") {
//       alarmAnimation = "fade_out";
//       sunsetDuration = 10000; 
//     } else {
//       alarmAnimation = getSubArg(message, "anim");
//       if (alarmAnimation == "") alarmAnimation = "fade";
//     }
    
//     alarmEnabled = true;
//     alarmTriggered = false;
//   }
// }

// // ================= MQTT RECONNECTION WATCHDOG =================
// void reconnect() {
//   while (!client.connected()) {
//     Serial.print("Connecting to HiveMQ Cloud instance...");
//     String clientId = "ESP32-CoreBridge-" + String(random(0, 0xffff), HEX);

//     if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
//       Serial.println("🟢 Fully Synced with Broker!");
//       client.subscribe(topic);
//     } else {
//       Serial.print("Failed, rc=");
//       Serial.print(client.state());
//       Serial.println(" Retrying in 5 seconds.");
//       delay(5000);
//     }
//   }
// }

// void handleWiFiReset() {
//   Serial.println("Resetting credentials...");
//   WiFiManager wm;
//   wm.resetSettings();
//   ESP.restart();
// }

// // ================= FIXED ALARM TIME CHECKER =================
// void checkAlarmTime(struct tm* timeinfo) {
//   char currentFormatted[9];
//   sprintf(currentFormatted, "%02d:%02d", timeinfo->tm_hour, timeinfo->tm_min);
  
//   if (alarmTime == String(currentFormatted)) {
//     if (!alarmTriggered) {
//       Serial.println("ALARM TIME MATCHED ✅");
      
//       // Save state and colors
//       backupLedState = ledState;
//       backupR = currentR; 
//       backupG = currentG; 
//       backupB = currentB;
      
//       alarmTriggered = true;

//       if (alarmAnimation == "fade_out") {
//         stopTriggerAnimation();
//         startTriggerAnimation("fade_out");
//       } else {
//         // Move target alarm colors to active register channels
//         currentR = targetR; 
//         currentG = targetG; 
//         currentB = targetB;
        
//         stopTriggerAnimation();
//         ledState = true; // Turn power state ON to show animation
//         musicMode = false;
//         setColor(currentR, currentG, currentB);
//         delay(5); 
//         startTriggerAnimation(alarmAnimation);
//         if (alarmAnimation == "" || alarmAnimation == "none") setLED(true);
//       }
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

// // ================= RUNTIME SETUP INITIALIZATION =================
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
//   if (!wm.autoConnect("smart-led")) { delay(3000); ESP.restart(); }

//   Serial.println("🎯 Wi-Fi Up.");
//   IPAddress google_DNS(8, 8, 8, 8);
//   WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, google_DNS);
  
//   espClient.setInsecure(); 
//   client.setServer(mqtt_server, mqtt_port);
//   client.setCallback(callback);

//   syncTime();
// }

// // ================= PERIODIC LOOP LOOP LOOP =================
// void loop() {
//   if (!client.connected()) {
//     reconnect();
//   }
//   client.loop();
  
//   if (animationRunning && !timerPaused) {
//     runActiveAnimation();
//   }

//   if (digitalRead(TRIGGER_PIN) == LOW) {
//     delay(50);
//     if (digitalRead(TRIGGER_PIN) == LOW) handleWiFiReset();
//   }

//   if (musicMode && !animationRunning) {
//     readAudioFFT();
//   } 
//   else if (motionEnabled && !animationRunning ) { // Added !timerActive here to protect the timer from motion triggers
//     motionState = digitalRead(PIR_PIN);
//     if (motionState == HIGH) { 
//       lastMotionTime = millis(); 
//       setLED(true); 
//     }
//     if (millis() - lastMotionTime > holdTime) {
//       setLED(false);
//     }
//   }

//   if (timerActive && !timerPaused) {
//     if (millis() >= timerEndTime) {
//       timerActive = false; pausedRemaining = 0;
//       motionEnabled = false;
//       if (currentTimerAction == "off") {
//         stopTriggerAnimation(); setLED(false);
//       } else {
//         currentR = targetR; currentG = targetG; currentB = targetB;
//         timerAnimation = targetAnimation;
//         ledState = true; // Turn state ON so setColor runs properly
//         setColor(currentR, currentG, currentB);
//         startTriggerAnimation(timerAnimation);
//       }
//     }
//   }

//   if (alarmEnabled && !alarmTriggered) {
//     struct tm timeinfo;
//     if (getLocalTime(&timeinfo)) checkAlarmTime(&timeinfo);
//   }

  
// }