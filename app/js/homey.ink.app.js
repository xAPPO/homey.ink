var CLIENT_ID = '5cbb504da1fc782009f52e46';
var CLIENT_SECRET = 'gvhs0gebgir8vz8yo2l0jfb49u9xzzhrkuo1uvs8';

var locale = 'en'
var lang = getQueryVariable('lang');
if ( lang ) {
  locale = lang;
} 
var texts = getTexts(locale);
loadScript(locale, setLocale)

window.addEventListener('load', function() {
  
  var homey;
  var me;
  var sunrise = "";
  var sunset = "";
  var tod = "";
  var dn = "";
  var batteryDetails =[];
  var batteryAlarm = false;
  var sensorDetails =[];
  var nrMsg = 8;
  var faultyDevice = false;

  var $favoriteflows = document.getElementById('favorite-flows');
  var $favoritedevices = document.getElementById('favorite-devices');

  var $container = document.getElementById('container');
  var $header = document.getElementById('header');
  var $infopanel = document.getElementById('info-panel');
  var $text = document.getElementById('text');
  var $textLarge = document.getElementById('text-large');
  var $textSmall = document.getElementById('text-small');
  var $logo = document.getElementById('logo');
  var $batterydetails = document.getElementById('battery-details');
  var $sensordetails = document.getElementById('sensor-details');
  var $notificationdetails = document.getElementById('notification-details');
  var $weather = document.getElementById('weather');
  var $weatherTemperature = document.getElementById('weather-temperature');
  var $weatherState = document.getElementById('weather-state');
  var $weatherStateIcon = document.getElementById('weather-state-icon');
  var $sunevents = document.getElementById('sun-events');
  var $sunrisetime = document.getElementById('sunrise-time');
  var $sunsettime = document.getElementById('sunset-time');
  var $flows = document.getElementById('flows');
  var $flowsInner = document.getElementById('flows-inner');
  var $devicesInner = document.getElementById('devices-inner');

 

  $infopanel.addEventListener('click', function() {
    $container.classList.remove('container-dark');
    $infopanel.style.visibility = "hidden";
  });

  $logo.addEventListener('click', function(){
    window.location.reload();
  });

  $text.addEventListener('click', function() {
    homey.notifications.getNotifications().then(function(notifications) {
      return renderInfoPanel('t',notifications);
    })
  });
 
  $weather.addEventListener('click', function() {
    homey.weather.getWeather().then(function(weather) {
      return renderInfoPanel("w", weather)
    }).catch(console.error);
  })

  $sunevents.addEventListener('click', function() {
    homey.weather.getWeather().then(function(weather) {
      return renderInfoPanel("w", weather)
    }).catch(console.error);
  })

  $batterydetails.addEventListener('click', function() {
    return renderInfoPanel("b")
  })

  $sensordetails.addEventListener('click', function() {
    return renderInfoPanel("s")
  })

  $notificationdetails.addEventListener('click', function() {
    homey.notifications.getNotifications().then(function(notifications) {
      return renderInfoPanel('t',notifications);
    })
  });

  renderText();
  later.setInterval(function(){
    renderText();
  }, later.parse.text('every 5 mins'));

  var api = new AthomCloudAPI({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });
  
  var theme = getQueryVariable('theme');
  var $css = document.createElement('link');
  $css.rel = 'stylesheet';
  $css.type = 'text/css';
  $css.href = './css/themes/' + theme + '.css';
  document.head.appendChild($css);

  var token = getQueryVariable('token');
  token = atob(token);
  token = JSON.parse(token);
  api.setToken(token);
  
  api.isLoggedIn().then(function(loggedIn) {
    if(!loggedIn)
      throw new Error('Token Expired. Please log-in again.');
  }).then(function(){
    return api.getAuthenticatedUser();
  }).then(function(user) {
    return user.getFirstHomey();
  }).then(function(homey) {
    return homey.authenticate();
  }).then(function(homey_) {
    homey = homey_;

    renderHomey();    
    later.setInterval(function(){
      renderHomey();
    }, later.parse.text('every 1 hour'));
  }).catch(console.error);

  function renderHomey() {
    homey.users.getUserMe().then(function(user) {
      me = user;
      me.properties = me.properties || {};
      me.properties.favoriteFlows = me.properties.favoriteFlows || [];
      me.properties.favoriteDevices = me.properties.favoriteDevices || [];

      homey.i18n.getOptionLanguage().then(function(language) {
      }).catch(console.error);

      homey.flowToken.getFlowTokens().then(function(tokens) {
        for (let token in tokens) {
          if ( tokens[token].id == "sunrise" ) {
            sunrise = tokens[token].value
          }
          if ( tokens[token].id == "sunset"  ) {
            sunset = tokens[token].value
          }
          if ( tokens[token].id == "measure_battery" ) {
            var batteryLevel = tokens[token].value
            if ( batteryLevel != null ) { 
              var element = {}
              element.name = tokens[token].uriObj.name
              element.zone = tokens[token].uriObj.meta.zoneName
              element.level = batteryLevel
              batteryDetails.push(element)
              if ( batteryLevel < 20 ) {
                batteryAlarm = true
              }
            }
          }
        }
        if (sunrise != "" || sunset != "") {
          calculateTOD();
          
        }
        if ( batteryAlarm ) {
          $batterydetails.classList.add('alarm')
        } else {
          $batterydetails.classList.remove('alarm')
        }

      }).catch(console.error);

      checkSensorStates();

      homey.weather.getWeather().then(function(weather) {
        return renderWeather(weather);
      }).catch(console.error);
      
      homey.flow.getFlows().then(function(flows) {
        var favoriteFlows = me.properties.favoriteFlows.map(function(flowId){
          return flows[flowId];
        }).filter(function(flow){
          return !!flow;
        });
        return renderFlows(favoriteFlows);        
      }).catch(console.error);
      
      homey.devices.getDevices().then(function(devices) {
        var favoriteDevices = me.properties.favoriteDevices.map(function(deviceId){
          return devices[deviceId];
        }).filter(function(device){
          return !!device;
        }).filter(function(device){
          if(!device.ui) return false;
          //if(!device.ui.quickAction) return false;
          return true;
        });
        
        favoriteDevices.forEach(function(device){
          if (!device.ready) {
            faultyDevice=true; 
            $sensordetails.classList.add('fault')  
            return}
          if ( device.ui.quickAction ) {
            device.makeCapabilityInstance(device.ui.quickAction, function(value){
              var $device = document.getElementById('device-' + device.id);
              if( $device ) {
                $device.classList.toggle('on', !!value);
                checkSensorStates();
              }
            });
          }
          if ( device.capabilitiesObj.alarm_generic ) {        
            device.makeCapabilityInstance('alarm_generic', function(value){
              var $device = document.getElementById('device-' + device.id);
              if( $device ) {
                $device.classList.toggle('alarm', !!value);
                checkSensorStates();
              }
            });
          }
          if ( device.capabilitiesObj.alarm_motion ) {        
            device.makeCapabilityInstance('alarm_motion', function(value){
              var $device = document.getElementById('device-' + device.id);
              if( $device ) {
                $device.classList.toggle('alarm', !!value);
                checkSensorStates();
              }
            });
          }
          if ( device.capabilitiesObj.alarm_contact ) {        
            device.makeCapabilityInstance('alarm_contact', function(value){
              var $device = document.getElementById('device-' + device.id);
              if( $device ) {
                $device.classList.toggle('alarm', !!value);
                checkSensorStates();
              }
            });
          }
          if ( device.capabilitiesObj.alarm_vibration ) {        
            device.makeCapabilityInstance('alarm_vibration', function(value){
              var $device = document.getElementById('device-' + device.id);
              if( $device ) {
                $device.classList.toggle('alarm', !!value);
                checkSensorStates();
              }
            });
          }

          if ( device.capabilitiesObj.measure_temperature && !device.capabilitiesObj.flora_measure_moisture ) {        
            device.makeCapabilityInstance('measure_temperature', function(value){
              var $device = document.getElementById('device-' + device.id);
              if( $device ) {
                var $value = document.getElementById('value-' + device.id);
                
                var integer = Math.floor(device.capabilitiesObj.measure_temperature.value)
                n = Math.abs(device.capabilitiesObj.measure_temperature.value)
                var decimal = Math.round((n - Math.floor(n))*10)/10 + "-"
                var decimal = decimal.substring(2,3)
                $value.innerHTML= integer + ".<span id='decimal'>"+decimal+"°c</span><br />"

              }
            });
          }

          if ( device.capabilitiesObj.flora_measure_moisture ) {
            device.makeCapabilityInstance('flora_measure_moisture', function(moisture) {
              var $device = document.getElementById('device-' + device.id);
              if( $device) {
                var $element = document.getElementById('value-' + device.id);
                $element.innerHTML = Math.round(moisture) + "<span id='decimal'>%</span><br />"
                if ( moisture < 15 || moisture > 65 ) {
                  $device.classList.add('alarm')
                } else {
                  $device.classList.remove('alarm')
                }
                checkSensorStates();
              }
            });
          }

        });
        return renderDevices(favoriteDevices);
      }).catch(console.error);
    }).catch(console.error);
  }
  
  function checkSensorStates() {
    homey.flowToken.getFlowTokens().then(function(tokens) {
      var sensorAlarm = false
      sensorDetails = [];
      for (let token in tokens) {
        if (tokens[token].id == "alarm_generic" && tokens[token].value == true ||
            tokens[token].id == "alarm_motion" && tokens[token].value == true ||
            tokens[token].id == "alarm_contact" && tokens[token].value == true ||
            tokens[token].id == "alarm_vibration" && tokens[token].value == true 
          ) {
            var element = {}
            element.name = tokens[token].uriObj.name
            element.zone = tokens[token].uriObj.meta.zoneName
            sensorDetails.push(element)  
            sensorAlarm = true
        }
      }
      if ( sensorAlarm ) {
        $sensordetails.classList.add('alarm')
      } else {
        $sensordetails.classList.remove('alarm')
      }
    }).catch(console.error);
  }

  function renderInfoPanel(type,info) {
    switch(type) {
      case "t":
      console.log(info)
        $infopanel.innerHTML = '';
        var $infoPanelNotifications = document.createElement('div');
        $infoPanelNotifications.id = "infopanel-notifications"
        $infopanel.appendChild($infoPanelNotifications);
        $ni = "<center><h1>" + texts.notification.title + "</h1></center><br />"
        var nots =[];
        for (let inf in info) {
            nots.push(info[inf]);
        }
        nots.sort(SortByName);

        if ( nots.length < nrMsg) {
          nrNot = nots.length
        } else {
          nrNot = nrMsg
        }

        if ( nots.length > 0 ) {
          for (not = 0; not < nrNot; not++) {
              var formatedDate = new Date(nots[not].dateCreated);
              today = new Date
              if ( formatedDate.toLocaleDateString() != new Date().toLocaleDateString() ) {
                formatedDate = formatedDate.toLocaleTimeString() + " (" +formatedDate.toLocaleDateString() + ")"
              } else {
                formatedDate = formatedDate.toLocaleTimeString()
              }
              $ni = $ni + "<div><h2>" + nots[not].excerpt.replace("**","").replace("**","").replace("**","").replace("**","") + "</h2></div> ";
              $ni = $ni + "<div class='info-date'> " + formatedDate+ "</div>"
          }
        } else {
          $ni = $ni + texts.notification.nonotification
        }

        $infoPanelNotifications.innerHTML = $ni
        break;
      case "w": 
        $infopanel.innerHTML = '';
        var $infoPanelWeather = document.createElement('div');
        $infoPanelWeather.id = "infopanel-weather"
        $infopanel.appendChild($infoPanelWeather);
        $wi = "<center><h1>" + texts.weather.title + info.city + "</h1><br />"
        $wi = $wi + "<h2>" + texts.weather.temperature + Math.round(info.temperature*10)/10 + texts.weather.degrees
        $wi = $wi + texts.weather.humidity + Math.round(info.humidity*100) + texts.weather.pressure
        $wi = $wi + Math.round(info.pressure*1000) + texts.weather.mbar + "</h2></center>";

        $infoPanelWeather.innerHTML = $wi

        var $infopanelState = document.createElement('div');
        $infopanelState.id = "weather-state"
        $infopanel.appendChild($infopanelState);
        $infopanelState.innerHTML = "";
        $infopanelState.classList.add('weather-state');
        var $icon = document.createElement('div');
        $icon.id = '';
        $icon.classList.add(info.state.toLowerCase());
        $icon.style.backgroundImage = 'url(img/weather/' + info.state.toLowerCase() + dn + '.svg)';    
        $icon.style.webkitMaskImage = 'url(img/weather/' + info.state.toLowerCase() + dn + '.svg)';

        $infopanelState.appendChild($icon)

        var $infoPanelSunevents = document.createElement('div');
        $infoPanelSunevents.id = "infopanel-sunevents"
        $infopanel.appendChild($infoPanelSunevents);

        switch(tod) {
          case 1:
            $se = "<center><h2>" + texts.sunevent.presunrise + sunrise + texts.sunevent.presunset + sunset + "</h2></center>"
            break;
          case 2:
            $se = "<center><h2>" + texts.sunevent.postsunrise  + sunrise + texts.sunevent.presunset + sunset + "</h2></center>"
            break;
          case 3:
            $se = "<center><h2>" + texts.sunevent.postsunrise  + sunrise + texts.sunevent.postsunset + sunset + "</h2></center>"
            break;
          default:
            $se = "<center><h2>" + texts.sunevent.postsunrise  + sunrise + texts.sunevent.postsunset + sunset + "</h2></center>"
            break;
        }
        $infoPanelSunevents.innerHTML = $se

        break;
      case "b":
        $infopanel.innerHTML = '';
        var $infoPanelBattery = document.createElement('div');
        $infoPanelBattery.id = "infopanel-battery"
        $infopanel.appendChild($infoPanelBattery);
        $bi = "<center><h1>" + texts.battery.title + "</h1></center><br /><br />"
        for (let device in batteryDetails) {
          $bi = $bi + "<h2>" + batteryDetails[device].name + texts.battery.in
          $bi = $bi + batteryDetails[device].zone + texts.battery.has
          $bi = $bi + batteryDetails[device].level + texts.battery.left + "</h2>"
        }
        $infopanel.innerHTML = $bi

        break;
      case "s":
        $infopanel.innerHTML = '';
        var $infoPanelSensors = document.createElement('div');
        $infoPanelSensors.id = "infopanel-sensor"
        $infopanel.appendChild($infoPanelSensors);
        $si = "<center><h1>" + texts.sensor.title + "</h1></center><br /><br />"
        if ( Object.keys(sensorDetails).length ) {
          for (let device in sensorDetails) {
            $si = $si + "<h2>" + sensorDetails[device].name + texts.sensor.in 
            $si = $si + sensorDetails[device].zone + texts.sensor.alarm + "</h2>"
          }
        } else {
          $si = $si + "<h2>" + texts.sensor.noalarm + "</h2>"
        }
        if ( faultyDevice ) {
          $si = $si +"<br /><h2>" + texts.sensor.fault + "</h2>"
        }
        $infopanel.innerHTML = $si
        break;
    }
    $infopanel.style.visibility = "visible";
    $container.classList.add('container-dark');
  }

  
  function renderWeather(weather) {
    $weatherTemperature.innerHTML = Math.round(weather.temperature);
    $weatherStateIcon.classList.add(weather.state.toLowerCase());
    $weatherStateIcon.style.backgroundImage = 'url(img/weather/' + weather.state.toLowerCase() + dn + '.svg)';    
    $weatherStateIcon.style.webkitMaskImage = 'url(img/weather/' + weather.state.toLowerCase() + dn + '.svg)';
  }
  
  function renderFlows(flows) {
    if ( flows != "" ) {
    $flowsInner.innerHTML = '';
      flows.forEach(function(flow) {
        var $flow = document.createElement('div');
        $flow.id = 'flow-' + flow.id;
        $flow.classList.add('flow');
        $flow.addEventListener('click', function(){        
          if( $flow.classList.contains('running') ) return;
          homey.flow.triggerFlow({
            id: flow.id,
          }).then(function(){          
            
            $flow.classList.add('running');                
            setTimeout(function(){
              $flow.classList.remove('running');
            }, 3000);
          }).catch(console.error);
        });
        $flowsInner.appendChild($flow);
        
        var $play = document.createElement('div');
        $play.classList.add('play');
        $flow.appendChild($play);
        
        var $name = document.createElement('div');
        $name.classList.add('name');
        $name.innerHTML = flow.name;
        $flow.appendChild($name);
      });
    } else {
      $flows.style.visibility = 'hidden';
      $flows.style.height = '0';
    }
  }
  
  function renderDevices(devices) {
    $devicesInner.innerHTML = '';
    devices.forEach(function(device) {
      if (!device.ready) {return}
      var $device = document.createElement('div');
      $device.id = 'device-' + device.id;
      $device.classList.add('device');
      $device.classList.toggle('on', device.capabilitiesObj && device.capabilitiesObj[device.ui.quickAction] && device.capabilitiesObj[device.ui.quickAction].value === true);
      if ( device.capabilitiesObj && device.capabilitiesObj.button ) {
        $device.classList.toggle('on', true)
      }

      if ( device.capabilitiesObj && device.capabilitiesObj[device.ui.quickAction] ) {
        $device.addEventListener('touchstart', function() {
          $device.classList.add('push')
        });
        $device.addEventListener('touchend', function() {
          $device.classList.remove('push')
        });
        $device.addEventListener('click', function(){
          var value = !$device.classList.contains('on');
          if ( device.capabilitiesObj && device.capabilitiesObj.onoff ) {
            $device.classList.toggle('on', value);
          }
          homey.devices.setCapabilityValue({
            deviceId: device.id,
            capabilityId: device.ui.quickAction,
            value: value,
          }).catch(console.error);
        });
      }
      $devicesInner.appendChild($device);
      
      if (device.capabilitiesObj && device.capabilitiesObj.alarm_generic && device.capabilitiesObj.alarm_generic.value ||
          device.capabilitiesObj && device.capabilitiesObj.alarm_motion && device.capabilitiesObj.alarm_motion.value ||
          device.capabilitiesObj && device.capabilitiesObj.alarm_contact && device.capabilitiesObj.alarm_contact.value ||
          device.capabilitiesObj && device.capabilitiesObj.alarm_vibration && device.capabilitiesObj.alarm_vibration.value
          ) {
        $device.classList.add('alarm')
      }

      var $icon = document.createElement('div');
      $icon.classList.add('icon');
      $icon.style.webkitMaskImage = 'url(https://icons-cdn.athom.com/' + device.iconObj.id + '-128.png)';
      $device.appendChild($icon);

      var $value = document.createElement('div');
      $value.id = 'value-' + device.id;
      $value.classList.add('value');
      if ( device.capabilitiesObj.measure_temperature && device.capabilitiesObj.measure_temperature.value ) {
        var integer = Math.floor(device.capabilitiesObj.measure_temperature.value)
        n = Math.abs(device.capabilitiesObj.measure_temperature.value)
        var decimal = Math.round((n - Math.floor(n))*10)/10 + "-"
        var decimal = decimal.substring(2,3)
        $value.innerHTML  = integer + ".<span id='decimal'>"+decimal+"°c</span><br />"
      }
      if ( device.capabilitiesObj.flora_measure_moisture && device.capabilitiesObj.flora_measure_moisture.value ) {
        var moisture = Math.round(device.capabilitiesObj.flora_measure_moisture.value)
        $value.innerHTML  = moisture + ".<span id='decimal'>%</span><br />"
        if ( moisture < 15 || moisture > 65 ) {
          $device.classList.add('alarm')
        } else {
          $device.classList.remove('alarm')
        }
      }

      $device.appendChild($value);

      var $name = document.createElement('div');
      $name.classList.add('name');
      $name.innerHTML = device.name;
      $device.appendChild($name);
    });
  }
  
  function renderText() {
    var now = new Date();
    var hours = now.getHours();
    
    var tod;
    if( hours >= 18 ) {
      tod = texts.text.evening;
    } else if( hours >= 12 ) {
      tod = texts.text.afternoon;
    } else if( hours >= 6 ) {
      tod = texts.text.morning;
    } else {
      tod = texts.text.night;
    }

    //moment.locale(locale)
    $textLarge.innerHTML = texts.text.good + tod ;
    $textSmall.innerHTML = texts.text.today + moment(now).format('dddd[, ]D[ ]MMMM YYYY[.]');
  }
  
  function calculateTOD() {

    var d = new Date();
    var m = d.getMinutes();
    var h = d.getHours();
    if(h == '0') {h = 24}

    var currentTime = h+"."+m;
    var time = sunrise.split(":");
    var hour = time[0];
    if(hour == '00') {hour = 24}
    var min = time[1];
    var sunriseTime = hour+"."+min;

    var time = sunset.split(":");
    var hour = time[0];
    if(hour == '00') {hour = 24}
    var min = time[1];
    var sunsetTime = hour+"."+min;

    if ( currentTime < sunriseTime  ) {
      tod = 1;
      dn = "n";
    } 
    else if ( currentTime < sunsetTime ) {
      tod = 2;
      dn = "";
    } else {
      tod = 3;
      dn = "n";
    }
  }

  function SortByName(a, b){
    var aName = a.dateCreated;
    var bName = b.dateCreated;
    return ((aName > bName) ? -1 : ((aName < bName) ? 1 : 0));
    }

});