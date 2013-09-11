navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.getUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;
var sensorServices = [];
var actuatorServices = [];
var sensor_types = [
	"http://webinos.org/api/sensors.temperature",
	"http://webinos.org/api/sensors.humidity",
	"http://webinos.org/api/sensors.light",
	"http://webinos.org/api/sensors.voltage",
	"http://webinos.org/api/sensors.electricity",
	"http://webinos.org/api/sensors.proximity",
	"http://webinos.org/api/sensors.heartratemonitor"
];
var actuator_types = [
	"http://webinos.org/api/actuators.switch",
	"http://webinos.org/api/actuators.linearmotor"
];
var video;
var canvas;
var ctx;
$(document).ready(init);

var eventListenerFunction = function(event){
			$("#valueDiv").show();
			console.log(JSON.stringify(event));
			if (sensor_chart && sensor_chart.series[0]) {
						
						var item = {
									value: event.sensorValues[0] || 0,
									timestamp: event.timestamp,
									unit: event.unit,
									time: Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', event.timestamp)
						};
						
						var series = sensor_chart.get('values');
						series.addPoint({x: item.timestamp,y: item.value},true,series.data.length>10,true);
			}
			$("#values").text((item.value || 0));
};
var stopCapture = false;
/*
var divResultSensor = document.getElementById('overlaySensor');
var divValues = document.getElementById('value');
var spanValues = document.getElementById('values');
var buttonSensor = document.getElementById('sensorButton');
var sensorName = document.getElementById('sensorName');
var sensorDescription = document.getElementById('sensorDescription');
var sensorChart = document.getElementById('sensor-chart');
*/
var sensor;
var actuator;
var sensor_count;
var registered = false;
var deferred;
var sensor_chart;

function init() {
			video = document.getElementById('monitor');
			canvas = document.getElementById('photo');
			ctx = canvas.getContext('2d');
			if (!navigator.getUserMedia) {
						alert('Sorry. <code>navigator.getUserMedia()</code> is not available.');
						return;
			}  
			navigator.getUserMedia({video: true}, gotStream, noStream);
			discoverActuators();
			discoverSensors();
}

function gotStream(stream) {
  if (window.URL) {
    video.src = window.URL.createObjectURL(stream);
  } else {
    video.src = stream; // Opera.
  }

  video.onerror = function(e) {
    //stream.stop();
  };

  stream.onended = noStream;

  // Since video.onloadedmetadata isn't firing for getUserMedia video, we have
  // to fake it.
  setTimeout(function() {
    //canvas.width = video.videoWidth;
    //canvas.height = video.videoHeight;
  }, 50);
  startCapture();
}

function noStream(e) {
  var msg = 'No camera available.';
  if (e.code == 1) {
    msg = 'User denied access to use camera.';
  }
  alert(msg);
  //document.getElementById('errorMessage').textContent = msg;
}

function capture() {
			console.log("Capturing image");
	try{
			
            ctx.drawImage(video,0,0, 640, 480);
            try{
				qrcode.callback = read;
			        qrcode.decode();
            }
            catch(e){       
                console.log(e);
				if(!stopCapture)
					setTimeout(capture, 500);
            };
        }
        catch(e){       
                console.log(e);
				if(!stopCapture)
					setTimeout(capture, 500);
        };
}

function startCapture(){
	setTimeout(capture, 500);
	stopCapture = false;
	//$("#capture").text("Stop").on("click", endCapture);
}

function endCapture(){
	stopCapture = true;
	setTimeout(function(){
			$("#capture").off("click").text("Capture").on("click", startCapture);
	}, 500);
}

function read(id){
        console.log("QR Code callback");
	if( id == "error decoding QR Code"){
			console.log(id);
		if(!stopCapture)
			setTimeout(capture, 500);
	}
	else{
			console.log("QRCode correctly readed");
		find(id);
		if (!stopCapture) {
			setTimeout(capture, 10000);
		}

	}
}

function showOverlay() {
			$("#capture").show().text("Back").on("click",hideOverlay);
			if (sensor) {
						showSensorOverlay();
			}
			else if (actuator) {
						showActuatorOverlay();
			}
}
function hideOverlay() {
			$("#capture").hide();
			if (sensor) {
						listenSensor();
						sensor = undefined;
						hideSensorOverlay();
			}
			else if (actuator) {
						actuator = undefined;
						hideActuatorOverlay();
			}
}
function showSensorOverlay() {
		$("#overlay").show();
		$("#serviceName").text(sensor.displayName);
		$("#serviceDescription").text(sensor.description);
		$("#sensorButton").show().text("Start");
		listenSensor();
}
function showActuatorOverlay() {
			$("#overlay").show();
			$("#serviceName").text(actuator.displayName);
			$("#serviceDescription").text(actuator.description);
			$("#actuatorSlider").show().slider({ min: actuator.range[0][0], max: actuator.range[0][(actuator.range[0].length - 1)], step:actuator.range[0][1] - actuator.range[0][0] });
			$("#actuatorButton").show().text("Apply");
}

function hideSensorOverlay() {
			$("#overlay").hide();
			$("#sensor-chart").hide();
			$("#valueDiv").hide();
			$("#values").text("");
			$("#sensor-chart").hide();
			$("chart-options").hide();
			sensor.removeEventListener('sensor', eventListenerFunction, true);
}

function hideActuatorOverlay() {
			$("#overlay").hide();
			$("#actuatorSlider").hide();
			$("#actuatorButton").hide();

}

function applyOptions() {
        var mode = $('#graph-options option:selected').attr('value');
	alert(mode);
	var rateVal = $('rate').val();
	if(mode === "")
			alert("Choose a valide mode");
			else{
						if(mode === "fixedinterval" && rate === "")
									alert("Choose a valid rate (>0)");
						else{
									var params = {eventFireMode:mode, rate:rateVal};
									//sensor.configureSensor(params, function(){}, function(){});
									sensorServices[i].configureSensor({rate: 500, eventFireMode: "fixedinterval"},
							function(){
								alert("Sensor reconfigured");
								
	
							},
							function (){
								alert("Error");
							});
						}
		}		
}

function discoverSensors() {
			for (var i =0; i < sensor_types.length; i++) {
						var serviceType = new ServiceType(sensor_types[i]);
						webinos.discovery.findServices(serviceType, {
									onFound: function (service) {
												sensorServices.push(service);
									},
									onLost: function(service){
									},
									onError: function(error){
									}
						});
			}
}
function discoverActuators(args) {
			for (var i = 0; i < actuator_types.length; i++) {
						var serviceType = new ServiceType(actuator_types[i]);
						webinos.discovery.findServices(serviceType, {
									onFound: function (service) {
												actuatorServices.push(service);
									},
									onLost: function(service){
									},
									onError: function(error){
									}
						});
			}
}
function find(id){
			for (var i = 0; i < sensorServices.length; i++) {
					if(sensorServices[i].id == id){
						if (sensor || actuator) {
									hideOverlay();
						}
						sensorServices[i].bind({onBind:function(){
						sensorServices[i].configureSensor({rate: 1000, eventFireMode: "fixedinterval"},
							function(){
								sensor = sensorServices[i];
								setTimeout(showOverlay(), 1000);
								//showOverlay();
								
	
							},
							function (){
								sensor = undefined;
								console.error('Error configuring Sensor ' + service.api);
							});
						}
						});
						return;
					}
			}
			for (i = 0; i < actuatorServices.length; i++) {
						if (actuatorServices[i].id == id) {
									if (sensor || actuator) {
												hideOverlay();
									}
								actuatorServices[i].bind({onBind:function(){
									actuator = actuatorServices[i];
									console.log(actuator);
								        setTimeout(showOverlay(), 100);
								        //showOverlay();
								        }
						                });
						return;
						}
			}
			alert("Nothing Found, Maybe a Wrong QR Code?");
			
}
function listenSensor(){
	if(!registered){
			sensor.addEventListener('sensor', eventListenerFunction, true);
			$("#sensorButton").text("Stop");
			registered = true;
			$("#sensor-chart").show();
			$("#chart-options").show();
			$("#valueDiv").show();
			sensor_chart = new Highcharts.Chart({
			chart: {
				renderTo: 'sensor-chart',
				type: 'area',
				marginRight: 10,
				backgroundColor:'rgba(255, 255, 255, 0.3)',
			},
			xAxis: {
				type: 'datetime',
				tickPixelInterval: 150
			},
			yAxis: {
				title: {
					text: ' '
				},
				plotLines: [{
					value: 0,
					width: 1,
					color: '#808080'
				}]
			},
			tooltip: {
				formatter: function() {
					return '<b>'+ this.series.name +'</b><br/>'+Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+Highcharts.numberFormat(this.y, 2);
				}
			},
			legend: {
				enabled: false
			},
			exporting: {
				enabled: false
			},
			series: [{
				id: 'values',
				name: 'values',
				data: []
			}]
		});
		sensor_chart.setTitle({ text: sensor.displayName});
		}
	else{
		sensor.removeEventListener('sensor', eventListenerFunction, true);
		//divValues.hidden = true;
		registered = false;
		$("#sensorButton").text("Start");
		$("values").text("");
	}
}

function applyActuator() {
			var values = new Array();
			values.push($("#actuatorSlider").slider( "option", "value" ));
			actuator.setValue(values, function(){alert("Value setted");}, function(){alert("Value not setted");});
}


