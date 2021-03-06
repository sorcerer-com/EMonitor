/*
  1) Upload code to the device
  2) Upload spiffs image to the device through "/update"
*/

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPUpdateServer.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ESP8266NetBIOS.h>
#include <FS.h>

//#define REMOTE_DEBUG
//#define VOLTAGE_MONITOR

#include "src/RemoteDebugger.h"
#include "DataManager.h"
#include "WebHandler.h"

ESP8266WiFiMulti wifiMulti;
ESP8266WebServer server(80);
ESP8266HTTPUpdateServer httpUpdater;
WebHandler webHandler(server);

const uint8_t buttonPin = 0; // GPIO0 / D3
unsigned long buttonTimer = 0;

unsigned long reconnectTimer = millis() - 5 * MILLIS_IN_A_SECOND;

void setup()
{
  Serial.begin(9600);
#ifdef REMOTE_DEBUG
  RemoteDebugger.begin(server);
#endif

  pinMode(buttonPin, INPUT_PULLUP);

  // setup WiFi
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.hostname("EnergyMonitor");
  if (WiFi.config(DataManager.data.settings.wifi_ip, DataManager.data.settings.wifi_gateway,
                  DataManager.data.settings.wifi_subnet, DataManager.data.settings.wifi_dns))
  {
    DEBUGLOG("EMonitor", "Config WiFi - IP: %s, Gateway: %s, Subnet: %s, DNS: %s",
             IPAddress(DataManager.data.settings.wifi_ip).toString().c_str(),
             IPAddress(DataManager.data.settings.wifi_gateway).toString().c_str(),
             IPAddress(DataManager.data.settings.wifi_subnet).toString().c_str(),
             IPAddress(DataManager.data.settings.wifi_dns).toString().c_str());
  }
  else
  {
    DEBUGLOG("EMonitor", "Cannot config Wifi");
  }

  wifiMulti.addAP(DataManager.data.settings.wifi_ssid, DataManager.data.settings.wifi_passphrase);

  // Wait for connection
  DEBUGLOG("EMonitor", "Connecting...");
  for (int i = 0; i < 10; i++)
  {
    if (wifiMulti.run() == WL_CONNECTED)
    {
      DEBUGLOG("EMonitor", "WiFi: %s, IP: %s", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
      break;
    }
    delay(500);
  }

  if (MDNS.begin("emon"))
  {
    DEBUGLOG("EMonitor", "MDNS responder started");
    MDNS.addService("http", "tcp", 80);
  }

  NBNS.begin("emon");

  //ask server to track these headers
  const char *headerkeys[] = {"Referer", "Cookie"};
  size_t headerkeyssize = sizeof(headerkeys) / sizeof(char *);
  server.collectHeaders(headerkeys, headerkeyssize);
  server.begin();

  httpUpdater.setup(&server, "admin", "admin");

  DataManager.setup();
}

void loop()
{
  DataManager.update();

  MDNS.update();
  server.handleClient();

  // Reset button
  int buttonState = digitalRead(buttonPin);
  if (buttonState == LOW) // button down
  {
    if (buttonTimer == 0)
      buttonTimer = millis();
    else if (millis() - buttonTimer > 5 * MILLIS_IN_A_SECOND)
    {
      DataManager.data.reset();
      DataManager.data.writeEEPROM(true);
      server.client().stop();
      ESP.restart();
    }
  }
  if (buttonState == HIGH && buttonTimer > 0) // button up
  {
    server.client().stop();
    ESP.restart();
  }

  // Try to reconnect to WiFi
  if (millis() - reconnectTimer > 15 * MILLIS_IN_A_SECOND)
  {
    reconnectTimer = millis();
    if (wifiMulti.run() != WL_CONNECTED)
    {
      DEBUGLOG("EMonitor", "Fail to reconnect...");
      if (WiFi.getMode() == WIFI_STA)
      {
        // 192.168.244.1
        DEBUGLOG("EMonitor", "Create AP");
        WiFi.mode(WIFI_AP_STA);
        uint32_t wifi_ip = DataManager.data.settings.wifi_ip != 0 ? DataManager.data.settings.wifi_ip : 0x1F4A8C0; // 192.168.244.1
        uint32_t wifi_gateway = DataManager.data.settings.wifi_gateway != 0 ? DataManager.data.settings.wifi_gateway : 0x1F4A8C0; // 192.168.244.1
        uint32_t wifi_subnet = DataManager.data.settings.wifi_subnet != 0 ? DataManager.data.settings.wifi_ip : 0xFFFFFF;
        if (!WiFi.softAPConfig(wifi_ip, wifi_gateway, wifi_subnet))
        {
          DEBUGLOG("EMonitor", "Config WiFi AP - IP: %s, Gateway: %s, Subnet: %s, DNS: %s",
                   IPAddress(DataManager.data.settings.wifi_ip).toString().c_str(),
                   IPAddress(DataManager.data.settings.wifi_gateway).toString().c_str(),
                   IPAddress(DataManager.data.settings.wifi_subnet).toString().c_str(),
                   IPAddress(DataManager.data.settings.wifi_dns).toString().c_str());
        }
        else
        {
          DEBUGLOG("EMonitor", "Cannot config Wifi AP");
        }

        String ssid = SF("EnergyMonitor_") + String(ESP.getChipId(), HEX);
        WiFi.softAP(ssid.c_str(), "12345678");
        DEBUGLOG("EMonitor", "AP WiFi: %s, IP: %s", WiFi.softAPSSID().c_str(), WiFi.softAPIP().toString().c_str());
      }
    }
    else if (WiFi.getMode() != WIFI_STA)
    {
      WiFi.mode(WIFI_STA);
      DEBUGLOG("EMonitor", "Reconnected WiFi: %s, IP: %s", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    }
  }

  // set wifi credentials by serial
  if (Serial.available())
  {
    if (Serial.readString() == "set wifi")
    {
      Serial.println("Waiting for wifi ssid...");
      while(!Serial.available()) { delay(1000); }
      strcpy(DataManager.data.settings.wifi_ssid, Serial.readString().c_str());
      Serial.println("Waiting for wifi passphrase...");
      while(!Serial.available()) { delay(1000); }
      strcpy(DataManager.data.settings.wifi_passphrase, Serial.readString().c_str());
      DataManager.data.writeEEPROM(true);
      ESP.restart();
    }
  }
}
